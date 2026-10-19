/*
 * Cookie names, shared by the browser session (lib/api/session.ts) and the
 * route guard (src/proxy.ts). Plain constants only, no imports.
 */
export const TOKEN_COOKIE = "gf-academy-token"
/** The signed-in user's role as the backend sends it ("academy" | "applicant") */
export const ROLE_COOKIE = "gf-academy-role"
/** A small JSON copy of the signed-in user (id, name, email, role, country_code) */
export const USER_COOKIE = "gf-academy-user"
/** "<expiry epoch ms>|<1 remember, 0 session>": when to refresh the token */
export const EXP_COOKIE = "gf-academy-exp"
