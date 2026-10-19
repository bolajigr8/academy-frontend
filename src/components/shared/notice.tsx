import type { ReactNode } from "react"

import { Icon, type IconName } from "@/components/icons/icon"
import { cn } from "@/lib/utils"

type Tone = "info" | "warning" | "success" | "neutral"

const dot: Record<Tone, string> = {
  info: "[--amk-dot:var(--gf-info)]",
  warning: "[--amk-dot:var(--gf-warning)]",
  success: "[--amk-dot:var(--gf-success)]",
  neutral: "[--amk-dot:var(--border-3)]",
}

/* .amk-notice + --warning/--success/--neutral: css/amk-core.css:400-410 */
export function Notice({
  tone = "info",
  icon = "info",
  className,
  children,
}: {
  tone?: Tone
  icon?: IconName
  className?: string
  children: ReactNode
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-3 rounded-sm border border-l-4 border-border-2 border-l-(color:--amk-dot) bg-surface-elevated px-4 py-[14px] text-fs-14 text-fg-2 [&_b]:text-fg-1",
        dot[tone],
        className
      )}
    >
      <Icon name={icon} size={16} className="mt-px flex-none text-fg-1" />
      <span>{children}</span>
    </p>
  )
}
