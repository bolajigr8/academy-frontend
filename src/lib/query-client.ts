import { QueryClient } from "@tanstack/react-query"

import { getApiStatus } from "@/lib/api/errors"

/** Retry once on network/server trouble; never on 4xx (the answer will not change). */
function retry(failureCount: number, error: unknown): boolean {
  const status = getApiStatus(error)
  if (status !== null && status >= 400 && status < 500) return false
  return failureCount < 1
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Statuses change on the other side (an admin approves, an academy
        // decides, a family replies): data counts as fresh for 30 seconds and is
        // fetched again when the user comes back to the tab. Lists that rarely
        // change (options, countries, search filters) set their own longer time.
        staleTime: 30 * 1000,
        gcTime: 10 * 60 * 1000,
        retry,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  })
}
