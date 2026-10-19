"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

import { inView } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Props = {
  children: ReactNode
  className?: string
  id?: string
  "aria-labelledby"?: string
}

/* .amk-card-block: css/amk-app.css:111. Fades up as it scrolls into view. */
export function CardBlock({ children, className, ...rest }: Props) {
  return (
    <motion.section
      {...inView(0)}
      className={cn(
        "min-w-0 rounded-lg border border-border-1 bg-surface-elevated p-[clamp(16px,2vw,22px)]",
        className
      )}
      {...rest}
    >
      {children}
    </motion.section>
  )
}
