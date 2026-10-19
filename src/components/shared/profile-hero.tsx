import type { ReactNode } from "react"

/*
 * .amk-profile: a player header with the hollow age numeral behind it
 * (css/amk-app.css, profile rules; one column for the side slot at 900px and below).
 * Used by the academy's applicant page and the family's player profiles.
 */
export function ProfileHero({
  id,
  age,
  avatar,
  meta,
  name,
  line,
  side,
}: {
  /** id of the name heading (the section is labelled by it) */
  id: string
  age: number | null
  avatar: ReactNode
  meta: ReactNode
  name: ReactNode
  line: ReactNode
  /** the right-hand slot: eligibility, a completeness meter */
  side: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 overflow-hidden rounded-lg border border-border-1 bg-surface-elevated p-[clamp(18px,2.4vw,26px)] le-900:grid-cols-[auto_minmax(0,1fr)]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[18px] -bottom-[18px] font-display text-[140px] leading-[0.85] font-bold tracking-[-0.04em] text-transparent tabular-nums opacity-35 [-webkit-text-stroke:1.5px_var(--amk-accent-ink)]"
      >
        {age}
      </span>
      {avatar}
      <div className="grid min-w-0 gap-1">
        <p className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
          {meta}
        </p>
        <h2
          id={id}
          className="font-display text-[clamp(24px,2.6vw,32px)] leading-none font-bold uppercase"
        >
          {name}
        </h2>
        <p className="text-fs-14 text-fg-2">{line}</p>
      </div>
      <div className="relative w-[220px] le-900:col-span-full le-900:w-full">
        {side}
      </div>
    </section>
  )
}
