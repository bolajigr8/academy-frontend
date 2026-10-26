"use client"

import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"

import { Icon, type IconName } from "@/components/icons/icon"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { EmptyState } from "@/components/shared/empty-state"
import { Logo } from "@/components/shared/logo"
import { ADMIN } from "@/data/admin-copy"
import { endSession, useAdminSession } from "@/features/auth/session"
import { API_MODE } from "@/lib/data-source"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

/*
 * The Golafly admin shell. No prototype design exists for the admin area: it
 * follows the portal shell (same tokens, sidebar and top bar) and the layout
 * of the team's earlier admin (matchday): sidebar, page header, panels,
 * tables, detail pages, confirm dialogs.
 */

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: routes.admin.overview, label: ADMIN.nav.overview, icon: "grid" },
  {
    href: routes.admin.verifications,
    label: ADMIN.nav.verifications,
    icon: "shieldcheck",
  },
  { href: routes.admin.listings, label: ADMIN.nav.listings, icon: "layers" },
  {
    href: routes.admin.applications,
    label: ADMIN.nav.applications,
    icon: "doc",
  },
  {
    href: routes.admin.organizations,
    label: ADMIN.nav.organizations,
    icon: "building",
  },
  { href: routes.admin.users, label: ADMIN.nav.users, icon: "user" },
  // week 3 part 2
  { href: routes.admin.reviews, label: ADMIN.nav.reviews, icon: "star" },
  {
    href: routes.admin.enrollments,
    label: ADMIN.nav.enrollments,
    icon: "wallet",
  },
  { href: routes.admin.commission, label: ADMIN.nav.commission, icon: "euro" },
]

const sbLink =
  "flex min-h-[38px] items-center gap-[10px] rounded-sm px-3 py-2 text-fs-13 font-semibold text-fg-3 hover:bg-tint-neon-1 hover:text-fg-1"

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { hydrated, isAdmin, user } = useAdminSession()
  const signingOut = useRef(false)
  const login = pathname === "/admin/login"

  useEffect(() => {
    if (login || !hydrated || isAdmin || signingOut.current || !API_MODE) return
    router.replace(routes.admin.login(pathname))
  }, [login, hydrated, isAdmin, pathname, router])

  if (!API_MODE)
    return (
      <main id="main" className="am-container py-16">
        <EmptyState icon="info" title={ADMIN.tag} text={ADMIN.apiOnly} />
      </main>
    )
  if (login) return <>{children}</>
  if (!hydrated || !isAdmin) return <div className="min-h-screen" />

  const active = NAV.filter((n) =>
    n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)
  ).pop()
  const signOut = () => {
    signingOut.current = true
    endSession()
    queryClient.clear()
    router.push(routes.admin.login())
  }

  return (
    <div
      data-app-shell=""
      className="grid min-h-screen grid-cols-[var(--amk-sb-w)_minmax(0,1fr)] le-1024:grid-cols-[minmax(0,1fr)]"
    >
      <aside
        aria-label="Admin"
        className="sticky top-0 flex h-screen [scrollbar-width:thin] flex-col gap-[18px] overflow-y-auto border-r border-border-1 bg-bg-3 px-4 py-5 le-1024:hidden"
      >
        <div className="grid gap-2 px-1.5 pt-1 pb-2">
          <Logo size="sm" href={routes.admin.overview} />
          <span className="justify-self-start rounded-xs bg-gf-neon px-2 py-[3px] font-mono text-[10px] font-bold tracking-gf-wide text-text-on-neon uppercase">
            {ADMIN.tag}
          </span>
        </div>
        <nav aria-label={ADMIN.tag} className="grid gap-0.5">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active?.href === n.href ? "page" : undefined}
              className={cn(
                sbLink,
                active?.href === n.href &&
                  "bg-fg-1 text-bg-0 hover:bg-fg-1 hover:text-bg-0"
              )}
            >
              <Icon name={n.icon} size={16} /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-1 border-t border-border-1 pt-3">
          <p className="truncate px-3 text-fs-12 text-fg-3">{user?.email}</p>
          <button
            type="button"
            className={cn(sbLink, "border-0 bg-transparent text-left")}
            onClick={signOut}
          >
            <Icon name="logout" size={16} /> {ADMIN.signOut}
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-(--amk-z-nav) flex min-h-[64px] items-center gap-3 border-b border-border-1 bg-glass-bg-nav-scrolled px-[clamp(16px,3vw,36px)] py-3 am-glass">
          <span className="hidden flex-none le-1024:inline-flex">
            <Logo size="sm" compact href={routes.admin.overview} />
          </span>
          {/* phones and tablets: one button naming the current section; it
              opens every section, so nothing hides in a sideways strip */}
          <AdminMenu active={active?.href} label={active?.label ?? ADMIN.tag} />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              aria-label={ADMIN.signOut}
              onClick={signOut}
              className="hidden size-10 place-items-center rounded-full border border-border-2 text-fg-2 le-1024:grid"
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </header>
        <motion.main
          id="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // one column that can shrink: wide tables scroll inside their own box, never the page
          className="grid w-full grid-cols-[minmax(0,1fr)] content-start gap-[clamp(18px,2.2vw,26px)] p-[clamp(16px,3vw,32px)]"
        >
          <>{children}</>
        </motion.main>
      </div>
    </div>
  )
}

function AdminMenu({ active, label }: { active?: string; label: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  // a new page closes the menu
  const [seen, setSeen] = useState(pathname)
  if (seen !== pathname) {
    setSeen(pathname)
    setOpen(false)
  }
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])
  return (
    <div ref={ref} className="relative hidden min-w-0 le-1024:block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="admin-menu"
        onClick={() => setOpen(!open)}
        className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-pill border border-border-2 bg-surface-elevated px-4 text-fs-14 font-semibold text-fg-1"
      >
        <Icon name="menu" size={16} />
        <span className="truncate">{label}</span>
        <Icon name="chev" size={14} />
      </button>
      {open ? (
        <nav
          id="admin-menu"
          aria-label={ADMIN.tag}
          className="absolute top-[calc(100%+8px)] left-0 z-(--amk-z-overlay) grid w-[min(280px,calc(100vw-32px))] gap-0.5 rounded-md border border-border-2 bg-surface-elevated p-1.5 shadow-(--shadow-xl)"
        >
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active === n.href ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-fs-14 font-semibold text-fg-2 hover:bg-tint-neon-1",
                active === n.href && "bg-fg-1 text-bg-0 hover:bg-fg-1"
              )}
            >
              <Icon name={n.icon} size={17} /> {n.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  )
}
