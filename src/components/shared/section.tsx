import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type Props = {
  id?: string
  /** .amk-section--alt: tinted band with top and bottom lines */
  alt?: boolean
  "aria-labelledby"?: string
  className?: string
  children: ReactNode
}

/* .amk-section and --alt: css/amk-core.css:68-69 */
export function Section({ alt = false, className, children, ...rest }: Props) {
  return (
    <section
      className={cn(
        "py-[clamp(56px,7vw,104px)]",
        alt && "border-y border-border-1 bg-bg-2",
        className
      )}
      {...rest}
    >
      {children}
    </section>
  )
}

/* .amk-head: eyebrow + heading on the left, one action on the right (css/amk.css:140) */
export function SectionHeader({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-[clamp(24px,3vw,40px)] flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div>{children}</div>
      {action}
    </div>
  )
}
