import { apiClient } from "@/lib/api/client"
import type { ApiPage, ApiResponse } from "@/lib/api/types"

/*
 * Week 3 part 2, sections 10 to 13: reviews (the family writes, Golafly
 * publishes, the academy replies) and the academy dashboard. The only place
 * these are called.
 */
export type ReviewStatus = "pending" | "published" | "rejected"

/** Four ratings, whole numbers 1 to 5 */
export type ApiRatings = {
  training: number
  communication: number
  facilities: number
  organization: number
}

/** A review as the public sees it (section 10): no account, enrollment or player */
export type ApiPublicReview = {
  id: number
  ratings: ApiRatings
  /** the average of the four, a NUMBER (4.25; a whole number has no decimals) */
  overall: number
  body: string
  /** "Sofia A.": written when sent, never recomputed */
  author: string
  verified_enrollment: boolean
  published_at: string | null
  academy_reply: string | null
  replied_at: string | null
  created_at?: string
}

/** The author's own view, in any status: the review block of GET /me/enrollments/{id} */
export type ApiOwnReview = ApiPublicReview & {
  status: ReviewStatus
  /** filled when rejected or taken down */
  rejection_reason: string | null
}

/** The academy's view adds the listing */
export type ApiPortalReview = ApiPublicReview & {
  listing: { id: number; title: string; slug: string }
}

export type ReviewSummary = {
  count: number
  /** numbers, null with no published review */
  averages: {
    training: number | null
    communication: number | null
    facilities: number | null
    organization: number | null
    overall: number | null
  }
}

export type ApiPublicReviewsPage = ApiPage<ApiPublicReview> & {
  meta: ApiPage<ApiPublicReview>["meta"] & { summary: ReviewSummary }
}

/** POST /academy/me/enrollments/{id}/review (201): a confirmed enrollment, once */
export async function writeReview(
  enrollmentId: number,
  body: { ratings: ApiRatings; body: string }
): Promise<ApiOwnReview> {
  const res = await apiClient.post<ApiResponse<ApiOwnReview>>(
    `/academy/me/enrollments/${enrollmentId}/review`,
    { ratings: body.ratings, body: body.body.trim() }
  )
  return res.data.data
}

/** GET /academy/listings/{slug}/reviews: published only, newest first; meta.summary counts all */
export async function listListingReviews(
  slug: string,
  page = 1,
  perPage = 10
): Promise<ApiPublicReviewsPage> {
  const res = await apiClient.get<ApiPublicReviewsPage>(
    `/academy/listings/${encodeURIComponent(slug)}/reviews`,
    { params: { page, per_page: perPage } }
  )
  return res.data
}

/** GET /academy/portal/reviews: the organization's published reviews */
export async function listPortalReviews(
  params: {
    listing_id?: number
    needs_reply?: boolean
    page?: number
    per_page?: number
  } = {}
): Promise<ApiPage<ApiPortalReview>> {
  const { needs_reply, ...rest } = params
  const res = await apiClient.get<ApiPage<ApiPortalReview>>(
    "/academy/portal/reviews",
    {
      params: {
        per_page: 20,
        ...rest,
        ...(needs_reply === undefined
          ? {}
          : { needs_reply: needs_reply ? "true" : "false" }),
      },
    }
  )
  return res.data
}

/** POST /academy/portal/reviews/{id}/reply: one public reply, no edit (already_replied) */
export async function replyToReview(
  id: number,
  reply: string
): Promise<ApiPortalReview> {
  const res = await apiClient.post<ApiResponse<ApiPortalReview>>(
    `/academy/portal/reviews/${id}/reply`,
    { reply: reply.trim() }
  )
  return res.data.data
}

/* ---------------- the academy dashboard (section 13) ---------------- */

export type ApiRate = { rate: number | null }
export type ApiAcademyDashboard = {
  range: { from: string; to: string }
  period: {
    applications_received: number
    accepted_applications: number
    enrolled_players: number
    listing_views: number
    /** applications ÷ views as a percent; null with no views; can pass 100 */
    view_to_application: ApiRate & { applications: number; views: number }
    /** the share of the range's applications enrolled now; null when none */
    application_to_enrollment: ApiRate & { submitted: number; enrolled: number }
    /** one line per currency with paid rows; empty until paying (part 3) */
    revenue: {
      currency: string
      gross_minor: number
      commission_minor: number
      net_minor: number
    }[]
  }
  /** as of now, whatever the range */
  snapshot: {
    pending_applications: number
    active_listings: number
    not_published_listings: number
  }
  /** the last 8 weeks, oldest first; ignores the range */
  views_by_week: { week_start: string; views: number }[]
}

/** GET /academy/portal/dashboard (from / to YYYY-MM-DD, default the last 30 days) */
export async function getAcademyDashboard(
  range: { from?: string; to?: string } = {}
): Promise<ApiAcademyDashboard> {
  const res = await apiClient.get<ApiResponse<ApiAcademyDashboard>>(
    "/academy/portal/dashboard",
    { params: range }
  )
  return res.data.data
}

export const reviewKeys = {
  all: ["reviews"] as const,
  listing: (slug: string, page: number) =>
    [...reviewKeys.all, "listing", slug, page] as const,
  portal: (p: object) => [...reviewKeys.all, "portal", p] as const,
  dashboard: (r: object) => ["academy-dashboard", r] as const,
}
