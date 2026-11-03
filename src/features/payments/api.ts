import type {
  ApiEnrollmentPayment,
  ApiFamilyPayment,
  EnrollmentStatus,
  PaymentStatus,
} from "@/features/enrollments/api"
import { apiClient } from "@/lib/api/client"
import type { ApiMoney, ApiPage, ApiResponse } from "@/lib/api/types"

/*
 * Week 3 part 3: paying through Stripe Checkout (section 18), the academy's
 * payments with its payout (19), and Golafly's payments and card payments
 * (20). The only place these are called.
 */

/* ---------------- the family (section 18) ---------------- */

/**
 * POST /academy/me/payments/checkout {payment_ids}: 1 to 20 due or overdue
 * rows of ONE enrollment, charged as one card payment. Answers 201 with
 * where to send the browser. Refusals: mixed_enrollments,
 * enrollment_cancelled, payment_not_due, below_minimum_charge,
 * payment_in_progress, 502 payment_provider_unavailable, 429.
 */
export async function startCheckout(paymentIds: number[]): Promise<{
  checkout_url: string
  session_id: string
  /** part 5: the total charged (the rows plus the fee) */
  amount?: ApiMoney
  /** part 5: the fee inside it; null when the fee is 0 */
  service_fee?: ApiMoney | null
}> {
  const res = await apiClient.post<
    ApiResponse<{
      checkout_url: string
      session_id: string
      amount?: ApiMoney
      service_fee?: ApiMoney | null
    }>
  >("/academy/me/payments/checkout", { payment_ids: paymentIds })
  return res.data.data
}

/** The return page's five answers (section 18) */
export type CheckoutStatus =
  "pending" | "paid" | "refund_due" | "expired" | "failed"

export type ApiCheckout = {
  session_id: string
  status: CheckoutStatus
  /** what this checkout charged (part 5: the fee included) */
  amount: ApiMoney
  /** part 5: the service fee inside amount; null when none was charged */
  service_fee?: ApiMoney | null
  paid_at: string | null
  enrollment: { id: number; status: EnrollmentStatus }
  /** the rows this checkout covered, as GET /me/payments */
  payments: ApiFamilyPayment[]
}

/**
 * GET /academy/me/payments/by-session/{sessionId}: read from the API's own
 * records, safe to poll (every 2 s for about 30 s). 404 when unknown or not
 * this account's (sessionId starts cs_).
 */
export async function getCheckout(sessionId: string): Promise<ApiCheckout> {
  const res = await apiClient.get<ApiResponse<ApiCheckout>>(
    `/academy/me/payments/by-session/${encodeURIComponent(sessionId)}`,
    { headers: { "X-Silent-Error": "1" } }
  )
  return res.data.data
}

/* ---------------- the academy (section 19) ---------------- */

/** pending until sent to the academy, then paid_out; part 4 adds the rest */
export type PayoutStatus =
  | "pending"
  | "held"
  | "processing"
  | "paid_out"
  | "failed"
  | "cancelled"
  | "reversed"

export type ApiPayout = {
  status: PayoutStatus | (string & {})
  /** equal to academy_net */
  amount: ApiMoney
  /** when it was sent; null until then (absent in responses captured before part 4) */
  paid_at?: string | null
}

/** The academy's row: the family's row without enrollment_id, plus the money split */
export type ApiPortalPayment = ApiEnrollmentPayment & {
  application_reference: string | null
  listing_title: string
  academy_name: string
  player_name: string
  enrollment: { id: number; status: EnrollmentStatus }
  /** Golafly's commission; null until paid */
  commission: ApiMoney | null
  /** the amount minus the commission; null until paid */
  academy_net: ApiMoney | null
  payout: ApiPayout | null
}

export type ApiPaymentTotals = {
  paid_gross: ApiMoney
  commission: ApiMoney
  academy_net: ApiMoney
  paid_count: number
  outstanding_gross: ApiMoney
  paid_out: ApiMoney
  payout_pending: ApiMoney
}

export type ApiPaymentsPage<T> = ApiPage<T> & {
  meta: ApiPage<T>["meta"] & {
    /** keyed by currency, over the whole filtered result (not only the page) */
    totals: Record<string, ApiPaymentTotals>
  }
}

/** GET /academy/portal/payments (newest payment first; cancelled rows only when asked) */
export async function listPortalPayments(
  params: {
    status?: PaymentStatus
    listing_id?: number
    page?: number
    per_page?: number
  } = {}
): Promise<ApiPaymentsPage<ApiPortalPayment>> {
  const res = await apiClient.get<ApiPaymentsPage<ApiPortalPayment>>(
    "/academy/portal/payments",
    { params: { per_page: 20, ...params } }
  )
  return res.data
}

/* ---------------- Golafly (section 20) ---------------- */

export type ApiAdminPayment = ApiPortalPayment & {
  /** one EUR bought this much of the row's currency (1 for euros); null until paid */
  eur_rate: number | string | null
  academy: { id: number; name: string }
  organization: { id: number; name: string }
  family_email: string
  /* part 4 (payouts): absent in responses captured before it */
  stripe_transfer_id?: string | null
  payout_destination?: string | null
  payout_failure?: string | null
  payout_attempts?: number
  payout_note?: string | null
  payout_decided_by?: unknown
  transaction: {
    id: number
    payment_status: string
    fulfilment_status: string
    /** part 5: one fee per transaction (shared by its rows) */
    service_fee_rate?: number | null
    service_fee_minor?: number
  } | null
}

/** GET /academy/admin/payments (status, academy_id, payout_status, per_page) */
export async function listAdminPayments(
  params: {
    status?: PaymentStatus
    academy_id?: number
    payout_status?: PayoutStatus
    page?: number
    per_page?: number
  } = {}
): Promise<ApiPaymentsPage<ApiAdminPayment>> {
  const res = await apiClient.get<ApiPaymentsPage<ApiAdminPayment>>(
    "/academy/admin/payments",
    { params: { per_page: 20, ...params } }
  )
  return res.data
}

/** A card payment Stripe was asked to take (the older /transactions endpoint) */
export type ApiTransaction = {
  id: number
  product_type: string
  academy_id: number | null
  user_id: string | null
  email: string
  /** a decimal string, "350.00"; the currency is the academy's (paid_for.academy.price_currency) */
  amount: string
  payment_method: string
  payment_status: "pending" | "paid" | "failed" | "expired" | (string & {})
  fulfilment_status: "pending" | "applied" | "refund_due" | (string & {})
  /** part 5: the fee rate charged (null before the fee existed) and the fee, in minor units */
  service_fee_rate?: number | null
  service_fee_minor?: number
  fulfilled_at: string | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  metadata: Record<string, string> | null
  paid_at: string | null
  created_at: string
  updated_at: string
  paid_for: {
    type: string
    academy?: {
      id: number
      name: string
      slug: string
      city: string | null
      country_name: string | null
      country_code: string | null
      price_from: string | null
      price_currency: string | null
      status: boolean
    }
  } | null
}

/**
 * GET /api/v1/transactions (admin): no meta block (page with page/per_page),
 * UTC timestamps with microseconds. refund_due is the team's refund list.
 */
export async function listTransactions(
  params: {
    payment_status?: "pending" | "paid" | "failed" | "expired"
    fulfilment_status?: "pending" | "applied" | "refund_due"
    academy_id?: number
    q?: string
    page?: number
    per_page?: number
  } = {}
): Promise<{ data: ApiTransaction[] }> {
  const res = await apiClient.get<{ success: boolean; data: ApiTransaction[] }>(
    "/transactions",
    { params: { per_page: 15, ...params } }
  )
  return { data: res.data.data ?? [] }
}

export const paymentKeys = {
  all: ["payments"] as const,
  checkout: (id: string) => [...paymentKeys.all, "checkout", id] as const,
  portal: (p: object) => [...paymentKeys.all, "portal", p] as const,
  admin: (p: object) => [...paymentKeys.all, "admin", p] as const,
  transactions: (p: object) => [...paymentKeys.all, "transactions", p] as const,
}

/* shape-check aliases (generic instances for the checker) */
export type ApiPaymentsPage_ApiPortalPayment = ApiPaymentsPage<ApiPortalPayment>
export type ApiPaymentsPage_ApiAdminPayment = ApiPaymentsPage<ApiAdminPayment>

/* ---------------- week 3 part 4: the academy's payout account (section 22) ---------------- */

export type PayoutAccountStatus =
  "none" | "onboarding" | "restricted" | "ready" | "disconnected"

export type ApiPayoutAccount = {
  status: PayoutAccountStatus
  /** a code, not text to show; recipient_agreement = contact Golafly */
  disabled_reason: string | null
  /** when the status was last read from Stripe; null with no account */
  checked_at: string | null
  /** how many things Stripe still needs (only the number) */
  requirements_due: number
}

/** GET /academy/portal/payout-account: any member; asks Stripe again when stale */
export async function getPayoutAccount(): Promise<ApiPayoutAccount> {
  const res = await apiClient.get<ApiResponse<ApiPayoutAccount>>(
    "/academy/portal/payout-account"
  )
  return res.data.data
}

/**
 * POST /academy/portal/payout-account (owner only, no body): a single-use
 * link into Stripe, its form (onboarding) or, once ready, its dashboard.
 * Never kept: ask for a new one on every click. Refusals: owner_required
 * (403), payout_country_unsupported (422), 502, 429 (5 a minute).
 */
export async function createPayoutLink(): Promise<{
  url: string
  expires_at: string | null
  link_type: "onboarding" | "dashboard"
}> {
  const res = await apiClient.post<
    ApiResponse<{
      url: string
      expires_at: string | null
      link_type: "onboarding" | "dashboard"
    }>
  >("/academy/portal/payout-account")
  return res.data.data
}

/**
 * Where Golafly can pay an academy (section 22): the US, Canada, the UK,
 * Switzerland and the EEA. Any other country is refused before anything is
 * created, so the page says so before the owner clicks.
 */
export const PAYOUT_COUNTRIES = new Set([
  "US",
  "CA",
  "GB",
  "CH",
  "IS",
  "LI",
  "NO",
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
])

/* ---------------- week 3 part 4: the admin's decision (section 24) ---------------- */

/**
 * POST /academy/admin/payments/{paymentId}/payout {action, note}: a HELD
 * payout only. release sends it (euros only); cancel means it is never paid.
 * Answers with the row as in the admin's list. Refusals: payout_not_held
 * (+ current_status), payout_currency_not_supported, field errors, 404.
 */
export async function decidePayout(
  paymentId: number,
  action: "release" | "cancel",
  note: string
): Promise<{ row: ApiAdminPayment; message: string }> {
  const res = await apiClient.post<ApiResponse<ApiAdminPayment>>(
    `/academy/admin/payments/${paymentId}/payout`,
    { action, note: note.trim() }
  )
  return { row: res.data.data, message: res.data.message }
}

export const payoutKeys = {
  account: () => ["payout-account"] as const,
}

/* ---------------- week 3 part 5: the service fee (section 29) ---------------- */

/**
 * The service fee on the rows the family picked, exactly as the API computes
 * it (section 29): once on the SUM of the rows (never row by row), the rate
 * turned into hundredths of a percent (exact, two decimals), rounded half up
 * to a whole minor unit, in integers. What this returns is what Stripe charges.
 */
export const serviceFee = (rowsMinor: number, rate: number): number =>
  Math.floor((rowsMinor * Math.round(rate * 100) + 5000) / 10000)
