"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Icon, type IconName } from "@/components/icons/icon"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { ClubCrest } from "@/components/shared/club-crest"
import { Logo } from "@/components/shared/logo"
import { SafeImage } from "@/components/shared/safe-image"
import { SampleDataNotice } from "@/components/shared/sample-data-notice"
import { STATUS } from "@/features/applications/flow"
import { DATES, VERIFICATION } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import { listSaved } from "@/features/academies/api"
import {
  listConversations,
  messagesKeys,
} from "@/features/messages/conversations"
import { discoveryKeys } from "@/features/academies/query-keys"
import { endSession, personOf, useSession } from "@/features/auth/session"
import { useClubShellAcademy } from "@/features/club/hooks"
import { useLivePlayers } from "@/features/family/hooks"
import { ageOn } from "@/features/family/player-form"
import { todayISO } from "@/lib/date"
import { DEMO_CHROME, isLive } from "@/lib/data-source"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"
import { useAppView } from "@/stores/hooks"
import { getAppStore } from "@/stores/instance"
import type { View } from "@/stores/app-store"
import { AppGate } from "./app-gate"
import { Notifications, type Persona } from "./notifications"
import { HeadingSlotsContext, type HeadingSlots } from "./page-heading"
import { ThemeToggle } from "./theme-toggle"

type NavItem = {
  id: string
  label: string
  icon: IconName
  href: string
  /** pathname prefixes that make this item the active one */
  match: string[]
  badge?: number
  count?: number
}

/* navFor() in js/amk-shell.jsx */
function navFor(
  persona: Persona,
  view: View,
  liveSaved?: number,
  /** api mode: unread messages across conversations (section 14) */
  liveUnread?: number
): NavItem[] {
  const unread = (list: { type: string; id: string }[]) =>
    list.filter((n) => n.type === "message" && !view.reads[n.id]).length
  if (persona === "club") {
    return [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "grid",
        href: routes.club.dashboard,
        match: [routes.club.dashboard],
      },
      {
        id: "applications",
        label: "Applications",
        icon: "columns",
        href: routes.club.applications,
        match: [routes.club.applications, "/club/applicants"],
        badge: DEMO_CHROME
          ? view.hostApps.filter((a) => a.status === "submitted").length
          : undefined,
      },
      {
        id: "listings",
        label: "Listings",
        icon: "layers",
        href: routes.club.listings,
        match: [routes.club.listings],
      },
      {
        id: "messages",
        label: "Messages",
        icon: "chat",
        href: routes.club.messages,
        match: [routes.club.messages],
        badge: DEMO_CHROME
          ? unread(view.hostNotifications)
          : liveUnread || undefined,
      },
      {
        id: "payments",
        label: "Payments",
        icon: "wallet",
        href: routes.club.payments,
        match: [routes.club.payments],
      },
      {
        id: "profile",
        label: "Academy profile",
        icon: "building",
        href: routes.club.profile,
        match: [routes.club.profile],
      },
    ]
  }
  return [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "grid",
      href: routes.family.dashboard,
      match: [routes.family.dashboard],
    },
    {
      id: "applications",
      label: "Applications",
      icon: "doc",
      href: routes.family.applications,
      match: [routes.family.applications],
      badge: DEMO_CHROME
        ? view.familyApps.filter((a) => STATUS[a.status].group === "action")
            .length
        : undefined,
    },
    {
      id: "saved",
      label: "Saved",
      icon: "heart",
      href: routes.family.saved,
      match: [routes.family.saved],
      // api mode: GET /academy/me/saved meta.total (week 1 part 2, section 16)
      count: DEMO_CHROME ? view.saved.length : liveSaved || undefined,
    },
    {
      id: "messages",
      label: "Messages",
      icon: "chat",
      href: routes.family.messages(),
      match: [routes.family.messages()],
      badge: DEMO_CHROME
        ? unread(view.familyNotifications)
        : liveUnread || undefined,
    },
    {
      id: "players",
      label: "Player profiles",
      icon: "user",
      href: routes.family.players(),
      match: ["/family/players"],
    },
    {
      id: "payments",
      label: "Payments",
      icon: "wallet",
      href: routes.family.payments,
      match: [routes.family.payments],
    },
  ]
}

const BOTTOM = ["dashboard", "applications", "saved", "messages"]
const BOTTOM_CLUB = ["dashboard", "applications", "listings", "messages"]

const sbLink =
  "flex min-h-[38px] items-center gap-[10px] rounded-sm border-0 bg-transparent px-3 py-2 text-left text-fs-13 font-semibold text-fg-3 hover:bg-tint-neon-1 hover:text-fg-1"

function activeOf(pathname: string, items: NavItem[]): string {
  const hit = items.find((i) =>
    i.match.some((m) => pathname === m || pathname.startsWith(m + "/"))
  )
  return hit ? hit.id : ""
}

/*
 * AmShell: js/amk-shell.jsx, css/amk-app.css. Sidebar at 1025px and up, tab bar
 * and a "More" drawer at 1024px and below. Lives in the family and club layouts.
 */
export function AppShell({
  persona,
  children,
}: {
  persona: Persona
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const view = useAppView()
  const queryClient = useQueryClient()
  const session = useSession()
  const threadSide = persona === "club" ? "portal" : "me"
  const liveConversations = useQuery({
    queryKey: messagesKeys.list(threadSide),
    queryFn: () => listConversations(threadSide, true),
    enabled:
      isLive("messages") &&
      session.user?.role === (persona === "club" ? "academy" : "applicant"),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
  const liveSavedCount = useQuery({
    queryKey: [...discoveryKeys.saved(), "count"],
    queryFn: () => listSaved(1, 1, true),
    enabled:
      isLive("discovery") &&
      persona === "family" &&
      session.user?.role === "applicant",
  })
  const { role, hydrated, live } = session
  const shellAcademy = useClubShellAcademy()
  const livePlayers = useLivePlayers()
  // set by Sign out, so the "session ended" redirect to login does not run
  const signingOut = useRef(false)
  const [drawer, setDrawer] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const [titleEl, setTitleEl] = useState<HTMLElement | null>(null)
  const [actionsEl, setActionsEl] = useState<HTMLElement | null>(null)
  const [phoneActionsEl, setPhoneActionsEl] = useState<HTMLElement | null>(null)
  const slots: HeadingSlots = {
    title: titleEl,
    actions: actionsEl,
    phoneActions: phoneActionsEl,
  }

  useEffect(() => {
    if (!drawer) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false)
      if (e.key !== "Tab" || !drawerRef.current) return
      const f = drawerRef.current.querySelectorAll<HTMLElement>("a,button")
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    drawerRef.current?.querySelector<HTMLElement>("a,button")?.focus()
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [drawer])

  const wanted = persona === "club" ? "host" : "family"
  const blocked = hydrated && role !== wanted

  // api mode: no demo gate. A guest goes to login (back here after), a signed-in
  // account of the other type goes to its own area. src/proxy.ts does the same
  // before the page loads; this covers a session that ends while the page is open.
  useEffect(() => {
    if (!live || !blocked || signingOut.current) return
    if (role === "guest")
      router.replace(
        routes.login(pathname, persona === "club" ? "academy" : "family")
      )
    else
      router.replace(
        role === "host" ? routes.club.dashboard : routes.family.dashboard
      )
  }, [live, blocked, role, router, pathname, persona])

  // Until the saved session has been read, show nothing rather than a
  // sign-in gate that would flash for people who are signed in.
  if (!hydrated) return <div className="min-h-screen" />
  if (blocked)
    return live ? (
      <div className="min-h-screen" />
    ) : (
      <AppGate persona={persona} />
    )

  const club = persona === "club"
  const items = navFor(
    persona,
    view,
    liveSavedCount.data?.meta?.total,
    (liveConversations.data ?? []).reduce((n, r) => n + r.unread, 0)
  )
  const active = activeOf(pathname, items)
  const bottomIds = club ? BOTTOM_CLUB : BOTTOM
  const bottom = items.filter((i) => bottomIds.includes(i.id))
  const moreActive = !bottomIds.includes(active)
  const demoPerson = club ? view.host : view.parent
  const person = session.user
    ? { ...personOf(session.user), sub: session.user.email }
    : {
        ...demoPerson,
        sub:
          club && "title" in demoPerson ? demoPerson.title : "Family account",
      }
  const academy = club ? shellAcademy : null
  // family sidebar chips: the backend's player profiles once players are live
  const chips = isLive("players")
    ? (livePlayers.data?.players ?? []).map((p) => ({
        id: String(p.id),
        initials: (
          (p.first_name[0] ?? "") + (p.last_name[0] ?? "")
        ).toUpperCase(),
        firstName: p.first_name,
        age: p.date_of_birth ? ageOn(p.date_of_birth, todayISO()) : null,
      }))
    : view.players.map((p) => ({
        id: p.id,
        initials: p.initials,
        firstName: p.firstName,
        age: DATES.ageOn(p.dob, view.today),
      }))
  // the demo listing link and the demo switch exist only on demo data
  const publicListing = !live ? view.hostListings[0] : null

  const switchTo = () => {
    getAppStore().setRole(club ? "family" : "host")
    router.push(club ? routes.family.dashboard : routes.club.dashboard)
    setDrawer(false)
  }
  const signOut = () => {
    signingOut.current = true
    endSession()
    queryClient.clear()
    router.push(routes.home)
  }

  const sidebarBody = (onNavigate?: () => void) => (
    <>
      <div className="flex items-center gap-3 rounded-md border border-border-1 bg-surface-elevated p-3">
        <AvatarInitials
          initials={person.initials}
          size={44}
          tone={club ? "ink" : undefined}
        />
        <div className="grid min-w-0">
          <b className="text-fs-14">
            {person.firstName} {person.lastName}
          </b>
          <small className="truncate text-fs-12 text-fg-3">{person.sub}</small>
        </div>
      </div>
      {club && academy ? (
        <div className="flex items-center gap-[10px] px-1.5">
          {academy.logoUrl ? (
            <span className="relative size-7 flex-none overflow-hidden rounded-xs bg-bg-3">
              <SafeImage
                src={academy.logoUrl}
                alt=""
                fill
                unoptimized
                sizes="28px"
                className="object-contain"
              />
            </span>
          ) : (
            <ClubCrest crest={academy.crest} size={28} />
          )}
          <span className="grid min-w-0">
            <b className="text-fs-13 leading-[1.25]">{academy.name}</b>
            <small className="text-fs-12 text-fg-3">
              {academy.verification.kind === "badge"
                ? VERIFICATION[academy.verification.value].label
                : LIVE.verificationRejected}
            </small>
          </span>
        </div>
      ) : (
        <div aria-label="Players" className="flex flex-wrap gap-1.5 px-1">
          {chips.map((p) => (
            <Link
              key={p.id}
              href={routes.family.players(p.id)}
              onClick={onNavigate}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-2 bg-surface-elevated py-1 pr-[10px] pl-1 text-fs-13 font-semibold hover:border-border-accent"
            >
              <AvatarInitials initials={p.initials} size={26} tone="soft" />
              {p.firstName}
              {p.age !== null ? (
                <small className="font-medium text-fg-3">{p.age}</small>
              ) : null}
            </Link>
          ))}
        </div>
      )}
      <nav aria-label="Account" className="grid gap-0.5">
        {items.map((n) => {
          const isActive = n.id === active
          return (
            <Link
              key={n.id}
              href={n.href}
              aria-current={isActive ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "relative flex min-h-11 items-center gap-3 rounded-sm px-3 py-[10px] text-fs-14 font-semibold [transition:background_var(--dur-base),color_var(--dur-base)]",
                isActive
                  ? "bg-fg-1 text-bg-0 before:absolute before:top-2.5 before:bottom-2.5 before:-left-4 before:w-1 before:rounded-r-[4px] before:bg-gf-neon before:content-['']"
                  : "text-fg-2 hover:bg-tint-neon-1 hover:text-fg-1"
              )}
            >
              <Icon name={n.icon} size={18} />
              <span className="flex-1">{n.label}</span>
              {n.badge ? (
                <span
                  aria-label={n.badge + " need attention"}
                  className="grid h-[22px] min-w-[22px] place-items-center rounded-pill bg-gf-neon px-[7px] font-mono text-[11px] font-bold text-primary-foreground"
                >
                  {n.badge}
                </span>
              ) : null}
              {!n.badge && n.count ? (
                <span
                  className={cn(
                    "font-mono text-fs-12",
                    isActive ? "text-bg-0" : "text-fg-3"
                  )}
                >
                  {n.count}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto grid gap-0.5 border-t border-border-1 pt-3">
        {club && !publicListing ? null : (
          <Link
            href={
              club && publicListing
                ? routes.academy(publicListing.id)
                : routes.academies()
            }
            onClick={onNavigate}
            className={sbLink}
          >
            <Icon name={club ? "eye" : "search"} size={16} />
            {club ? "View public listing" : "Find academies"}
          </Link>
        )}
        {live ? null : (
          <button type="button" className={sbLink} onClick={switchTo}>
            <Icon name="switch" size={16} />
            Switch to {club ? "family" : "academy"} demo
          </button>
        )}
        <button type="button" className={sbLink} onClick={signOut}>
          <Icon name="logout" size={16} />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <HeadingSlotsContext value={slots}>
      <a
        href="#main"
        className="absolute top-[-60px] left-3 z-100 rounded-sm bg-gf-neon px-4 py-[10px] font-bold text-primary-foreground focus:top-3"
      >
        Skip to content
      </a>
      <div
        data-app-shell=""
        className="grid min-h-screen grid-cols-[var(--amk-sb-w)_minmax(0,1fr)] le-1024:grid-cols-[minmax(0,1fr)]"
      >
        <aside
          aria-label="Sidebar"
          className={cn(
            "sticky top-0 flex h-screen [scrollbar-width:thin] flex-col gap-[18px] overflow-y-auto border-r border-border-1 px-4 py-5 le-1024:hidden",
            club ? "bg-bg-3" : "bg-bg-2"
          )}
        >
          <div className="grid gap-2 px-1.5 pt-1 pb-2">
            <Logo size="sm" href={club ? routes.club.dashboard : routes.home} />
            {club ? (
              <span className="justify-self-start rounded-xs bg-fg-1 px-2 py-[3px] font-mono text-[10px] font-bold tracking-gf-wide text-bg-0 uppercase">
                For academies
              </span>
            ) : null}
          </div>
          {sidebarBody()}
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-(--amk-z-nav) flex min-h-[72px] items-center gap-4 border-b border-border-1 bg-glass-bg-nav-scrolled px-[clamp(16px,3vw,36px)] py-3 am-glass le-600:min-h-[60px] le-600:gap-[10px]">
            <div className="hidden le-1024:block">
              <Logo size="sm" compact href={routes.home} />
            </div>
            <div ref={setTitleEl} className="min-w-0 flex-1" />
            <div className="flex items-center gap-2">
              <div ref={setActionsEl} className="contents" />
              <span className="inline-flex le-600:hidden">
                <ThemeToggle small />
              </span>
              <Notifications persona={persona} />
            </div>
          </header>
          <main
            id="main"
            className="grid w-full max-w-none grid-cols-[minmax(0,1fr)] content-start gap-[clamp(20px,2.4vw,28px)] p-[clamp(20px,3vw,36px)] le-1024:pb-[calc(var(--amk-tabbar-h)+32px)]"
          >
            <SampleDataNotice />
            {/* phones (<=600px): the page's actions sit here, under the top bar,
                so the title keeps its room (filled by PageHeading) */}
            <div
              ref={setPhoneActionsEl}
              className="hidden flex-wrap justify-end gap-2 empty:hidden le-600:flex"
            />
            {children}
          </main>
        </div>
      </div>
      <nav
        aria-label="Account sections"
        className="fixed inset-x-0 bottom-0 z-(--amk-z-nav) hidden h-[calc(var(--amk-tabbar-h)+env(safe-area-inset-bottom))] grid-cols-5 border-t border-border-2 bg-glass-bg-nav-scrolled pb-[env(safe-area-inset-bottom)] am-glass le-1024:grid"
      >
        {bottom.map((n) => {
          const isActive = n.id === active
          return (
            <Link
              key={n.id}
              href={n.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // below 360px (small phones) the longest label ("Applications") needs 10px to fit its tab
                "grid min-w-0 place-items-center content-center gap-[3px] px-0.5 py-1.5 text-[11px] font-semibold [@media(max-width:359px)]:text-[10px]",
                isActive ? "text-fg-1" : "text-fg-3"
              )}
            >
              <span
                className={cn(
                  "relative grid h-7 w-11 place-items-center rounded-pill",
                  isActive && "bg-gf-neon text-primary-foreground"
                )}
              >
                <Icon name={n.icon} size={20} />
                {n.badge ? (
                  <i className="absolute -top-1 right-0.5 grid h-4 min-w-4 place-items-center rounded-pill bg-fg-1 px-1 text-[10px] text-bg-0 not-italic">
                    {n.badge}
                  </i>
                ) : null}
              </span>
              <span className="max-w-full truncate">
                {n.label === "Player profiles" ? "Players" : n.label}
              </span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-expanded={drawer}
          aria-controls="app-more"
          className={cn(
            "grid min-w-0 place-items-center content-center gap-[3px] border-0 bg-transparent px-0.5 py-1.5 text-[11px] font-semibold [@media(max-width:359px)]:text-[10px]",
            moreActive ? "text-fg-1" : "text-fg-3"
          )}
        >
          <span
            className={cn(
              "relative grid h-7 w-11 place-items-center rounded-pill",
              moreActive && "bg-gf-neon text-primary-foreground"
            )}
          >
            <Icon name="menu" size={20} />
          </span>
          More
        </button>
      </nav>
      {drawer ? (
        <div
          className="fixed inset-0 z-(--amk-z-overlay) flex animate-fade justify-end bg-overlay-strong"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDrawer(false)
          }}
        >
          <div
            id="app-more"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            ref={drawerRef}
            className="flex h-full w-[min(340px,92vw)] flex-col gap-4 overflow-y-auto border-l border-border-2 bg-bg-2 p-4"
          >
            <div className="flex items-center justify-between">
              <Logo size="sm" />
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="grid size-10 place-items-center rounded-pill border border-border-2 bg-transparent p-0 text-fg-2 hover:text-fg-1"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            {sidebarBody(() => setDrawer(false))}
            <div className="flex items-center justify-between px-3 py-2 text-fs-13 text-fg-3">
              <span>Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : null}
    </HeadingSlotsContext>
  )
}
