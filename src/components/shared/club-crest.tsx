"use client"

import { useId } from "react"

import { cn } from "@/lib/utils"

export type ClubCrestData = {
  shape: 0 | 1 | 2 | 3
  pattern: 0 | 1 | 2 | 3
  initials: string
}

type Props = {
  crest: ClubCrestData
  size?: number
  /** adds the star used for Club Academy verification */
  club?: boolean
  label?: string
  className?: string
}

/* AmClubCrest (js/amk-core.jsx) + .amk-club-crest*: css/amk-core.css:262-266 */
const SHAPES = [
  "M4 4h40v22c0 12-9 20-20 24C13 46 4 38 4 26z",
  "M24 2l20 7v17c0 12-9 20-20 24C13 46 4 38 4 26V9z",
  "M6 4h36l2 6v16c0 12-9 20-20 24C13 46 4 38 4 26V10z",
  "M24 2c8 4 13 4 20 4v20c0 12-9 20-20 24C13 46 4 38 4 26V6c7 0 12 0 20-4z",
] as const

const stripeClass = "fill-gf-neon opacity-90"

export function ClubCrest({
  crest,
  size = 36,
  club = false,
  label,
  className,
}: Props) {
  const id = "cc" + useId().replace(/[^a-zA-Z0-9]/g, "")
  const stripe = [
    null,
    <path key="s1" className={stripeClass} d="M0 34L48 10v8L0 42z" />,
    <rect
      key="s2"
      className={stripeClass}
      x="20"
      y="0"
      width="8"
      height="52"
    />,
    <path
      key="s3"
      className={stripeClass}
      d="M0 30l24-10 24 10v7L24 27 0 37z"
    />,
  ][crest.pattern]

  return (
    <svg
      className={cn("flex-none", className)}
      width={size}
      height={(size * 52) / 48}
      viewBox="0 0 48 52"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <clipPath id={id}>
          <path d={SHAPES[crest.shape]} />
        </clipPath>
      </defs>
      <path
        d={SHAPES[crest.shape]}
        className="fill-bg-4 stroke-border-3 stroke-2"
      />
      <g clipPath={`url(#${id})`}>{stripe}</g>
      <text
        className="fill-fg-1 font-display font-bold tracking-[-0.02em]"
        x="24"
        y={crest.pattern === 3 ? 22 : 27}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={crest.initials.length > 2 ? 12 : 15}
      >
        {crest.initials}
      </text>
      {club ? (
        <path
          className="fill-gf-neon stroke-gf-black stroke-[0.8]"
          d="M24 41l1.8 3.7 4 .5-3 2.8.8 4-3.6-2-3.6 2 .8-4-3-2.8 4-.5z"
          transform="translate(0 -6) scale(1)"
        />
      ) : null}
    </svg>
  )
}
