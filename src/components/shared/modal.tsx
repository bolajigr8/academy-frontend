"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useRef, type ReactNode } from "react"

import { Icon } from "@/components/icons/icon"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  /** .amk-modal--full: near full screen on a --bg-0 surface (filters sheet, photo lightbox) */
  size?: "default" | "full"
}

/*
 * AmModal + .amk-scrim / .amk-modal*: js/amk-core.jsx:374, css/amk-core.css:347-367 and 448-451.
 * Focus is trapped, Escape and a click outside close it, the page behind is locked.
 * Focus starts on the element marked data-autofocus, else on the first control after the close button.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "default",
}: Props) {
  const full = size === "full"
  const popup = useRef<HTMLDivElement>(null)
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-(--amk-z-overlay) bg-overlay-strong backdrop-blur-[6px] data-open:animate-fade data-closed:opacity-0" />
        <DialogPrimitive.Popup
          ref={popup}
          initialFocus={(): HTMLElement | boolean => {
            const marked =
              popup.current?.querySelector<HTMLElement>("[data-autofocus]")
            if (marked) return marked
            const controls = popup.current?.querySelectorAll<HTMLElement>(
              "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])"
            )
            return controls?.[1] ?? controls?.[0] ?? true
          }}
          className={cn(
            "fixed top-1/2 left-1/2 z-(--amk-z-overlay) max-h-[calc(100vh-32px)] w-[min(560px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg border border-border-2 bg-surface-elevated text-fg-1 shadow-(--shadow-xl) data-open:animate-rise le-720:top-auto le-720:bottom-0 le-720:left-0 le-720:max-h-[92vh] le-720:w-full le-720:translate-x-0 le-720:translate-y-0 le-720:rounded-b-none",
            full &&
              "h-[calc(100vh-32px)] w-[min(1200px,calc(100%-32px))] bg-bg-0 le-720:h-screen le-720:max-h-screen le-720:rounded-none"
          )}
        >
          <div
            className={cn(
              "sticky top-0 z-[2] flex items-center justify-between gap-3 border-b border-border-1 bg-surface-elevated px-5 py-[18px]",
              full && "bg-bg-0"
            )}
          >
            <DialogPrimitive.Title className="font-display text-fs-20 font-bold">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="grid size-10 place-items-center rounded-full border border-border-2 bg-transparent p-0 text-fg-2 hover:border-border-3 hover:text-fg-1"
            >
              <Icon name="x" size={18} />
            </DialogPrimitive.Close>
          </div>
          <div className={cn("grid gap-4 p-5", full && "h-[calc(100%-77px)]")}>
            {children}
          </div>
          {footer ? (
            <div className="sticky bottom-0 flex flex-wrap justify-end gap-[10px] border-t border-border-1 bg-surface-elevated px-5 py-4">
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
