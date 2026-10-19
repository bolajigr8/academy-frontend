"use client"

import { useHydrated } from "@/hooks/use-hydrated"
import { useAppView } from "@/stores/hooks"

/*
 * AmDemoBar + .amk-demo-bar: js/amk-core.jsx, css/amk-core.css:425-430.
 * Shown only when the demo data cannot be saved (storage blocked or private
 * mode). Waits for hydration so the server HTML and the first client render match.
 */
export function DemoBar() {
  const hydrated = useHydrated()
  const view = useAppView()
  if (!hydrated || view.storage !== "memory") return null
  return (
    <div
      role="note"
      className="flex flex-wrap items-center justify-center gap-2 bg-fg-1 px-4 py-[7px] text-center text-fs-12 font-semibold text-bg-0"
    >
      Demo data isn’t saved in this browser (private mode or storage blocked).
      Changes reset when you reload.
    </div>
  )
}
