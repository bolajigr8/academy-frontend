import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type Props = {
  as?: "h1" | "h2" | "h3"
  id?: string
  className?: string
  children: ReactNode
}

/*
 * .amk-h2: css/amk-core.css:81-89. The prototype relies on the browser's bold for
 * headings, so the weight is stated here (the reset removes the default).
 */
export function DisplayHeading({
  as: Tag = "h2",
  id,
  className,
  children,
}: Props) {
  return (
    <Tag
      id={id}
      className={cn(
        "font-display text-[clamp(28px,3.4vw,44px)] leading-[1.02] font-bold tracking-[-0.025em] text-fg-1 uppercase",
        className
      )}
    >
      {children}
    </Tag>
  )
}
