/*
 * The academy blog reads Golafly's Sanity blog (the same project as Matchday)
 * through Sanity's public HTTP query API: the dataset is public-read, so no
 * token and no extra package are needed. The same NEXT_PUBLIC_SANITY_* env
 * variables as Matchday, with the same defaults, so the blog works out of
 * the box. Posts are cached and refreshed every 60 seconds (as Matchday).
 */
export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "sngce5kj",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01",
}

/** Which posts this site shows: Sanity's post "Section" field ("academy"), or "all" */
export const BLOG_SECTION = process.env.NEXT_PUBLIC_BLOG_SECTION || "academy"

export const BLOG_REVALIDATE = 60

/** Runs a GROQ query; params are bound as $name (JSON-encoded, as Sanity expects) */
export async function sanityQuery<T>(
  query: string,
  params: Record<string, string> = {}
): Promise<T> {
  const { projectId, dataset, apiVersion } = sanityConfig
  const host =
    process.env.NODE_ENV === "production"
      ? `${projectId}.apicdn.sanity.io`
      : `${projectId}.api.sanity.io`
  // SANITY_API_URL (server only, unset in production) points at a mock for tests
  const base = process.env.SANITY_API_URL || `https://${host}`
  const url = new URL(`${base}/v${apiVersion}/data/query/${dataset}`)
  url.searchParams.set("query", query)
  for (const [k, v] of Object.entries(params))
    url.searchParams.set(`$${k}`, JSON.stringify(v))
  const res = await fetch(url, { next: { revalidate: BLOG_REVALIDATE } })
  if (!res.ok) throw new Error(`Sanity ${res.status}`)
  const body = (await res.json()) as { result: T }
  return body.result
}
