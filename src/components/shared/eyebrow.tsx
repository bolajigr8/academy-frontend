import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/* .amk-eyebrow: css/amk-core.css:96-103 (the neon dash is the ::before) */
export function Eyebrow({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <p
      className={cn(
        "mb-4 inline-flex items-center gap-2 font-mono text-fs-12 font-bold tracking-gf-widest text-fg-2 uppercase before:h-0.5 before:w-[18px] before:flex-none before:rounded-[2px] before:bg-gf-neon before:content-['']",
        className
      )}
    >
      {children}
    </p>
  )
}
