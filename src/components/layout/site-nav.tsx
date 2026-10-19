"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Icon } from "@/components/icons/icon"
import { Logo } from "@/components/shared/logo"
import { Button, buttonVariants } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { NAV } from "@/data/copy"
import { useScrolled } from "@/hooks/use-scrolled"
import { listSaved } from "@/features/academies/api"
import { discoveryKeys } from "@/features/academies/query-keys"
import { endSession, useSession } from "@/features/auth/session"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"
import { DEMO_CHROME, isLive } from "@/lib/data-source"
import { useAppView } from "@/stores/hooks"

import { AccountMenu, accountLinks } from "./account-menu"
import { ThemeToggle } from "./theme-toggle"

const isCurrent = (pathname: string, href: string) => {
  if (href.includes("#")) return false
  const path = href.split("?")[0]
  return pathname === path || pathname.startsWith(path + "/")
}

const drawerLink =
  "flex items-center justify-between border-b border-border-1 py-[14px] text-fs-16 font-semibold text-fg-1"

/* AmNav + .amk-nav*: js/amk-ui.jsx, css/amk.css:9-71 and responsive rules */
export function SiteNav() {
  const pathname = usePathname()
  const view = useAppView()
  const { role, user } = useSession()
  const queryClient = useQueryClient()
  const scrolled = useScrolled()
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    drawerRef.current?.querySelector<HTMLElement>("a,button")?.focus()
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  // api mode: GET /academy/me/saved meta.total for a signed-in family (section 16)
  const liveSaved = useQuery({
    queryKey: [...discoveryKeys.saved(), "count"],
    queryFn: () => listSaved(1, 1, true),
    enabled: isLive("discovery") && user?.role === "applicant",
  })
  const savedCount = DEMO_CHROME
    ? view.saved.length
    : (liveSaved.data?.meta?.total ?? 0)

  return (
    <header
      className={cn(
        "sticky top-0 z-(--amk-z-nav) border-b border-border-1 bg-glass-bg-nav am-glass [transition:background_var(--dur-base)_var(--ease-out),box-shadow_var(--dur-base)_var(--ease-out)]",
        scrolled && "bg-glass-bg-nav-scrolled shadow-(--shadow-nav)"
      )}
    >
      <a
        href="#main"
        className="absolute top-[-60px] left-3 z-100 rounded-sm bg-gf-neon px-4 py-[10px] font-bold text-primary-foreground focus:top-3"
      >
        Skip to content
      </a>
      <div className="am-container flex min-h-(--amk-nav-h) items-center gap-6">
        <Logo />
        <nav
          aria-label="Primary"
          className="flex gap-5 le-1180:gap-4 le-1024:hidden"
        >
          {NAV.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isCurrent(pathname, l.href) ? "page" : undefined}
              className="relative py-2 text-fs-14 font-semibold text-fg-2 transition-colors duration-(--dur-base) ease-out after:absolute after:inset-x-0 after:bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-[2px] after:bg-gf-neon after:transition-transform after:duration-(--dur-base) after:ease-out after:content-[''] hover:text-fg-1 hover:after:scale-x-100 aria-[current=page]:text-fg-1 aria-[current=page]:after:scale-x-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle small />
          <Link
            href={routes.family.saved}
            aria-label={`Saved academies, ${savedCount}`}
            className="relative grid size-[42px] place-items-center rounded-full text-fg-1 transition-colors duration-(--dur-base) ease-out hover:bg-tint-neon-2 le-480:hidden"
          >
            <Icon name="heart" size={18} />
            {savedCount > 0 ? (
              <span className="absolute top-[3px] right-px grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-gf-neon px-[5px] font-mono text-[10px] font-bold text-primary-foreground">
                {savedCount}
              </span>
            ) : null}
          </Link>
          <Link
            href={routes.register("academy")}
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "le-1180:hidden"
            )}
          >
            {NAV.listCta}
          </Link>
          <AccountMenu />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="site-drawer"
            aria-label={open ? "Close menu" : "Open menu"}
            className="hidden size-11 items-center justify-center rounded-sm border border-border-2 bg-transparent p-0 hover:border-border-accent hover:bg-tint-neon-1 le-1024:inline-flex"
          >
            <Icon name={open ? "x" : "menu"} size={20} />
          </button>
        </div>
      </div>
      <div
        id="site-drawer"
        ref={drawerRef}
        hidden={!open}
        className="max-h-[calc(100vh-var(--amk-nav-h))] overflow-auto border-t border-border-1 bg-glass-bg-nav-scrolled px-(--gutter) pt-2 pb-6 ge-1025:hidden!"
      >
        <nav aria-label="Mobile">
          {NAV.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={drawerLink}
              onClick={() => setOpen(false)}
            >
              {l.label}
              <Icon name="chevr" size={16} />
            </Link>
          ))}
          {accountLinks(role).map((l) => (
            <Link key={l.href} href={l.href} className={drawerLink}>
              {l.label}
              <Icon name="chevr" size={16} />
            </Link>
          ))}
          <Link href={routes.family.saved} className={drawerLink}>
            Saved academies ({savedCount})
            <Icon name="chevr" size={16} />
          </Link>
        </nav>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {open ? <ThemeToggle /> : null}
          {role === "guest" ? (
            <ButtonLink href={routes.login()} variant="ink">
              Sign in
            </ButtonLink>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                endSession()
                queryClient.clear()
                setOpen(false)
              }}
            >
              Sign out
            </Button>
          )}
          <ButtonLink href={routes.register("academy")} variant="primary">
            {NAV.listCta}
          </ButtonLink>
        </div>
      </div>
    </header>
  )
}
