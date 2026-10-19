import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/* .amk-input: css/amk-core.css:164-176 */
const fieldControl =
  "min-h-[46px] w-full min-w-0 rounded-sm border border-border-2 bg-surface-elevated px-[14px] py-[11px] text-fs-16 text-fg-1 [transition:border-color_var(--dur-base)_var(--ease-out),box-shadow_var(--dur-base)_var(--ease-out)] placeholder:text-fg-4 hover:border-border-3 focus:border-amk-accent-ink focus:shadow-(--glow-neon-sm) focus:outline-hidden aria-invalid:border-gf-danger"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(fieldControl, className)}
      {...props}
    />
  )
}

export { Input, fieldControl }
