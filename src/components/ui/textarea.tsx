import * as React from "react"

import { cn } from "@/lib/utils"

import { fieldControl } from "./input"

/* .amk-textarea: min-height 110px, vertical resize, relaxed leading */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldControl,
        "min-h-[110px] resize-y leading-lh-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
