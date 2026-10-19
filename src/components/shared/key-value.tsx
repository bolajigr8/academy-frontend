import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/* .amk-feecard__lines (css/amk-pages.css:305): a tinted box of label / value lines */
export function KvLines({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-[10px] rounded-sm bg-bg-2 p-4">{children}</div>
  )
}

/* .amk-kv and .amk-kv--total: css/amk-core.css:442-445 */
export function Kv({
  label,
  children,
  total = false,
}: {
  label: ReactNode
  children: ReactNode
  total?: boolean
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-3 text-fs-14 text-fg-2",
        total && "border-t border-border-2 pt-3 text-fs-16"
      )}
    >
      <span>{label}</span>
      <b
        className={cn(
          "text-right font-semibold text-fg-1",
          total && "font-display text-fs-20"
        )}
      >
        {children}
      </b>
    </div>
  )
}
