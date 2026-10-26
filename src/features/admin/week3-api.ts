import type {
  ApiEnrollment,
  ApiEnrollmentSummary,
  EnrollmentStatus,
} from "@/features/enrollments/api"
import { apiClient } from "@/lib/api/client"
import type { ApiPage, ApiPageMeta, ApiResponse } from "@/lib/api/types"

/*
 * Golafly admin, week 3 part 2: every enrollment with its money (section
 * 14), and the commission settings (section 15). The only place these
 * endpoints are called. Refunds are made by hand: nothing goes to Stripe.
 */

export type AdminCancellation = {
  cancelled_at: string
  reason: string
  /** admins only: the family and the academy never see it */
  refund_note: string | null
  by: { type: "applicant" | "system" | "admin"; name: string | null }
}

export type AdminEnrollmentSummary = ApiEnrollmentSummary & {
  applicant: {
    id: string
    name: string
    email: string
    relationship: "self" | "parent" | "guardian"
  }
  organization: { id: number; name: string }
  /** the percent frozen on the enrollment */
  commission_rate: number
  application: { id: number; reference: string | null; status: string }
  cancellation: AdminCancellation | null
}

type MinorMoney = { amount_minor: number; amount: string; currency: string }

export type AdminEnrollment = Omit<AdminEnrollmentSummary, never> &
  Omit<ApiEnrollment, keyof ApiEnrollmentSummary | "payments"> & {
    payments: (ApiEnrollment["payments"][number] & {
      /** filled when the row is paid */
      commission: MinorMoney | null
      academy_net: MinorMoney | null
      eur_rate: number | null
    })[]
  }

export type AdminEnrollmentsPage = ApiPage<AdminEnrollmentSummary> & {
  meta: ApiPageMeta & { status_counts: Record<EnrollmentStatus, number> }
}

export const adminW3Keys = {
  enrollments: (f: object) => ["admin", "enrollments", f] as const,
  enrollment: (id: number) => ["admin", "enrollment", id] as const,
  settings: ["admin", "settings"] as const,
}

/** GET /academy/admin/enrollments (status, organization_id, academy_id, search) */
export async function listAdminEnrollments(
  params: {
    status?: EnrollmentStatus
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

/** GET /academy/admin/enrollments/{id}: the whole schedule with commission and payout */
export async function getAdminEnrollment(id: number): Promise<AdminEnrollment> {
  const res = await apiClient.get<ApiResponse<AdminEnrollment>>(
    `/academy/admin/enrollments/${id}`
  )
  return res.data.data
}

/** POST …/{id}/cancel {reason, refund_note?}: pending or confirmed, whatever was paid */
export async function cancelAdminEnrollment(
  id: number,
  reason: string,
  refundNote: string
): Promise<AdminEnrollment> {
  const res = await apiClient.post<ApiResponse<AdminEnrollment>>(
    `/academy/admin/enrollments/${id}/cancel`,
    {
      reason: reason.trim(),
      ...(refundNote.trim() ? { refund_note: refundNote.trim() } : {}),
    }
  )
  return res.data.data
}

export type CommissionSettings = {
  default_rate: number
  overrides: {
    organization_id: number
    organization_name: string
    commission_rate: number
    updated_at: string
    updated_by: string | null
  }[]
}

/** GET /academy/admin/settings */
export async function getCommissionSettings(): Promise<CommissionSettings> {
  const res = await apiClient.get<ApiResponse<CommissionSettings>>(
    "/academy/admin/settings"
  )
  return res.data.data
}

/** POST /academy/admin/settings {organization_id, commission_rate|null}: null clears the override */
export async function setCommissionRate(
  organizationId: number,
  rate: number | null
): Promise<CommissionSettings> {
  const res = await apiClient.post<ApiResponse<CommissionSettings>>(
    "/academy/admin/settings",
    { organization_id: organizationId, commission_rate: rate }
  )
  return res.data.data
}
