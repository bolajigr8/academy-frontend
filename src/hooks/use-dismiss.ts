import { useEffect, type RefObject } from "react"

/**
 * Close a popover on an outside press or Escape (Escape also returns focus to
 * the popover's first button). Mirrors useDismiss in js/amk-ui.jsx.
 */
export function useDismiss(
  open: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e: MouseEvent) => {
      if (
        ref.current &&
        e.target instanceof Node &&
        !ref.current.contains(e.target)
      ) {
        onClose()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      onClose()
      ref.current?.querySelector("button")?.focus()
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, onClose, ref])
}
