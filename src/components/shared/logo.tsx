import Link from "next/link"

import { brand } from "@/data/brand"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

import { Crest } from "./crest"

type Props = {
  /** null renders a non-link lockup */
  href?: string | null
  size?: "sm" | "md" | "lg"
  compact?: boolean
  onPhoto?: boolean
  label?: string
  className?: string
}

/* .amk-logo*: css/amk-core.css:243-258. At <=480px the later css/amk.css:327 rule
   sets every size to 34px, so it is applied to all three here. */
const heights = {
  sm: "[--amk-logo-h:32px]",
  md: "[--amk-logo-h:40px]",
  lg: "[--amk-logo-h:64px]",
} as const

export function Logo({
  href = routes.home,
  size = "md",
  compact = false,
  onPhoto = false,
  label = "Golafly Academy home",
  className,
}: Props) {
  const cls = cn(
    "inline-flex flex-none items-center gap-[10px] text-fg-1 le-480:[--amk-logo-h:34px]",
    heights[size],
    className
  )

  const inner = (
    <>
      <Crest />
      <span
        aria-hidden="true"
        className={cn(
          "grid w-[calc(var(--amk-logo-h)*2.9)] gap-[calc(var(--amk-logo-h)*0.08)]",
          compact && "hidden"
        )}
      >
        <svg
          viewBox={brand.wordmark.viewBox}
          aria-hidden="true"
          focusable="false"
          className={cn(
            "h-auto w-full",
            onPhoto ? "fill-gf-white" : "fill-fg-1"
          )}
        >
          {brand.wordmark.paths.map((d) => (
            <path key={d} d={d} fillRule="evenodd" />
          ))}
        </svg>
        <span
          className={cn(
            "flex items-center gap-1.5 pl-[0.48em] font-display text-[calc(var(--amk-logo-h)*0.2)] leading-none font-bold tracking-[0.48em] uppercase before:h-[1.5px] before:flex-auto before:rounded-[1px] before:bg-amk-accent-ink before:content-[''] after:h-[1.5px] after:flex-auto after:rounded-[1px] after:bg-amk-accent-ink after:content-['']",
            onPhoto ? "text-gf-chalk" : "text-fg-2"
          )}
        >
          Academy
        </span>
      </span>
    </>
  )

  return href ? (
    <Link href={href} className={cls} aria-label={label}>
      {inner}
    </Link>
  ) : (
    <span className={cls} role="img" aria-label="Golafly Academy">
      {inner}
    </span>
  )
}
