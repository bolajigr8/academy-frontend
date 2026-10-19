import axios from "axios"

import type { ApiErrorResponse } from "./types"

/**
 * The one place an unknown error becomes a message for the person.
 * `fallback` is required so no copy is invented inside lib/.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<Partial<ApiErrorResponse>>(error)) {
    const message = error.response?.data?.message
    if (typeof message === "string" && message.trim() !== "") return message
  }
  return fallback
}

/** HTTP status of a failed request, or null for a network failure / non-HTTP error. */
export function getApiStatus(error: unknown): number | null {
  if (axios.isAxiosError(error)) return error.response?.status ?? null
  return null
}

/**
 * 422 field errors keyed by the form's own control ids.
 * `fields` maps a backend field name to a control id; list fields match on
 * their first segment ("images.0.file" -> "images"). The first message of
 * each field is kept. Backend fields the form does not show are returned under
 * `unmatched` so the caller can still show their text.
 */
export function getApiFieldErrors(
  error: unknown,
  fields: Record<string, string>
): { byControl: Record<string, string>; unmatched: string[] } {
  const byControl: Record<string, string> = {}
  const unmatched: string[] = []
  if (!axios.isAxiosError<Partial<ApiErrorResponse>>(error)) {
    return { byControl, unmatched }
  }
  const errors = error.response?.data?.errors
  if (!errors) return { byControl, unmatched }
  for (const [key, messages] of Object.entries(errors)) {
    const first = Array.isArray(messages) ? messages[0] : undefined
    if (!first) continue
    const control = fields[key] ?? fields[key.split(".")[0]]
    if (control) {
      if (!(control in byControl)) byControl[control] = first
    } else unmatched.push(first)
  }
  return { byControl, unmatched }
}

/**
 * The status refusal (week 2, section 1): a 422 with errors.current_status
 * means someone (or another tab) already moved the record, so the screen
 * should refresh it. null for any other error.
 */
export function getCurrentStatus(error: unknown): string | null {
  if (!axios.isAxiosError<Partial<ApiErrorResponse>>(error)) return null
  const errors = error.response?.data?.errors as
    Record<string, unknown> | null | undefined
  const v = errors?.current_status
  return typeof v === "string" ? v : null
}
