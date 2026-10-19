"use client"

import { useSyncExternalStore } from "react"

import type { DemoRole, View } from "./app-store"
import { getAppStore } from "./instance"

/** The derived app state. Stable between commits, so it is safe as a snapshot. */
export function useAppView(): View {
  const api = getAppStore()
  return useSyncExternalStore(api.subscribe, api.get, api.get)
}

/**
 * The demo session. Until the persisted state has been read on the client it
 * reports "guest", so the server render and the first client render match.
 */
export function useDemoSession(): { role: DemoRole; hydrated: boolean } {
  const api = getAppStore()
  const hydrated = useSyncExternalStore(
    api.subscribe,
    () => api.store.getState().hydrated,
    () => false
  )
  const role = useSyncExternalStore(
    api.subscribe,
    () => api.get().session.role,
    () => "guest" as const
  )
  return { role: hydrated ? role : "guest", hydrated }
}
