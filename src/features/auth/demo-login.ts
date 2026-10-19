import type { LoginRole } from "./next"

/** Prototype rule: an email that mentions academy, club or host signs in to the academy demo. */
export function roleForEmail(email: string, academyFirst: boolean): LoginRole {
  return /academy|club|host/i.test(email) || academyFirst ? "host" : "family"
}

/** A query value can arrive as a string, a list or nothing. */
export function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
