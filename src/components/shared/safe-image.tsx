"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

import { resolveBackendUrl } from "@/lib/api/assets"
import { cn } from "@/lib/utils"

import { Crest } from "./crest"

type Props = Omit<ImageProps, "onError" | "placeholder"> & {
  /** Classes for the fallback surface (defaults fill the same box as the image). */
  fallbackClassName?: string
}

/**
 * next/image that never breaks a layout. If the file is missing or fails to
 * load it shows the academy crest on a --bg-3 surface in the same box, using
 * only the inline crest and tokens (no second file that could be missing).
 */
export function SafeImage({
  fallbackClassName,
  className,
  alt,
  ...props
}: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const src = typeof props.src === "string" ? props.src : null
  const failed = src !== null && failedSrc === src

  if (failed) {
    const sized =
      !props.fill && props.width && props.height
        ? {
            aspectRatio: `${props.width} / ${props.height}`,
            width: props.width,
          }
        : undefined
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        style={sized}
        className={cn(
          "flex items-center justify-center bg-bg-3",
          props.fill && "absolute inset-0",
          fallbackClassName
        )}
      >
        <Crest size={48} className="opacity-70" />
      </span>
    )
  }

  return (
    <Image
      {...props}
      // backend images: an absolute 127.0.0.1 URL is moved onto the API origin
      src={src !== null ? resolveBackendUrl(src) : props.src}
      alt={alt}
      className={className}
      onError={() => {
        if (src) setFailedSrc(src)
      }}
    />
  )
}
