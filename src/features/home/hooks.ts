"use client"

import { useMemo } from "react"

import {
  search,
  startOptions,
  DEFAULT_STATE,
} from "@/features/academies/search"
import { useHydrated } from "@/hooks/use-hydrated"
import { useAppView } from "@/stores/hooks"

/*
 * Everything the home page shows that comes from data (js index.html HomeApp).
 * The seeded dates depend on the visitor's today, so until the browser has
 * hydrated `ready` is false and the page renders no data (server and first
 * client render match).
 */
export function useHome() {
  const view = useAppView()
  const hydrated = useHydrated()
  const data = useMemo(() => {
    const listings = view.publicListings
    const counts: Record<string, number> = {}
    listings.forEach((l) => {
      counts[l.type] = (counts[l.type] ?? 0) + 1
    })
    const featured = search(listings, DEFAULT_STATE, view.today)
      .organic.filter((l) => l.verification !== "pending")
      .slice(0, 6)

    const seen: Record<string, boolean> = {}
    const intakeRows = listings.flatMap((l) =>
      l.intakes.filter((i) => i.open).map((i) => ({ l, i }))
    )
    intakeRows.sort((a, b) =>
      a.i.start < b.i.start
        ? -1
        : a.i.start > b.i.start
          ? 1
          : a.l.id < b.l.id
            ? -1
            : 1
    )
    const rows = intakeRows
      .filter((r) => (seen[r.l.id] ? false : (seen[r.l.id] = true)))
      .slice(0, 5)

    const g = view.listingsById["barcelona-school-season"]
    return {
      total: listings.length,
      stats: {
        academies: new Set(listings.map((l) => l.academyId)).size,
        countries: new Set(listings.map((l) => l.academy.countryCode)).size,
        intakes: listings.reduce(
          (n, l) => n + l.intakes.filter((i) => i.open).length,
          0
        ),
      },
      counts,
      featured,
      rows,
      startOptions: startOptions(listings),
      glimpse: g
        ? { crest: g.crest, title: g.title, academy: g.academy.name }
        : null,
    }
  }, [view])
  return { ready: hydrated, saved: view.saved, ...data }
}
