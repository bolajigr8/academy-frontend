"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* .amk-label: css/amk-core.css:157 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("text-fs-14 font-semibold text-fg-1", className)}
      {...props}
    />
  )
}

export { Label }
