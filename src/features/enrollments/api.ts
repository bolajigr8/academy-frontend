import { apiClient } from "@/lib/api/client"
import type { ApiOwnReview } from "@/features/reviews/api"
import type { ApiMoney, ApiPage, ApiResponse } from "@/lib/api/types"

/*
 * Week 3 part 1: what happens after an academy accepts an application.
 * The academy moves it to enrollment with a payment plan (section 2); the
 * backend builds the schedule from the listing, holds a place and gives the
 * family 7 days for the first payment. The family reads its enrollments and
 * payment lines (sections 3, 4) and can cancel before paying (section 5).
 * The academy reads its enrollments (section 6). Paying is part 3: until
 * then a line can be read but not paid. The only place these are called.
 */

/** pending: waiting for the required payments; confirmed: enrolled; cancelled */
export type EnrollmentStatus = "pending" | "confirmed" | "cancelled"
export type EnrollmentPlan = "full" | "deposit_balance" | "installments"
/** scheduled (not yet due), due (pay now), paid, overdue (past its date), cancelled */
export type PaymentStatus =
  "scheduled" | "due" | "paid" | "overdue" | "cancelled"
export type PaymentKind =
  "registration_fee" | "deposit" | "full" | "balance" | "installment" | "extra"

/** One line of the schedule (section 3) */
export type ApiEnrollmentPayment = {
  id: number
  kind: PaymentKind
  /** the extra's name; null for the other kinds */
  label: string | null
  amount: ApiMoney
  /** plain date; for the rows due now it is the first-payment deadline's date */
  due_date: string
  status: PaymentStatus
  /** true for the rows that must be paid to be enrolled */
  required_for_enrollment: boolean
  /** null until paid (paying is part 3) */
  paid_at: string | null
}

/** The totals every enrollment shape carries */
export type ApiEnrollmentCore = {
  id: number
  status: EnrollmentStatus
  plan: EnrollmentPlan
  /** the price, the registration fee and the extras */
  total: ApiMoney
  /** paid rows; cancelled rows count toward neither */
  paid: ApiMoney
  /** rows still to pay (scheduled, due or overdue) */
  outstanding: ApiMoney
  /** the required rows must be paid by then or the place is released; null when nothing is owed */
  first_payment_deadline: string | null
  confirmed_at: string | null
}

/** The block on the ACADEMY's application view (section 6): core + the schedule */
export type ApiAcademyEnrollmentBlock = ApiEnrollmentCore & {
  payments: ApiEnrollmentPayment[]
}

/** The block on the FAMILY's application view (section 1): only id and status */
export type ApiFamilyEnrollmentBlock = { id: number; status: EnrollmentStatus }

/** A family's enrollment in the list (section 3): totals, no rows */
export type ApiEnrollmentSummary = ApiEnrollmentCore & {
  application: { id: number; reference: string | null }
  listing: {
    /** present on the academy's side (section 6) */
    id?: number
    title: string
    slug: string
    academy: { id: number; name: string }
  }
  /** the player as the academy received the application */
  player: { first_name: string; last_name: string }
  intake_start_date: string
  cancelled_at: string | null
  cancel_reason: string | null
}

/** One enrollment with its schedule (section 3) */
export type ApiEnrollment = ApiEnrollmentSummary & {
  payments: ApiEnrollmentPayment[]
  /** week 3 part 2: the family's own review, in any status; ABSENT until written */
  review?: ApiOwnReview
}

/** The academy's view adds who applied (section 6) */
export type ApiPortalEnrollmentSummary = ApiEnrollmentSummary & {
  applicant: { name: string; relationship: "self" | "parent" | "guardian" }
}
export type ApiPortalEnrollment = ApiPortalEnrollmentSummary & {
  payments: ApiEnrollmentPayment[]
}

export type ApiPortalEnrollmentsPage = ApiPage<ApiPortalEnrollmentSummary> & {
  meta: ApiPage<ApiPortalEnrollmentSummary>["meta"] & {
    /** every status, 0 included; follows every filter except status */
    status_counts: Record<EnrollmentStatus, number>
  }
}

/** A family payment line with its enrollment alongside (section 4) */
export type ApiFamilyPayment = ApiEnrollmentPayment & {
  enrollment_id: number
  application_reference: string | null
  listing_title: string
  academy_name: string
  player_name: string
}

/* ---------------- the family (applicant token) ---------------- */

/** GET /academy/me/enrollments (newest first; per_page up to 50) */
export async function listMyEnrollments(
  params: { status?: EnrollmentStatus; page?: number; per_page?: number } = {}
): Promise<ApiPage<ApiEnrollmentSummary>> {
  const res = await apiClient.get<ApiPage<ApiEnrollmentSummary>>(
    "/academy/me/enrollments",
    { params: { per_page: 50, ...params } }
  )
  return res.data
}

/**
 * GET /academy/me/enrollments/{id}: with the schedule (someone else's: 404).
 * Part 5: meta.service_fee_rate (the current fee, a percent; 0 = none) is
 * carried on the result as feeRate, so the screen can show the fee first.
 */
export async function getMyEnrollment(
  id: number
): Promise<ApiEnrollment & { feeRate: number }> {
  const res = await apiClient.get<
    ApiResponse<ApiEnrollment> & { meta?: { service_fee_rate?: number } }
  >(`/academy/me/enrollments/${id}`)
  return { ...res.data.data, feeRate: res.data.meta?.service_fee_rate ?? 0 }
}

/** Part 5: the current service fee rate next to the paging (0 = none) */
export type ApiFamilyPaymentsPage = ApiPage<ApiFamilyPayment> & {
  meta: ApiPage<ApiFamilyPayment>["meta"] & { service_fee_rate?: number }
}

/** GET /academy/me/payments: every line, the next due first (per_page up to 50) */
export async function listMyPayments(
  params: { status?: PaymentStatus; page?: number; per_page?: number } = {}
): Promise<ApiFamilyPaymentsPage> {
  const res = await apiClient.get<ApiFamilyPaymentsPage>(
    "/academy/me/payments",
    { params: { per_page: 50, ...params } }
  )
  return res.data
}

/** Every page of a paginated list (pages of 50, at most 10 pages) */
export async function allPages<T>(
  load: (page: number) => Promise<ApiPage<T>>
): Promise<T[]> {
  const out: T[] = []
  for (let page = 1; page <= 10; page++) {
    const res = await load(page)
    out.push(...res.data)
    if (page >= (res.meta?.last_page ?? 1)) break
  }
  return out
}

/* ---------------- the academy (academy token) ---------------- */

/**
 * POST /academy/portal/applications/{id}/move-to-enrollment (section 2).
 * Amounts in minor units. balance_due_date only with deposit_balance;
 * installments (1 to 24) only with installments; extras (up to 10) any plan.
 * Answers with the academy's application view and its new enrollment block.
 */
export type MoveToEnrollmentBody = {
  plan: EnrollmentPlan
  balance_due_date?: string
  installments?: { amount: number; due_date: string }[]
  extras?: { label: string; amount: number }[]
}

/** GET /academy/portal/enrollments (newest first, with status_counts) */
export async function listPortalEnrollments(
  params: {
    status?: EnrollmentStatus
    listing_id?: number
    intake_id?: number
    search?: string
    page?: number
    per_page?: number
  } = {}
): Promise<ApiPortalEnrollmentsPage> {
  const res = await apiClient.get<ApiPortalEnrollmentsPage>(
    "/academy/portal/enrollments",
    { params: { per_page: 20, ...params } }
  )
  return res.data
}

/** GET /academy/portal/enrollments/{id} (another organization's: 404) */
export async function getPortalEnrollment(
  id: number
): Promise<ApiPortalEnrollment> {
  const res = await apiClient.get<ApiResponse<ApiPortalEnrollment>>(
    `/academy/portal/enrollments/${id}`
  )
  return res.data.data
}

export const enrollmentKeys = {
  all: ["enrollments"] as const,
  mine: () => [...enrollmentKeys.all, "mine"] as const,
  myOne: (id: number) => [...enrollmentKeys.all, "mine", id] as const,
  myPayments: () => [...enrollmentKeys.all, "my-payments"] as const,
  portal: (p: object) => [...enrollmentKeys.all, "portal", p] as const,
  portalOne: (id: number) => [...enrollmentKeys.all, "portal-one", id] as const,
}
