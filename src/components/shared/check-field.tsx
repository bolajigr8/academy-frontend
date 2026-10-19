import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

type Props = Omit<ComponentProps<"input">, "type" | "children"> & {
  children: ReactNode
}

/* .amk-check: css/amk-core.css:183-184. A native checkbox with the neon accent color. */
export function CheckField({ className, children, ...props }: Props) {
  return (
    <label
      className={cn(
        "flex min-h-8 cursor-pointer items-start gap-[10px] text-fs-14 text-fg-2",
        className
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-[18px] flex-none accent-gf-neon"
        {...props}
      />
      <span>{children}</span>
    </label>
  )
}
