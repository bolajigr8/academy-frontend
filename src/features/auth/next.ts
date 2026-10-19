import { routes } from "@/routes"

/** The two demo personas. "host" is the academy/club side (the prototype's own name). */
export type LoginRole = "family" | "host"

// Same-origin path with an optional simple query string; never "//host" or a full URL.
const SAFE_NEXT = /^\/(?!\/)[\w/.-]*(\?[\w=&%.-]*)?$/

/**
 * Where to send someone after signing in (safeNext in login.html). A valid ?next=
 * is honored, except it never sends a family to the club area or the reverse:
 * those go to the person's own dashboard.
 */
export function safeNext(
  next: string | null | undefined,
  role: LoginRole
): string {
  const dashboard =
    role === "host" ? routes.club.dashboard : routes.family.dashboard
  if (!next || !SAFE_NEXT.test(next)) return dashboard
  if (role === "host" && next.includes("/family/")) return dashboard
  if (role === "family" && next.includes("/club/")) return dashboard
  return next
}
