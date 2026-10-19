import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

type Props = {
  initials: string
  size?: number
  tone?: "ink" | "soft"
  className?: string
}

/* AmAvatar + .amk-av*: css/amk-core.css:275-283. Size is a dynamic value, passed as --amk-av. */
const tones = {
  ink: "bg-fg-1 text-bg-0",
  soft: "border border-border-2 bg-bg-4 text-fg-1",
} as const

export function AvatarInitials({
  initials,
  size = 36,
  tone,
  className,
}: Props) {
  return (
    <span
      aria-hidden="true"
      style={{ "--amk-av": `${size}px` } as CSSProperties}
      className={cn(
        "grid size-(--amk-av) flex-none place-items-center rounded-full font-display text-[calc(var(--amk-av)*0.36)] font-bold tracking-[-0.02em]",
        tone ? tones[tone] : "bg-primary text-primary-foreground",
        className
      )}
    >
      {initials}
    </span>
  )
}
