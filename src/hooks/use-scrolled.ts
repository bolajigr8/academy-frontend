import { useSyncExternalStore } from "react"

/** True once the page has scrolled past `threshold` px (default 8). Mirrors useAmScrolled. */
export function useScrolled(threshold = 8): boolean {
  return useSyncExternalStore(
    (notify) => {
      window.addEventListener("scroll", notify, { passive: true })
      return () => window.removeEventListener("scroll", notify)
    },
    () => window.scrollY > threshold,
    () => false
  )
}
