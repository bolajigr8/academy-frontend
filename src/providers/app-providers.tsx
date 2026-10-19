"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { MotionConfig } from "framer-motion"
import { ThemeProvider } from "next-themes"
import { useEffect, useState, type ReactNode } from "react"

import { Toaster } from "@/components/ui/sonner"
import { notifyError } from "@/components/shared/notify"
import { LIVE } from "@/data/live-copy"
import { checkSession, syncDemoRole } from "@/features/auth/session"
import { onApiError } from "@/lib/api/client"
import { getApiErrorMessage, getApiStatus } from "@/lib/api/errors"
import { makeQueryClient } from "@/lib/query-client"
import { KEY } from "@/stores/app-store"
import { getAppStore } from "@/stores/instance"

type Props = {
  children: ReactNode
}

/*
 * Reads the persisted demo state once, on the client, after hydration, so the
 * server render and the first client render both start from the seed. Also
 * follows changes made in another tab (the prototype's "storage" listener).
 */
/** Every failed API call also shows the backend's message as an error toast */
function ApiErrorToasts() {
  useEffect(
    () =>
      onApiError((error) =>
        notifyError(
          getApiStatus(error) === 429
            ? LIVE.tooManyAttempts
            : getApiErrorMessage(error, LIVE.requestFailed)
        )
      ),
    []
  )
  return null
}

function StoreHydrator() {
  useEffect(() => {
    const api = getAppStore()
    api.hydrate()
    // api mode: the demo persona follows the backend session (pages still on
    // demo data read it), so a reload never shows the other area's data
    syncDemoRole()
    // api mode: confirm the token with GET /auth/me, renew it when close to expiry
    void checkSession()
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) api.refresh()
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])
  return null
}

export function AppProviders({ children }: Props) {
  const [queryClient] = useState(makeQueryClient)

  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="gf-theme"
    >
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <StoreHydrator />
          <ApiErrorToasts />
          {children}
          <Toaster />
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
