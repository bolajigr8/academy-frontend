import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type Props = {
  tone?: "neon" | "ink"
  /** .amk-tag--mono: uppercase mono label */
  mono?: boolean
  className?: string
  children: ReactNode
}

/* .amk-tag + --neon/--ink/--mono: css/amk-core.css:206-213 */
export function Tag({ tone, mono = false, className, children }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-pill border border-border-1 bg-bg-2 px-[10px] py-1 text-fs-12 font-semibold whitespace-nowrap text-fg-2",
        tone === "neon" && "border-gf-neon bg-gf-neon text-text-on-neon",
        tone === "ink" && "border-fg-1 bg-fg-1 text-bg-0",
        mono && "font-mono text-[11px] tracking-gf-wide uppercase",
        className
      )}
    >
      {children}
    </span>
  )
}
