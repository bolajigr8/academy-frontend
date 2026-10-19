"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { Icon, type IconName } from "@/components/icons/icon"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { buttonVariants } from "@/components/ui/button"
import { useDismiss } from "@/hooks/use-dismiss"
import { endSession, personOf, useSession } from "@/features/auth/session"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"
import { getAppStore } from "@/stores/instance"
import { useAppView } from "@/stores/hooks"

export type AccountLink = { href: string; label: string; icon: IconName }

/** accountLinks() in js/amk-ui.jsx */
export function accountLinks(role: "guest" | "family" | "host"): AccountLink[] {
  if (role === "family") {
    return [
      { href: routes.family.dashboard, label: "Dashboard", icon: "grid" },
      { href: routes.family.applications, label: "Applications", icon: "doc" },
      { href: routes.family.saved, label: "Saved academies", icon: "heart" },
      { href: routes.family.messages(), label: "Messages", icon: "chat" },
      { href: routes.family.players(), label: "Player profiles", icon: "user" },
    ]
  }
  if (role === "host") {
    return [
      { href: routes.club.dashboard, label: "Academy dashboard", icon: "grid" },
      {
        href: routes.club.applications,
        label: "Applications",
        icon: "columns",
      },
      { href: routes.club.listings, label: "Listings", icon: "layers" },
      { href: routes.club.messages, label: "Messages", icon: "chat" },
    ]
  }
  return []
}

const menuItem =
  "flex w-full items-center gap-[10px] rounded-[6px] border-0 bg-transparent p-[10px] text-left text-fs-14 font-medium text-fg-2 hover:bg-tint-neon-2 hover:text-fg-1"

/* AmAccountMenu + .amk-menu*: js/amk-ui.jsx, css/amk.css:45-66 */
export function AccountMenu() {
  const router = useRouter()
  const view = useAppView()
  const queryClient = useQueryClient()
  const { role, user, live } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, ref)

  if (role === "guest") {
    return (
      <Link
        href={routes.login()}
        className={cn(
          buttonVariants({ variant: "ink", size: "sm" }),
          "le-720:hidden"
        )}
      >
        Sign in
      </Link>
    )
  }

  const demoPerson = role === "host" ? view.host : view.parent
  const person = user
    ? { ...personOf(user), sub: user.email }
    : {
        ...demoPerson,
        sub:
          role === "host" && "title" in demoPerson
            ? demoPerson.title + " · Valencia International"
            : "Family account",
      }
  const switchTo = () => {
    getAppStore().setRole(role === "host" ? "family" : "host")
    router.push(
      role === "host" ? routes.family.dashboard : routes.club.dashboard
    )
    setOpen(false)
  }

  return (
    <div className="relative le-720:hidden" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Account menu for ${person.firstName} ${person.lastName}`}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 items-center gap-2 rounded-pill border border-border-2 bg-surface-elevated py-[5px] pr-[6px] pl-3 [transition:box-shadow_var(--dur-base)_var(--ease-out),border-color_var(--dur-base)_var(--ease-out)] hover:border-border-3 hover:shadow-(--shadow-sm)"
      >
        <Icon name="menu" size={16} />
        <AvatarInitials
          initials={person.initials}
          size={30}
          className="le-720:hidden"
          tone={role === "host" ? "ink" : undefined}
        />
      </button>
      {open ? (
        <div className="absolute top-[calc(100%+8px)] right-0 z-(--amk-z-overlay) w-[280px] animate-[rise_var(--dur-base)_var(--ease-out)] overflow-hidden rounded-md border border-border-2 bg-surface-elevated shadow-(--shadow-lg)">
          <div className="grid gap-0.5 border-b border-border-1 px-4 py-[14px]">
            <b className="text-fs-14">
              {person.firstName} {person.lastName}
            </b>
            <span className="truncate text-fs-12 text-fg-3">{person.sub}</span>
          </div>
          <ul className="p-1.5">
            {accountLinks(role).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={cn(menuItem)} onClick={close}>
                  <Icon name={l.icon} size={16} />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-border-1 p-1.5">
            {live ? null : (
              <button type="button" className={menuItem} onClick={switchTo}>
                <Icon name="switch" size={16} /> Switch to{" "}
                {role === "host" ? "family" : "academy"} demo
              </button>
            )}
            <button
              type="button"
              className={menuItem}
              onClick={() => {
                endSession()
                queryClient.clear()
                close()
              }}
            >
              <Icon name="logout" size={16} /> Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
