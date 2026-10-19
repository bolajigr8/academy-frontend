import Cookies from "js-cookie"

import {
  EXP_COOKIE,
  ROLE_COOKIE,
  TOKEN_COOKIE,
  USER_COOKIE,
} from "./session-cookies"

/** The signed-in user, as returned by POST /auth/login and /auth/register */
export type SessionUser = {
  id: string
  name: string
  email: string
  /** "academy" | "applicant" (contract section 2) */
  role: string
  country_code: string | null
}

export type SessionInput = {
  token: string
  /** seconds until the token expires (expires_in) */
  expiresIn: number
  user: SessionUser
  /** false = the cookies end with the browser session ("Keep me signed in" off) */
  remember: boolean
}

type Listener = () => void
const listeners = new Set<Listener>()
const emit = () => listeners.forEach((l) => l())

/** Subscribe to sign-in / sign-out / 401. Returns the unsubscribe function. */
export function onSessionChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToken(): string | undefined {
  if (typeof document === "undefined") return undefined
  return Cookies.get(TOKEN_COOKIE)
}

let cachedRaw: string | undefined
let cachedUser: SessionUser | null = null

/** The stored user, or null. Returns the same object until the cookie changes. */
export function getSessionUser(): SessionUser | null {
  if (typeof document === "undefined") return null
  const raw = getToken() ? Cookies.get(USER_COOKIE) : undefined
  if (raw === cachedRaw) return cachedUser
  cachedRaw = raw
  cachedUser = null
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isSessionUser(parsed)) cachedUser = parsed
    } catch {
      cachedUser = null
    }
  }
  return cachedUser
}

function isSessionUser(v: unknown): v is SessionUser {
  if (typeof v !== "object" || v === null) return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.email === "string" &&
    typeof o.role === "string"
  )
}

export function setSession({
  token,
  expiresIn,
  user,
  remember,
}: SessionInput): void {
  const options: Cookies.CookieAttributes = {
    sameSite: "lax",
    secure: window.location.protocol === "https:",
    path: "/",
  }
  if (remember) options.expires = new Date(Date.now() + expiresIn * 1000)
  Cookies.set(TOKEN_COOKIE, token, options)
  Cookies.set(
    EXP_COOKIE,
    `${Date.now() + expiresIn * 1000}|${remember ? 1 : 0}`,
    options
  )
  Cookies.set(ROLE_COOKIE, user.role, options)
  Cookies.set(
    USER_COOKIE,
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      country_code: user.country_code,
    }),
    options
  )
  emit()
}

export function clearSession(): void {
  if (typeof document === "undefined") return
  Cookies.remove(TOKEN_COOKIE, { path: "/" })
  Cookies.remove(ROLE_COOKIE, { path: "/" })
  Cookies.remove(USER_COOKIE, { path: "/" })
  Cookies.remove(EXP_COOKIE, { path: "/" })
  emit()
}

/** When the token expires (epoch ms) and whether it was "keep me signed in" */
export function getTokenExpiry(): { at: number; remember: boolean } | null {
  if (typeof document === "undefined") return null
  const [at, r] = (Cookies.get(EXP_COOKIE) ?? "").split("|")
  const ms = Number(at)
  return Number.isFinite(ms) && ms > 0 ? { at: ms, remember: r === "1" } : null
}

/**
 * Replace the stored user (after GET /auth/me), keeping the token and its
 * expiry. A session from before the expiry cookie existed has no known
 * expiry: then only the user cookies change (never an invented expiry, which
 * would shorten the session and trigger a refresh on every load).
 */
export function updateSessionUser(user: SessionUser): void {
  const token = getToken()
  if (!token) return
  const exp = getTokenExpiry()
  if (exp) {
    setSession({
      token,
      expiresIn: Math.max(60, (exp.at - Date.now()) / 1000),
      user,
      remember: exp.remember,
    })
    return
  }
  const options: Cookies.CookieAttributes = {
    sameSite: "lax",
    secure: window.location.protocol === "https:",
    path: "/",
    // the token's own lifetime is unknown here: the contract's 60 days
    expires: 60,
  }
  Cookies.set(ROLE_COOKIE, user.role, options)
  Cookies.set(
    USER_COOKIE,
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      country_code: user.country_code,
    }),
    options
  )
  emit()
}
