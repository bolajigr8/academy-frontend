import type { ComponentProps } from "react"

import { fieldControl } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Props = Omit<ComponentProps<"select">, "size"> & {
  size?: "default" | "sm"
}

/*
 * .amk-select (css/amk-core.css:175-180) and .amk-select--sm (css/amk-pages.css:29):
 * a native <select> with the prototype's two-gradient chevron drawn in currentColor.
 */
export function NativeSelect({ size = "default", className, ...props }: Props) {
  return (
    <select
      className={cn(
        fieldControl,
        "cursor-pointer appearance-none [background-image:linear-gradient(45deg,transparent_50%,currentColor_50%),linear-gradient(135deg,currentColor_50%,transparent_50%)] [background-size:5px_5px] [background-position:calc(100%_-_20px)_52%,calc(100%_-_15px)_52%] [background-repeat:no-repeat] pr-10",
        size === "sm" && "min-h-10 w-auto py-2 text-fs-14 font-semibold",
        className
      )}
      {...props}
    />
  )
}
