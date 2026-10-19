"use client"

import { motion } from "framer-motion"

import { easeOut } from "@/lib/motion"

type Props = {
  value: number
  max?: number
  label?: string
  right?: string | number
}

/* AmMeter + .amk-meter*: js/amk-core.jsx:534, css/amk-core.css:284-288 */
export function Meter({ value, max = 100, label, right }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  return (
    <div className="grid gap-1.5">
      {label ? (
        <div className="flex justify-between gap-2 text-fs-13 text-fg-2">
          <span>{label}</span>
          <b className="text-fg-1">{right ?? `${pct}%`}</b>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        className="h-2 overflow-hidden rounded-[99px] bg-bg-4"
      >
        <motion.div
          className="h-full rounded-[inherit] bg-gf-neon"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: easeOut }}
        />
      </div>
    </div>
  )
}
