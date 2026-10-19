import type { ReactNode } from "react"

import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Logo } from "@/components/shared/logo"

/* .amk-auth__main, __top, __mlogo, __card: css/amk-pages.css:359-362 */
export function AuthMain({ children }: { children: ReactNode }) {
  return (
    <main
      id="main"
      className="grid content-start justify-items-center bg-bg-1 px-[clamp(20px,4vw,56px)] pt-6 pb-14"
    >
      <div className="flex min-h-12 w-full max-w-[520px] items-center justify-end">
        <span className="mr-auto hidden le-900:inline-flex">
          <Logo size="sm" />
        </span>
        <ThemeToggle small />
      </div>
      <div className="grid w-full max-w-[520px] min-w-0 gap-4 pt-[clamp(12px,5vh,56px)]">
        {children}
      </div>
    </main>
  )
}
