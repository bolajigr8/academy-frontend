"use client"

import { motion } from "framer-motion"

import { CLUB } from "@/data/club-copy"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const SHAPE = [0.62, 0.7, 0.66, 0.81, 0.77, 0.9, 0.95, 1]

/* AmViewsChart + .amk-chart*: js/amk-host.jsx, css/amk-app.css:300-306. 8 weeks, deterministic. */
export function ViewsChart({
  total,
  weeks = 8,
}: {
  total: number
  weeks?: number
}) {
  const base = total / 4.3
  const vals = SHAPE.slice(-weeks).map((k, i) =>
    Math.round(base * k * (i % 2 ? 1.04 : 0.97))
  )
  const max = Math.max(...vals)
  const W = 560
  const H = 180
  const pad = 22
  const bw = (W - pad * 2) / vals.length
  return (
    <figure className="grid gap-[10px]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Listing views per week, last ${weeks} weeks: ${vals.join(", ")}`}
        className="h-[180px] w-full overflow-visible"
      >
        <line
          className="stroke-border-2"
          x1={pad}
          x2={W - pad}
          y1={H - pad}
          y2={H - pad}
        />
        {vals.map((v, i) => {
          const h = (v / max) * (H - pad * 2.4)
          const x = pad + i * bw + bw * 0.18
          const last = i === vals.length - 1
          return (
            <g key={i}>
              <motion.rect
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: easeOut }}
                style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
                className={cn(
                  "fill-fg-1",
                  last && "fill-gf-neon stroke-fg-1 stroke-1"
                )}
                x={x}
                y={H - pad - h}
                width={bw * 0.64}
                height={h}
                rx="4"
              />
              <text
                className="fill-fg-1 font-mono text-[10px] font-bold"
                x={x + bw * 0.32}
                y={H - pad - h - 6}
                textAnchor="middle"
              >
                {v}
              </text>
              <text
                className="fill-fg-3 font-mono text-[10px]"
                x={x + bw * 0.32}
                y={H - 6}
                textAnchor="middle"
              >
                {last ? CLUB.dashboard.thisWeek : `W${i + 1}`}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="text-fs-14 text-fg-3">
        {CLUB.dashboard.chartCaption}
      </figcaption>
    </figure>
  )
}
