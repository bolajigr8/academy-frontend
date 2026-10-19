"use client"

import { Icon } from "@/components/icons/icon"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Logo } from "@/components/shared/logo"
import { ButtonLink } from "@/components/ui/button-link"
import { APPLY } from "@/data/apply-copy"

/* The Apply to Join header (Shell in apply.html + .amk-flowbar*, css/amk-pages.css:399-402, 466) */
export function FlowBar({
  exitHref,
  exitLabel = APPLY.saveAndExit,
}: {
  exitHref: string
  /** api mode step 1 saves nothing yet: "Back to the program" */
  exitLabel?: string
}) {
  return (
    <header className="sticky top-0 z-(--amk-z-nav) border-b border-border-1 bg-glass-bg-nav-scrolled am-glass">
      <div className="am-container flex min-h-16 items-center gap-4 le-480:gap-2">
        <Logo size="sm" />
        <span className="border-l border-border-2 pl-4 font-mono text-fs-12 font-bold tracking-gf-wide text-fg-2 uppercase le-720:hidden">
          {APPLY.title}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle small />
          {/* small phones: an arrow only (the label stays for screen readers) */}
          <ButtonLink href={exitHref} variant="ghost" size="sm">
            <Icon name="arrowl" size={16} className="hidden le-480:block" />
            <span className="le-480:am-sr">{exitLabel}</span>
          </ButtonLink>
        </div>
      </div>
    </header>
  )
}
