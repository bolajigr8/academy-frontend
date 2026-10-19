import { useSyncExternalStore } from "react"

/** Live CSS media query match. false on the server and during hydration. Mirrors useAmMedia. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", notify)
      return () => mq.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}
