import { STATUS } from "@/features/applications/flow"
import type { AppStatus } from "@/features/applications/types"

import { StatusPill } from "./status-pill"

/* AmStatus (js/amk-core.jsx): an application status shown with its label and tone */
export function StatusBadge({
  status,
  className,
}: {
  status: AppStatus
  className?: string
}) {
  const meta = STATUS[status]
  if (!meta) return null
  return (
    <StatusPill tone={meta.tone} className={className}>
      {meta.label}
    </StatusPill>
  )
}
