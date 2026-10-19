import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/* .amk-grid2 (7fr / 5fr, one column at 1200px and below): css/amk-app.css:122 and 380-382 */
export function Grid2({
  children,
  even = false,
}: {
  children: ReactNode
  even?: boolean
}) {
  return (
    <div
      className={cn(
        "grid items-start gap-[clamp(16px,2vw,24px)] le-1200:grid-cols-[1fr]",
        even
          ? "grid-cols-[1fr_1fr] le-900:grid-cols-[1fr]"
          : "grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
      )}
    >
      {children}
    </div>
  )
}

/* .amk-stack: css/amk-app.css:124 */
export function Stack({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-[clamp(16px,2vw,24px)]">
      {children}
    </div>
  )
}
