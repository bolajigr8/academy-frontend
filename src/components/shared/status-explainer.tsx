import type { ReactNode } from "react"

import { STATUS } from "@/features/applications/flow"
import type { AppStatus, Role, StatusTone } from "@/features/applications/types"
import { cn } from "@/lib/utils"

import { StatusBadge } from "./status-badge"

/* AmExplainer + .amk-explain*: js/amk-shell.jsx, css/amk-app.css:137-142 */
const dot: Record<StatusTone, string> = {
  info: "[--amk-dot:var(--gf-info)]",
  success: "[--amk-dot:var(--gf-success)]",
  warning: "[--amk-dot:var(--gf-warning)]",
  ghost: "[--amk-dot:var(--border-3)]",
}

/** What the status means and what to do next, written for one side of the application. */
export function StatusExplainer({
  status,
  role = "family",
  action,
}: {
  status: AppStatus
  role?: Role
  /** the next step: a button or link, left-aligned (.amk-explain .amk-btn) */
  action?: ReactNode
}) {
  const m = STATUS[status]
  return (
    <div
      className={cn(
        "grid gap-[10px] rounded-md border border-l-4 border-border-2 border-l-(color:--amk-dot) bg-surface-elevated p-[18px]",
        dot[m.tone]
      )}
    >
      <div>
        <StatusBadge status={status} />
      </div>
      <p className="text-fs-14 text-fg-2">
        {role === "academy" ? m.host : m.family}
      </p>
      {action ? <div className="justify-self-start">{action}</div> : null}
    </div>
  )
}
