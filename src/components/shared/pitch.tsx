import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"

type Variant = "full" | "center" | "box" | "corner"

type Props = {
  variant?: Variant
  className?: string
  style?: CSSProperties
}

/* Chalk pitch lines in a 100x64 space: AmPitch (js/amk-core.jsx), .amk-pitch (css/amk-core.css:268-269) */
const shapes: Record<Variant, ReactNode> = {
  full: (
    <>
      <rect x="1" y="1" width="98" height="62" rx="0.5" />
      <path d="M50 1v62" />
      <circle cx="50" cy="32" r="9" />
      <rect x="1" y="17" width="15" height="30" />
      <rect x="84" y="17" width="15" height="30" />
      <rect x="1" y="25" width="5" height="14" />
      <rect x="94" y="25" width="5" height="14" />
      <path d="M16 26a7 7 0 0 1 0 12M84 26a7 7 0 0 0 0 12" />
    </>
  ),
  center: (
    <>
      <path d="M50 0v64" />
      <circle cx="50" cy="32" r="14" />
      <circle cx="50" cy="32" r="0.8" />
    </>
  ),
  box: (
    <>
      <rect x="20" y="0" width="60" height="26" />
      <rect x="36" y="0" width="28" height="9" />
      <path d="M38 26a14 14 0 0 0 24 0" />
    </>
  ),
  corner: (
    <>
      <path d="M0 12a12 12 0 0 0 12-12" />
      <path d="M0 40h30V0" />
    </>
  ),
}

export function Pitch({ variant = "full", className, style }: Props) {
  return (
    <svg
      className={cn(
        "pointer-events-none absolute fill-none stroke-current text-amk-line [&_*]:[vector-effect:non-scaling-stroke]",
        className
      )}
      style={style}
      viewBox="0 0 100 64"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      strokeWidth="1.2"
    >
      {shapes[variant]}
    </svg>
  )
}
