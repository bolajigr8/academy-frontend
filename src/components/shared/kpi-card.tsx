"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

import { Icon, type IconName } from "@/components/icons/icon"
import { staggerItem, staggerParent } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Tone = "neon" | "ink"

type Props = {
  label: string
  value: string | number
  sub?: string
  icon?: IconName
  tone?: Tone
  /** the smaller value used inside the payment box (.amk-paybox__sum .amk-kpi__v) */
  compact?: boolean
}

/* AmKpi + .amk-kpi*: js/amk-shell.jsx, css/amk-app.css:113-120 and 387 (480px padding) */
const toneText: Record<Tone | "default", string> = {
  default: "text-fg-3",
  neon: "text-text-on-neon",
  ink: "text-bg-0",
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  tone,
  compact = false,
}: Props) {
  const text = toneText[tone ?? "default"]
  return (
    <motion.div
      {...staggerItem}
      className={cn(
        "grid min-w-0 gap-1.5 rounded-md border border-border-1 bg-surface-elevated p-[18px] le-480:p-[14px]",
        tone === "neon" && "border-gf-neon bg-gf-neon text-text-on-neon",
        tone === "ink" && "border-fg-1 bg-fg-1 text-bg-0"
      )}
    >
      <div className={cn("flex items-center justify-between gap-2", text)}>
        <span
          className={cn(
            "font-mono text-fs-12 tracking-gf-wide uppercase",
            text
          )}
        >
          {label}
        </span>
        {icon ? <Icon name={icon} size={18} /> : null}
      </div>
      <b
        className={cn(
          "font-display text-[clamp(30px,3vw,40px)] leading-none font-bold tracking-[-0.03em] tabular-nums",
          compact && "text-[clamp(22px,2.2vw,30px)]"
        )}
      >
        {value}
      </b>
      {sub ? <small className={cn("text-fs-12", text)}>{sub}</small> : null}
    </motion.div>
  )
}

/* .amk-kpis / .amk-kpis--8: four columns, two at 900px and below (css/amk-app.css:113 and 380) */
export function KpiGrid({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <motion.section
      {...staggerParent}
      aria-label={label}
      className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-3 le-900:grid-cols-[repeat(2,minmax(0,1fr))]"
    >
      {children}
    </motion.section>
  )
}
