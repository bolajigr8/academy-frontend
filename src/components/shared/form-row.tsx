import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/* .amk-row / .amk-row--3: fields side by side, one column at 720px and below (css/amk-core.css:181-182, 448) */
export function FormRow({
  cols = 2,
  id,
  tabIndex,
  className,
  children,
}: {
  cols?: 2 | 3
  /** a jump target for the error summary (with tabIndex -1) */
  id?: string
  tabIndex?: number
  className?: string
  children: ReactNode
}) {
  return (
    <div
      id={id}
      tabIndex={tabIndex}
      className={cn(
        "grid gap-4 le-720:grid-cols-[1fr]",
        cols === 3
          ? "grid-cols-[repeat(3,minmax(0,1fr))]"
          : "grid-cols-[repeat(2,minmax(0,1fr))]",
        className
      )}
    >
      {children}
    </div>
  )
}
