import type { ReactNode } from "react"

import { Icon, type IconName } from "@/components/icons/icon"
import { cn } from "@/lib/utils"

type Props = {
  icon?: IconName
  title: string
  text?: string
  cta?: ReactNode
  className?: string
}

/* AmEmpty + .amk-empty*: css/amk-core.css:340-346 */
export function EmptyState({
  icon = "search",
  title,
  text,
  cta,
  className,
}: Props) {
  return (
    <div
      role="status"
      className={cn(
        "grid justify-items-center gap-[10px] rounded-lg border border-dashed border-border-2 bg-bg-2 px-6 py-[clamp(40px,7vw,80px)] text-center",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="mb-1 grid size-14 place-items-center rounded-full bg-bg-4 text-fg-2"
      >
        <Icon name={icon} size={24} />
      </span>
      <h3 className="font-display text-fs-20 font-bold">{title}</h3>
      {text ? <p className="max-w-[44ch] text-fg-3">{text}</p> : null}
      {cta ? <div className="mt-2">{cta}</div> : null}
    </div>
  )
}
