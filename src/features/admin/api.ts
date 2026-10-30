import type { ApiVerificationDocument } from "@/features/club/api"
import type { ApiThreadItem } from "@/features/messages/api"
import type {
  ApiEnrollmentPayment,
  ApiEnrollmentSummary,
} from "@/features/enrollments/api"
import type { ApiOwnReview } from "@/features/reviews/api"
import { apiClient } from "@/lib/api/client"
import type { ApiMoney, ApiPage, ApiResponse } from "@/lib/api/types"
import type {
  ApiIntake,
  ApiListing,
  ApiOrganization,
} from "@/features/club/api"
import type { ApiApplicant } from "@/features/club/applications-api"

/*
 * Golafly admin (admin token only; every other token gets 401):
 * week 1 part 1 section 8, week 1 part 2 sections 11, 13 and 17,
 * week 2 part 2 section 16. The only place these endpoints are called.
 */

export type AdminActor = { id: number; name: string } | null
type Page<T> = ApiPage<T>
const unwrap = <T>(r: { data: ApiResponse<T> }) => r.data.data

/* ---------------- login (week 1 part 1, section 8) ---------------- */

/** POST /auth/admin/login {email, password} -> data.token (admins have a separate login) */
export async function adminLogin(
  email: string,
  password: string
): Promise<{ token: string; expires_in?: number }> {
  return unwrap(
    await apiClient.post<ApiResponse<{ token: string; expires_in?: number }>>(
      "/auth/admin/login",
      { email, password }
    )
  )
}

/* ---------------- verifications (week 1 part 2, section 11) ---------------- */

export type VerificationStatus =
  "pending" | "verified" | "club_academy" | "rejected"

export type AdminVerification = {
  academy_id: number
  academy_name: string
  academy_slug: string
  city: string
  country_code: string
  verification_status: VerificationStatus
  verification_submitted_at: string | null
  verified_at: string | null
  verification_note: string | null
  verification_reviewed_at: string | null
  verification_reviewed_by: AdminActor
  organization: ApiOrganization
  documents_count?: number
  pending_documents_count?: number
  /** offline verification: always [] (the documents section is hidden while empty) */
  documents?: ApiVerificationDocument[]
}

/** Admin download path of a verification document (needs the token; returns the file) */
export const adminVerificationDocumentPath = (
  academyId: number,
  docId: number
) => `/academy/admin/verifications/${academyId}/documents/${docId}/download`

export async function listVerifications(params: {
  status?: VerificationStatus
  page?: number
  per_page?: number
}): Promise<Page<AdminVerification>> {
  return (
    await apiClient.get<Page<AdminVerification>>(
      "/academy/admin/verifications",
      { params }
    )
  ).data
}
export async function getVerification(id: number): Promise<AdminVerification> {
  return unwrap(
    await apiClient.get<ApiResponse<AdminVerification>>(
      `/academy/admin/verifications/${id}`
    )
  )
}
/** approve {as: verified | club_academy}: pending, rejected, or switch an approved badge */
export async function approveVerification(
  id: number,
  as: "verified" | "club_academy"
): Promise<AdminVerification> {
  return unwrap(
    await apiClient.post<ApiResponse<AdminVerification>>(
      `/academy/admin/verifications/${id}/approve`,
      { as }
    )
  )
}
/** reject {note} (up to 2000): pending or already rejected only */
export async function rejectVerification(
  id: number,
  note: string
): Promise<AdminVerification> {
  return unwrap(
    await apiClient.post<ApiResponse<AdminVerification>>(
      `/academy/admin/verifications/${id}/reject`,
      { note }
    )
  )
}

/* ---------------- listing moderation (week 1 part 2, section 13) ---------------- */

export type AdminListingStatus =
  "draft" | "pending_review" | "published" | "rejected" | "paused" | "archived"
export type AdminListing = ApiListing & {
  reviewed_by: AdminActor
  submitted_at: string | null
  reviewed_at: string | null
}

export async function listModeration(params: {
  status?: AdminListingStatus
  academy_id?: number
  page?: number
  per_page?: number
}): Promise<Page<AdminListing>> {
  return (
    await apiClient.get<Page<AdminListing>>("/academy/admin/listings", {
      params,
    })
  ).data
}
export async function getModerationListing(id: number): Promise<AdminListing> {
  return unwrap(
    await apiClient.get<ApiResponse<AdminListing>>(
      `/academy/admin/listings/${id}`
    )
  )
}
/** pending_review -> published */
export async function approveListing(id: number): Promise<AdminListing> {
  return unwrap(
    await apiClient.post<ApiResponse<AdminListing>>(
      `/academy/admin/listings/${id}/approve`
    )
  )
}
/** pending_review -> rejected {reason} */
export async function rejectListing(
  id: number,
  reason: string
): Promise<AdminListing> {
  return unwrap(
    await apiClient.post<ApiResponse<AdminListing>>(
      `/academy/admin/listings/${id}/reject`,
      { reason }
    )
  )
}
/** published | paused -> rejected {reason} (takes it down) */
export async function unpublishListing(
  id: number,
  reason: string
): Promise<AdminListing> {
  return unwrap(
    await apiClient.post<ApiResponse<AdminListing>>(
      `/academy/admin/listings/${id}/unpublish`,
      { reason }
    )
  )
}

/* ---------------- organizations and users (week 1 part 2, section 17) ---------------- */

export type AdminUser = {
  id: string
  name: string
  email: string
  role: string
  country_code: string | null
  status: number
  created_at: string
  updated_at: string
}
export type AdminOrganization = ApiOrganization & {
  owner: AdminUser | null
  academies_count: number
  listings_count: number
  academies?: {
    id: number
    name: string
    slug: string
    city: string
    country_code: string
    verification_status: VerificationStatus
    listings_count: number
  }[]
  /** week 3 part 4, section 26: the organization's payout account */
  payout_account_status?:
    "none" | "onboarding" | "restricted" | "ready" | "disconnected"
  payout_account_disabled_reason?: string | null
  /** the single organization only (for support), never in the list */
  stripe_account_id?: string | null
}

export async function listOrganizations(params: {
  q?: string
  page?: number
  per_page?: number
}): Promise<Page<AdminOrganization>> {
  return (
    await apiClient.get<Page<AdminOrganization>>(
      "/academy/admin/organizations",
      { params }
    )
  ).data
}
export async function getOrganization(id: number): Promise<AdminOrganization> {
  return unwrap(
    await apiClient.get<ApiResponse<AdminOrganization>>(
      `/academy/admin/organizations/${id}`
    )
  )
}
export async function listUsers(params: {
  role?: "applicant" | "academy"
  q?: string
  page?: number
  per_page?: number
}): Promise<Page<AdminUser>> {
  return (
    await apiClient.get<Page<AdminUser>>("/academy/admin/users", { params })
  ).data
}
/** DELETE /academy/admin/academies/{id} (week 1 part 1, section 8): refused while it has non-draft listings */
export async function deleteAcademy(id: number): Promise<void> {
  await apiClient.delete(`/academy/admin/academies/${id}`)
}

/* ---------------- applications, read only (week 2 part 2, section 16) ---------------- */

export type AdminApplicationRow = {
  id: number
  reference: string | null
  status: string
  academy: { id: number; name: string }
  listing: { id: number; title: string }
  intake: { id: number; label: string | null; start_date: string }
  player: { first_name: string; last_name: string }
  applicant: { name: string; relationship: string }
  documents_count: number
  messages_count: number
  submitted_at: string | null
  updated_at: string
}
export type AdminApplicationsPage = Page<AdminApplicationRow> & {
  meta: Page<AdminApplicationRow>["meta"] & {
    status_counts: Record<string, number>
  }
}
/** The thread's items, as on both sides (week 2 part 2, section 14) */
export type AdminConversationItem = ApiThreadItem

/** Admin download of a message attachment (section 16) */
export const adminAttachmentPath = (applicationId: number, messageId: number) =>
  `/academy/admin/applications/${applicationId}/messages/${messageId}/attachment`

export type AdminApplication = ApiApplicant & {
  academy: {
    id: number
    name: string
    organization: { id: number; name: string }
  }
  conversation: AdminConversationItem[]
}

export async function listAdminApplications(params: {
  status?: string
  academy_id?: number
  listing_id?: number
  search?: string
  page?: number
  per_page?: number
}): Promise<AdminApplicationsPage> {
  return (
    await apiClient.get<AdminApplicationsPage>("/academy/admin/applications", {
      params,
    })
  ).data
}
export async function getAdminApplication(
  id: number
): Promise<AdminApplication> {
  return unwrap(
    await apiClient.get<ApiResponse<AdminApplication>>(
      `/academy/admin/applications/${id}`
    )
  )
}

export type { ApiIntake, ApiMoney }

/* ---------------- week 3 part 2: reviews (section 11) ---------------- */

/** A review with who and what it is about (admin only: the author's account) */
export type AdminReview = ApiOwnReview & {
  listing: { id: number; title: string; slug: string }
  academy: { id: number; name: string }
  enrollment: { id: number; application_reference: string | null }
  author_account: { id: string; name: string; email: string }
  /** who decided last; null before any decision */
  reviewed_by: { admin_id: number; name: string; at: string } | null
}

export type AdminReviewsPage = Page<AdminReview> & {
  meta: Page<AdminReview>["meta"] & {
    status_counts: Record<"pending" | "published" | "rejected", number>
  }
}

/** GET /academy/admin/reviews (newest submitted first; status_counts for the tabs) */
export async function listAdminReviews(
  params: {
    status?: "pending" | "published" | "rejected"
    academy_id?: number
    listing_id?: number
    page?: number
    per_page?: number
  } = {}
): Promise<AdminReviewsPage> {
  const res = await apiClient.get<AdminReviewsPage>("/academy/admin/reviews", {
    params: { per_page: 20, ...params },
  })
  return res.data
}

/** POST …/reviews/{id}/publish: a pending review becomes public; the rating is recomputed */
export async function publishReview(id: number): Promise<AdminReview> {
  const res = await apiClient.post<ApiResponse<AdminReview>>(
    `/academy/admin/reviews/${id}/publish`
  )
  return res.data.data
}

/** POST …/reviews/{id}/reject {reason}: rejects a pending one or takes a published one down (final) */
export async function rejectReview(
  id: number,
  reason: string
): Promise<AdminReview> {
  const res = await apiClient.post<ApiResponse<AdminReview>>(
    `/academy/admin/reviews/${id}/reject`,
    { reason: reason.trim() }
  )
  return res.data.data
}

/* ---------------- week 3 part 2: enrollments (section 14) ---------------- */

/** A paid row's money as the backend may send it: a money object or minor units */
export type AdminMoneyish = ApiMoney | number | string | null

export type AdminEnrollmentPayment = ApiEnrollmentPayment & {
  /** filled when the row is paid (part 3): Golafly's share */
  commission?: AdminMoneyish
  /** filled when paid: what the academy is owed */
  academy_net?: AdminMoneyish
  /** filled when paid: one EUR buys this much of the row's currency */
  eur_rate?: string | number | null
}

export type AdminEnrollment = ApiEnrollmentSummary & {
  application: { id: number; reference: string | null; status: string }
  listing: {
    id?: number
    title: string
    slug: string
    academy: { id: number; name: string }
  }
  applicant: { id: string; name: string; email: string; relationship: string }
  organization: { id: number; name: string }
  /** the percent frozen on the enrollment when it was created */
  commission_rate: number
  cancellation: {
    cancelled_at: string
    reason: string
    /** admins only */
    refund_note: string | null
    by: { type: "applicant" | "system" | "admin"; name: string | null }
  } | null
}

export type AdminEnrollmentDetail = AdminEnrollment & {
  payments: AdminEnrollmentPayment[]
}

export type AdminEnrollmentsPage = Page<AdminEnrollment> & {
  meta: Page<AdminEnrollment>["meta"] & {
    status_counts: Record<"pending" | "confirmed" | "cancelled", number>
  }
}

/** GET /academy/admin/enrollments (newest first; search by reference or name) */
export async function listAdminEnrollments(
  params: {
    status?: "pending" | "confirmed" | "cancelled"
    organization_id?: number
    academy_id?: number
    search?: string
    page?: number
    per_page?: number
  } = {}
): Promise<AdminEnrollmentsPage> {
  const res = await apiClient.get<AdminEnrollmentsPage>(
    "/academy/admin/enrollments",
    { params: { per_page: 20, ...params } }
  )
  return res.data
}

/** GET /academy/admin/enrollments/{id}: with the schedule, commission and payout */
export async function getAdminEnrollment(
  id: number
): Promise<AdminEnrollmentDetail> {
  const res = await apiClient.get<ApiResponse<AdminEnrollmentDetail>>(
    `/academy/admin/enrollments/${id}`
  )
  return res.data.data
}

/**
 * POST …/enrollments/{id}/cancel {reason, refund_note?}: pending or confirmed,
 * whatever was paid. reason is shown to the family and the academy; the
 * refund note stays with Golafly. Refunds are made by hand.
 */
export async function cancelAdminEnrollment(
  id: number,
  body: { reason: string; refund_note?: string }
): Promise<AdminEnrollmentDetail> {
  const res = await apiClient.post<ApiResponse<AdminEnrollmentDetail>>(
    `/academy/admin/enrollments/${id}/cancel`,
    {
      reason: body.reason.trim(),
      ...(body.refund_note?.trim()
        ? { refund_note: body.refund_note.trim() }
        : {}),
    }
  )
  return res.data.data
}

/* ---------------- week 3 part 2: commission (section 15) ---------------- */

export type AdminSettings = {
  default_rate: number
  overrides: {
    organization_id: number
    organization_name: string
    commission_rate: number
    updated_at: string
    updated_by: string | null
  }[]
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const res = await apiClient.get<ApiResponse<AdminSettings>>(
    "/academy/admin/settings"
  )
  return res.data.data
}

/** POST /academy/admin/settings: a rate 0-100 (2 decimals) sets an override; null clears it */
export async function saveCommission(
  organizationId: number,
  rate: number | null
): Promise<{ settings: AdminSettings; message: string }> {
  const res = await apiClient.post<ApiResponse<AdminSettings>>(
    "/academy/admin/settings",
    { organization_id: organizationId, commission_rate: rate }
  )
  return { settings: res.data.data, message: res.data.message }
}

/* ---------------- week 3 part 2: the marketplace overview (section 16) ---------------- */

export type AdminOverview = {
  range: { from: string; to: string }
  period: {
    applications_submitted: number
    application_response_rate: {
      measured: number
      answered: number
      rate: number | null
    }
    repeat_applications: { applications: number; applicants: number }
    searches: number
    listing_views: number
    new_players_and_parents: number
    saved_listings_added: number
    verified_reviews_added: number
    revenue: {
      currency: string
      gmv_minor: number
      commission_minor: number
      unconverted: {
        currency: string
        paid_rows: number
        gross_minor: number
        commission_minor: number
      }[]
    }
  }
  snapshot: {
    verified_academies: number
    active_listings: number
    registered_players_and_parents: number
    saved_listings: number
    verified_reviews: number
  }
}

/** GET /academy/admin/overview (from / to, default the last 30 days) */
export async function getAdminOverview(
  range: { from?: string; to?: string } = {}
): Promise<AdminOverview> {
  const res = await apiClient.get<ApiResponse<AdminOverview>>(
    "/academy/admin/overview",
    { params: range }
  )
  return res.data.data
}
