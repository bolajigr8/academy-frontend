"use client"

import { motion } from "framer-motion"

import { Icon } from "@/components/icons/icon"
import { fmtStamp, timeline } from "@/features/applications/flow"
import type { AppEvent, AppStatus } from "@/features/applications/types"
import { staggerItem, staggerParent } from "@/lib/motion"
import { cn } from "@/lib/utils"

/* AmTimeline + .amk-tl*: js/amk-shell.jsx, css/amk-app.css:126-135 */
export function Timeline({
  app,
}: {
  app: { status: AppStatus; events?: AppEvent[] }
}) {
  const steps = timeline(app)
  return (
    <motion.ol {...staggerParent} className="grid">
      {steps.map((s) => (
        <motion.li
          {...staggerItem}
          key={s.key}
          className={cn(
            "relative grid grid-cols-[26px_minmax(0,1fr)] gap-3 pb-4 not-last:before:absolute not-last:before:top-[26px] not-last:before:bottom-0 not-last:before:left-3 not-last:before:w-0.5 not-last:before:bg-border-2 not-last:before:content-['']",
            s.state === "done" && "not-last:before:bg-fg-1",
            s.state === "skipped" && "opacity-[0.45]"
          )}
        >
          <>
            <span
              aria-hidden="true"
              className={cn(
                "grid size-[26px] place-items-center rounded-full border-2 border-border-3 bg-surface-elevated",
                s.state === "done" && "border-fg-1 bg-fg-1 text-bg-0",
                s.state === "current" &&
                  "border-gf-neon bg-gf-neon shadow-(--glow-neon-sm)",
                s.tone === "ghost" && "border-fg-3 bg-fg-3"
              )}
            >
              {s.state === "done" ? (
                <Icon name="check" size={12} sw={3} />
              ) : null}
            </span>
            <span className="grid gap-px pt-0.5">
              <b className="text-fs-14">{s.label}</b>
              <small className="text-fs-12 text-fg-3">
                {s.at
                  ? fmtStamp(s.at)
                  : s.state === "current"
                    ? "In progress"
                    : s.state === "skipped"
                      ? "—"
                      : "Next"}
              </small>
            </span>
            <span className="am-sr">{s.state}</span>
          </>
        </motion.li>
      ))}
    </motion.ol>
  )
}
