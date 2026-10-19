import { apiClient } from "@/lib/api/client"
import type { ApiMoney, ApiPage, ApiResponse } from "@/lib/api/types"
import type { ApiApplication } from "@/features/family/api"

/*
 * Public listing page (week 1 part 2, section 15) and starting an application
 * (week 2 part 1, section 4). The token is sent when signed in (is_saved).
 */

export type ApiPublicIntake = {
  id: number
  label: string | null
  start_date: string
  end_date: string | null
  applications_open_at: string | null
  application_deadline: string | null
  status: "open" | "closed" | "full"
  /** null = unlimited */
  places_left: number | null
}

export type ApiPublicListing = {
  id: number
  slug: string
  title: string
  academy: {
    id: number
    name: string
    slug: string
    club_name: string | null
    logo_url: string | null
    header_image_url: string | null
    city: string
    address: string | null
    country_code: string
    country_name: string
    verification_status: "verified" | "club_academy"
    rating_avg: string
    reviews_count: number
  }
  primary_image_url: string | null
  age_min: number | null
  age_max: number | null
  duration: { value: number | null; unit: string | null; weeks: number | null }
  price: ApiMoney | null
  payment_frequency: string | null
  next_start_date: string | null
  places_left: number | null
  has_accommodation: boolean
  has_education: boolean
  rating_avg: string
  reviews_count: number
  is_saved: boolean
  is_sponsored: boolean
  description: string | null
  academy_type: string | null
  gender: string | null
  playing_level: string | null
  training_frequency: string | null
  methodology: string | null
  competition: string | null
  weekly_schedule: Partial<Record<string, string>>
  deposit: ApiMoney | null
  registration_fee: ApiMoney | null
  requirements: string | null
  required_documents: string[]
  facilities: string[]
  policies: string | null
  included: string[]
  optional_services: string[]
  /** upcoming intakes only, earliest first */
  intakes: ApiPublicIntake[]
  images: { id: number; url: string; sort_order: number; is_primary: boolean }[]
}

/** GET /academy/listings/{slug}: 404 when not public (not published, or academy not verified) */
export async function getPublicListing(
  slug: string
): Promise<ApiPublicListing> {
  const res = await apiClient.get<ApiResponse<ApiPublicListing>>(
    `/academy/listings/${encodeURIComponent(slug)}`,
    // a 404 here is a normal answer (see the transition rule in the program page)
    { headers: { "X-Silent-Error": "1" } }
  )
  return res.data.data
}

/**
 * POST /academy/listings/{id}/applications {player_id, intake_id}: 201 a new
 * draft, 200 the existing draft for this player and intake. Refusals are 422
 * with errors.reason (intake_full, deadline_passed, age_out_of_range, …).
 */
export async function startApplication(
  listingId: number,
  playerId: number,
  intakeId: number
): Promise<ApiApplication> {
  const res = await apiClient.post<ApiResponse<ApiApplication>>(
    `/academy/listings/${listingId}/applications`,
    { player_id: playerId, intake_id: intakeId }
  )
  return res.data.data
}

/** A search card (week 1 part 2, section 14). Never carries a status or review fields. */
export type ApiSearchCard = {
  id: number
  slug: string
  title: string
  academy: {
    name: string
    slug: string
    /** the club's name; null for an independent academy */
    club_name: string | null
    city: string
    country_name: string
    country_code: string
    verification_status: string
  }
  primary_image_url: string | null
  age_min: number | null
  age_max: number | null
  duration: { value: number | null; unit: string | null; weeks: number | null }
  price: ApiMoney | null
  payment_frequency: string | null
  /** start of the next upcoming intake, or null */
  next_start_date: string | null
  /** places in that intake; null = unlimited or no upcoming intake; 0 = full */
  places_left: number | null
  has_accommodation: boolean
  has_education: boolean
  /** "0.00" and 0 until reviews exist (week 3) */
  rating_avg: string
  reviews_count: number
  is_saved: boolean
  /** always false for now */
  is_sponsored: boolean
}

export type SearchSort = "relevance" | "price_asc" | "price_desc" | "start_date"

/**
 * GET /academy/search query (section 14). Every filter is optional and they
 * add up. Booleans travel as the text "true"/"false"; money in minor units.
 */
export type SearchParams = {
  /** 2 to 100 characters: title, academy name or city */
  q?: string
  country?: string
  city?: string
  /** 3 to 99 */
  age?: number
  gender?: string
  academy_type?: string
  playing_level?: string
  price_min?: number
  price_max?: number
  /** applies only with a price filter */
  currency?: string
  /** whole weeks 1 to 520 */
  duration_min?: number
  duration_max?: number
  /** YYYY-MM-DD */
  start_from?: string
  start_to?: string
  has_places?: boolean
  has_accommodation?: boolean
  has_education?: boolean
  club_academy?: boolean
  sort?: SearchSort
  /** 1 to 50 */
  per_page?: number
  page?: number
}

/** Booleans as "true"/"false" text; "false" for has_places / club_academy is the same as leaving it out */
function searchQuery(p: SearchParams): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === "") continue
    if (typeof v === "boolean") {
      if (!v && (k === "has_places" || k === "club_academy")) continue
      out[k] = v ? "true" : "false"
    } else out[k] = v
  }
  return out
}

/** GET /academy/search (public; the token is sent when signed in so is_saved is real) */
export async function searchListings(
  params: SearchParams
): Promise<ApiPage<ApiSearchCard>> {
  const res = await apiClient.get<ApiPage<ApiSearchCard>>("/academy/search", {
    params: searchQuery(params),
  })
  return res.data
}

/** GET /academy/search/filters (public; cached 10 minutes by the backend) */
export type ApiSearchFilters = {
  countries: { code: string; name: string }[]
  cities: { country_code: string; city: string }[]
  academy_types: string[]
  playing_levels: string[]
  genders: string[]
  currencies: string[]
  default_currency: string
  sorts: SearchSort[]
  /** lowest and highest price per currency among visible listings */
  prices: { currency: string; min: ApiMoney; max: ApiMoney }[]
  duration_weeks: { min: number | null; max: number | null }
}

export async function getSearchFilters(): Promise<ApiSearchFilters> {
  const res = await apiClient.get<ApiResponse<ApiSearchFilters>>(
    "/academy/search/filters"
  )
  return res.data.data
}

/** GET /academy/profiles/{slug} (section 15): an academy's public profile */
export type ApiAcademyProfile = {
  id: number
  name: string
  slug: string
  club_name: string | null
  logo_url: string | null
  header_image_url: string | null
  description: string | null
  country_name: string
  country_code: string
  city: string
  address: string | null
  latitude: string | null
  longitude: string | null
  facilities: string[]
  policies: string | null
  verification_status: string
  rating_avg: string
  reviews_count: number
  images: {
    id: number
    url: string
    sort_order: number
    is_primary: boolean
    created_at: string
  }[]
  /** its published listings as cards, newest first */
  listings: ApiSearchCard[]
}

export async function getAcademyProfile(
  slug: string
): Promise<ApiAcademyProfile> {
  const res = await apiClient.get<ApiResponse<ApiAcademyProfile>>(
    `/academy/profiles/${encodeURIComponent(slug)}`,
    // a hidden or unknown academy answers 404: the page shows "not found", no toast
    { headers: { "X-Silent-Error": "1" } }
  )
  return res.data.data
}

/* ---------------- saved listings (section 16): any signed-in account ---------------- */

/** GET /academy/me/saved: cards, most recently saved first (per_page <= 50) */
export async function listSaved(
  page = 1,
  perPage = 50,
  /** a background count (the heart badges): a failure shows no error toast */
  silent = false
): Promise<ApiPage<ApiSearchCard>> {
  const res = await apiClient.get<ApiPage<ApiSearchCard>>("/academy/me/saved", {
    params: { page, per_page: perPage },
    ...(silent ? { headers: { "X-Silent-Error": "1" } } : {}),
  })
  return res.data
}

/** POST /academy/me/saved {listing_id}: returns the card with is_saved true (saving twice is fine) */
export async function saveListing(listingId: number): Promise<ApiSearchCard> {
  const res = await apiClient.post<ApiResponse<ApiSearchCard>>(
    "/academy/me/saved",
    { listing_id: listingId }
  )
  return res.data.data
}

/** DELETE /academy/me/saved/{listingId}: 200 whether or not it was saved */
export async function unsaveListing(listingId: number): Promise<void> {
  await apiClient.delete(`/academy/me/saved/${listingId}`)
}
