"use client"

import { motion } from "framer-motion"

import { Icon } from "@/components/icons/icon"
import { spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Props = {
  steps: readonly string[]
  current: number
  /** go back to a completed step */
  onStep?: (index: number) => void
  label?: string
}

/* AmStepper + .amk-steps / .amk-step*: js/amk-core.jsx:481, css/amk-core.css:374-388 and 452-453 */
export function Stepper({ steps, current, onStep, label = "Progress" }: Props) {
  return (
    <ol
      aria-label={label}
      className="flex [scrollbar-width:none] items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
    >
      {steps.map((s, i) => {
        const state =
          i < current ? "done" : i === current ? "current" : "upcoming"
        const content = (
          <>
            <motion.span
              layout
              transition={spring}
              className={cn(
                "grid size-7 flex-none place-items-center rounded-full border-[1.5px] border-border-3 font-mono text-fs-12 font-bold text-fg-2 [transition:background_var(--dur-base),border-color_var(--dur-base),color_var(--dur-base)]",
                state === "done" && "border-fg-1 bg-fg-1 text-bg-0",
                state === "current" &&
                  "border-gf-neon bg-gf-neon text-text-on-neon shadow-(--glow-neon-sm)"
              )}
            >
              {state === "done" ? (
                <Icon name="check" size={14} sw={2.6} />
              ) : (
                i + 1
              )}
            </motion.span>
            <span className={cn(state !== "current" && "le-720:hidden")}>
              {s}
            </span>
          </>
        )
        const btn = cn(
          "inline-flex items-center gap-2 rounded-[99px] border-0 bg-transparent py-1 pr-1.5 pl-1 text-fs-14 font-semibold text-fg-3",
          state === "current" && "text-fg-1"
        )
        return (
          <li
            key={s}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "flex flex-none items-center gap-2 not-last:after:h-0.5 not-last:after:w-[clamp(12px,3vw,40px)] not-last:after:rounded-[2px] not-last:after:bg-border-2 not-last:after:content-['']",
              state === "done" && "not-last:after:bg-amk-accent-ink"
            )}
          >
            {state === "done" && onStep ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96, transition: spring }}
                onClick={() => onStep(i)}
                aria-label={`Step ${i + 1}, ${s}, completed. Go back`}
                className={cn(btn, "cursor-pointer hover:text-fg-1")}
              >
                {content}
              </motion.button>
            ) : (
              <span className={cn(btn, "cursor-default")}>{content}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
