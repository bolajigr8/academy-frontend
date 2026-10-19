/*
 * Shapes shared by every endpoint (Week 1 API contract, section 1).
 */

/** { "success": true, "message": "Listing retrieved successfully.", "data": {} } */
export type ApiResponse<T> = {
  success: true
  message: string
  data: T
}

/** Paginated lists add `meta`. Query with `page` and `per_page` (1 to 100, default 20). */
export type ApiPageMeta = {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export type ApiPage<T> = ApiResponse<T[]> & { meta: ApiPageMeta }

export type PaginationParams = {
  page?: number
  per_page?: number
}

/** 422 field errors: list items are addressed with a dot and index ("images.0.file"). */
export type ApiFieldErrors = Record<string, string[]>

/**
 * The three error bodies. Read `message` in every case.
 * 401: { message }. 403: { message }. 404 / 422 action refused:
 * { success: false, message, errors: null }. 422 field errors: { message, errors }.
 */
export type ApiErrorResponse = {
  success?: false
  message: string
  errors?: ApiFieldErrors | null
}

/** Every price in a response. `amount` is pre-formatted ("8500.00"); a missing price is null. */
export type ApiMoney = {
  amount_minor: number
  amount: string
  currency: string
}
