"use client"

import { Icon } from "@/components/icons/icon"
import { LIVE } from "@/data/live-copy"
import { cn } from "@/lib/utils"

export type JourneyStep = {
  label: string
  done: boolean
  /** id of the section to jump to (omitted: the step is not clickable) */
  target?: string
}

const t = LIVE.journey

/**
 * Scrolls to a section or field and moves focus there (keyboard and screen
 * readers follow). Several ids: the first one on the page wins.
 */
export function jumpTo(...ids: string[]) {
  const el = ids
    .map((id) => document.getElementById(id))
    .find((x): x is HTMLElement => x !== null)
  if (!el) return
  el.scrollIntoView({ block: "start", behavior: "smooth" })
  const focusable = el.matches("input,textarea,select,button")
    ? el
    : el.closest("section, [aria-labelledby]")
  if (focusable instanceof HTMLElement) {
    if (!focusable.matches("input,textarea,select,button"))
      focusable.setAttribute("tabindex", "-1")
    focusable.focus({ preventScroll: true })
  }
}

/*
 * Added (Oct 2026 UX round, no prototype screen): the steps of an application
 * from Apply to sending, styled like AmStepper (.amk-steps). Unlike a wizard,
 * questions and documents can be finished in any order, so each step carries
 * its own done state (from the backend's missing_for_submission) and every
 * step with a section can be tapped to jump there, done or not.
 * Phones show the current step's label only; the others keep their number.
 */
export function ApplicationJourney({
  steps,
  current,
}: {
  steps: JourneyStep[]
  current: number
}) {
  return (
    <nav aria-label={t.label} className="max-w-full min-w-0">
      <ol className="relative flex [scrollbar-width:none] items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {steps.map((s, i) => {
          const isCurrent = i === current
          const content = (
            <>
              <span
                className={cn(
                  "grid size-7 flex-none place-items-center rounded-full border-[1.5px] border-border-3 font-mono text-fs-12 font-bold text-fg-2",
                  s.done && "border-fg-1 bg-fg-1 text-bg-0",
                  isCurrent &&
                    "border-gf-neon bg-gf-neon text-text-on-neon shadow-(--glow-neon-sm)"
                )}
              >
                {s.done && !isCurrent ? (
                  <Icon name="check" size={14} sw={2.6} />
                ) : (
                  i + 1
                )}
              </span>
              <span className={cn(!isCurrent && "le-720:hidden")}>
                {s.label}
              </span>
              <span className="am-sr">, {s.done ? t.done : t.toDo}</span>
            </>
          )
          const cls = cn(
            "inline-flex min-h-9 items-center gap-2 rounded-[99px] border-0 bg-transparent py-1 pr-1.5 pl-1 text-fs-14 font-semibold whitespace-nowrap text-fg-3",
            isCurrent && "text-fg-1"
          )
          return (
            <li
              key={s.label}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex flex-none items-center gap-2 not-last:after:h-0.5 not-last:after:w-[clamp(12px,3vw,40px)] not-last:after:rounded-[2px] not-last:after:bg-border-2 not-last:after:content-['']",
                s.done && "not-last:after:bg-amk-accent-ink"
              )}
            >
              {s.target ? (
                <button
                  type="button"
                  onClick={() => jumpTo(s.target ?? "")}
                  className={cn(cls, "cursor-pointer hover:text-fg-1")}
                >
                  {content}
                </button>
              ) : (
                <span className={cls}>{content}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
