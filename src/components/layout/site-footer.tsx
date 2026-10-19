import Link from "next/link"

import { Logo } from "@/components/shared/logo"
import { Pitch } from "@/components/shared/pitch"
import { FOOTER } from "@/data/copy"
import { routes } from "@/routes"

const siteHrefs: readonly string[] = Object.values(routes.site)

/** Links to the other Golafly sites are plain anchors; the rest are routes of this app. */
function FooterLink({ href, children }: { href: string; children: string }) {
  return siteHrefs.includes(href) ? (
    <a href={href}>{children}</a>
  ) : (
    <Link href={href}>{children}</Link>
  )
}

const underline = "underline underline-offset-[3px]"

/* AmFooter + .amk-foot*: js/amk-ui.jsx, css/amk.css:259-271 */
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border-1 bg-bg-2 pt-16 pb-6 le-720:[body:has([data-applybar])_&]:pb-[110px]">
      <Pitch
        variant="center"
        className="top-[-30%] right-[-10%] h-[160%] w-[60%]"
      />
      <div className="relative am-container">
        <div className="mb-12 grid grid-cols-[2fr_1fr_1fr_1fr] gap-8 le-1024:grid-cols-[1fr_1fr] le-720:grid-cols-[1fr]">
          <div className="grid content-start gap-4 le-1024:col-span-full">
            <Logo size="lg" />
            <p className="max-w-[36ch] text-fs-14 text-fg-3">{FOOTER.blurb}</p>
            <p className="max-w-[36ch] text-fs-14 text-fg-3">
              Part of the Golafly family ·{" "}
              <a
                href={routes.site.golafly}
                className={`text-fg-1 ${underline}`}
              >
                Golafly
              </a>{" "}
              ·{" "}
              <a href={routes.site.travel} className={`text-fg-1 ${underline}`}>
                Golafly Travel
              </a>
            </p>
          </div>
          {FOOTER.cols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-3 font-mono text-fs-12 font-bold tracking-gf-wide text-fg-1 uppercase">
                {col.title}
              </h2>
              <ul className="grid gap-2 [&_a]:text-fs-14 [&_a]:text-fg-3 [&_a]:transition-colors [&_a]:duration-(--dur-base) [&_a:hover]:text-fg-1 [&_a:hover]:underline [&_a:hover]:underline-offset-[3px]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FooterLink href={l.href}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-border-1 pt-6 text-fs-13 text-fg-3">
          <span>{FOOTER.bottomLeft}</span>
          <span>{FOOTER.bottomRight}</span>
        </div>
      </div>
    </footer>
  )
}
