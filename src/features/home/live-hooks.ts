"use client"

import { useQueries, useQuery } from "@tanstack/react-query"

import { getSearchFilters, searchListings } from "@/features/academies/api"
import { discoveryKeys } from "@/features/academies/query-keys"

/*
 * The home page in api mode (week 1 part 2, section 14): only backend data.
 * - featured: GET /academy/search, relevance, 6 cards (its meta.total is the
 *   number of public programs)
 * - upcoming: GET /academy/search, soonest start first, 5 cards that have one
 * - filters: GET /academy/search/filters (countries, types)
 * - per type: GET /academy/search?academy_type=…&per_page=1, meta.total
 * Queries share their keys with the search page, so nothing is fetched twice.
 */
const FEATURED = { sort: "relevance" as const, per_page: 6, page: 1 }
const UPCOMING = { sort: "start_date" as const, per_page: 5, page: 1 }

/** `enabled` false (demo mode) keeps every query off */
export function useLiveHome(enabled = true) {
  const filters = useQuery({
    queryKey: discoveryKeys.filters(),
    queryFn: getSearchFilters,
    staleTime: 10 * 60 * 1000,
    enabled,
  })
  const featured = useQuery({
    queryKey: discoveryKeys.search(FEATURED),
    queryFn: () => searchListings(FEATURED),
    enabled,
  })
  const upcoming = useQuery({
    queryKey: discoveryKeys.search(UPCOMING),
    queryFn: () => searchListings(UPCOMING),
    enabled,
  })
  const types = filters.data?.academy_types ?? []
  const typeCounts = useQueries({
    queries: types.map((academy_type) => {
      const p = { academy_type, per_page: 1, page: 1 }
      return {
        queryKey: discoveryKeys.search(p),
        queryFn: () => searchListings(p),
        staleTime: 5 * 60 * 1000,
        enabled,
      }
    }),
  })
  return {
    filters: filters.data ?? null,
    featured: featured.data?.data ?? null,
    total: featured.data?.meta.total ?? null,
    upcoming: upcoming.data
      ? upcoming.data.data.filter((c) => c.next_start_date !== null)
      : null,
    typeCounts: Object.fromEntries(
      types.map((t, i) => [t, typeCounts[i]?.data?.meta.total ?? null])
    ) as Record<string, number | null>,
  }
}
