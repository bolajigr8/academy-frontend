import type { ApiVerificationDocument } from "@/features/club/api"
import type { ApiThreadItem } from "@/features/messages/api"
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
