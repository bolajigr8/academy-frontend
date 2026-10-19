import type { Metadata } from "next"

import { LiveSearchClient } from "@/components/search/live-search"
import { SEARCH } from "@/data/search-copy"
import { isLive } from "@/lib/data-source"

import { AcademiesClient } from "./client"

export const metadata: Metadata = {
  title: SEARCH.title,
  description: SEARCH.description,
}

/* search.html: filters live in the query string (?type=, ?country=, ?start=, ?sort=, ?view=map ...) */
export default async function AcademiesPage({
  searchParams,
}: PageProps<"/academies">) {
  const params = await searchParams
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    const value = Array.isArray(v) ? v[0] : v
    if (value !== undefined) query.set(k, value)
  }
  const qs = query.toString()
  const q = qs ? `?${qs}` : ""
  // api mode: GET /academy/search (week 1 part 2, section 14); demo: the prototype's search
  return isLive("discovery") ? (
    <LiveSearchClient query={q} />
  ) : (
    <AcademiesClient query={q} />
  )
}
