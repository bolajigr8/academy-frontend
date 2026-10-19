import type { SearchParams } from "./api"

/** react-query keys for the public discovery endpoints (week 1 part 2, sections 14 to 16) */
export const discoveryKeys = {
  all: ["discovery"] as const,
  search: (p: SearchParams) => [...discoveryKeys.all, "search", p] as const,
  filters: () => [...discoveryKeys.all, "filters"] as const,
  profile: (slug: string) => [...discoveryKeys.all, "profile", slug] as const,
  saved: () => [...discoveryKeys.all, "saved"] as const,
}
