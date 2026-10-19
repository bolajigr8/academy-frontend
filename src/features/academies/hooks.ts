"use client"

import { useMemo } from "react"

import {
  DEFAULT_STATE,
  search,
  startOptions,
} from "@/features/academies/search"
import type { SearchState } from "@/features/academies/types"
import { useHydrated } from "@/hooks/use-hydrated"
import { useAppView } from "@/stores/hooks"

/*
 * Public academy data (search and program pages). Results depend on the visitor's
 * today (open intakes, places left), so `ready` is false until the browser has
 * hydrated and the pages render no results before that.
 */
export function useAcademySearch(state: SearchState) {
  const view = useAppView()
  const ready = useHydrated()
  const data = useMemo(() => {
    const listings = view.publicListings
    return {
      listings,
      result: search(listings, state, view.today),
      startOptions: startOptions(listings),
    }
  }, [view, state])
  return { ready, today: view.today, saved: view.saved, ...data }
}

/** One program by its slug (prototype listing.html?id=). Unpublished programs open as a preview. */
export function useProgram(slug: string) {
  const view = useAppView()
  const ready = useHydrated()
  return useMemo(() => {
    const l = view.listingsById[slug]
    if (!l) return { ready, found: false as const }
    return {
      ready,
      found: true as const,
      listing: l,
      today: view.today,
      saved: view.saved.includes(l.id),
      savedIds: view.saved,
      reviews: view.reviews.filter((r) => r.listingId === l.id),
      sameAcademy: view.publicListings.filter(
        (x) => x.academyId === l.academyId && x.id !== l.id
      ),
      similar: search(
        view.publicListings,
        { ...DEFAULT_STATE, type: l.type },
        view.today
      )
        .organic.filter((x) => x.id !== l.id && x.academyId !== l.academyId)
        .slice(0, 3),
    }
  }, [view, slug, ready])
}
