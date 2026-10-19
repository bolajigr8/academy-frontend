import type { ReactNode } from "react"

import type { StatusTone } from "@/features/applications/types"
import { cn } from "@/lib/utils"

/* .amk-status + --info/--success/--warning/--ghost: css/amk-core.css:214-224 */
const tones: Record<StatusTone, string> = {
  ghost: "[--amk-dot:var(--fg-4)] text-fg-2",
  info: "[--amk-dot:var(--gf-info)]",
  success: "[--amk-dot:var(--gf-success)]",
  warning: "[--amk-dot:var(--gf-warning)] border-gf-warning",
}

export function StatusPill({
  tone = "ghost",
  className,
  children,
}: {
  tone?: StatusTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[7px] justify-self-start rounded-pill border border-border-2 bg-surface-elevated py-1 pr-[11px] pl-[9px] text-fs-12 font-bold whitespace-nowrap text-fg-1 [--amk-dot:var(--fg-4)] before:size-2 before:flex-none before:rounded-full before:bg-(color:--amk-dot) before:shadow-[0_0_0_3px_var(--bg-2)] before:content-['']",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
