"use client"

import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { ErrorState } from "@/components/shared/error-state"
import { LIVE } from "@/data/live-copy"
import {
  getPublicListing,
  type ApiPublicListing,
} from "@/features/academies/api"
import { getApiStatus } from "@/lib/api/errors"

/*
 * api mode: GET /academy/listings/{slug} (week 1 part 2, section 15).
 * 404 (unknown, not published, or its academy not verified: the backend
 * treats them the same on purpose) shows "We couldn't find that program".
 * Any other failure shows an error with Try again. No demo fallback: search
 * and home are live, so every card leads to a real listing.
 */
export function LiveListingGate({
  slug,
  live,
  notFound,
}: {
  slug: string
  live: (l: ApiPublicListing) => ReactNode
  notFound: ReactNode
}) {
  const query = useQuery({
    queryKey: ["public-listing", slug],
    queryFn: () => getPublicListing(slug),
    retry: false,
  })
  if (query.isPending) return <div className="min-h-screen" aria-busy="true" />
  if (query.data) return <>{live(query.data)}</>
  if (getApiStatus(query.error) === 404) return <>{notFound}</>
  return (
    <main id="main" className="am-container py-16">
      <ErrorState
        message={LIVE.requestFailed}
        onRetry={() => void query.refetch()}
      />
    </main>
  )
}
