"use client"

import { useSyncExternalStore } from "react"

import { useHydrated } from "@/hooks/use-hydrated"
import { isLive } from "@/lib/data-source"
import {
  clearSession,
  getSessionUser,
  getToken,
  getTokenExpiry,
  onSessionChange,
  setSession,
  updateSessionUser,
  type SessionUser,
} from "@/lib/api/session"
import type { DemoRole } from "@/stores/app-store"
import { useDemoSession } from "@/stores/hooks"
import { getAppStore } from "@/stores/instance"

import type { ApiAuthData } from "./api"
import { logout, me, refresh, toSessionUser } from "./api"

/*
 * One session for the whole UI.
 * api mode: the backend session (token + user cookies). mock mode: the demo
 * persona in the prototype store. Components call useSession / startSession /
 * endSession and never touch cookies or the store's role themselves.
 */

export type SessionRole = DemoRole

/** "academy" -> the club area ("host"), "applicant" -> the family area; admins use /admin */
export function roleOf(user: SessionUser | null): SessionRole {
  if (!user) return "guest"
  if (user.role === "academy") return "host"
  if (user.role === "applicant") return "family"
  return "guest"
}

/** The admin session (POST /auth/admin/login; role "admin") */
export function useAdminSession(): {
  hydrated: boolean
  user: SessionUser | null
  isAdmin: boolean
} {
  const { hydrated, user } = useSession()
  return { hydrated, user, isAdmin: user?.role === "admin" }
}

/**
 * After POST /auth/admin/login. The response carries the token only, so the
 * stored user is the admin's email with role "admin" (week 1 part 1, section 8).
 */
export function startAdminSession(
  token: string,
  expiresIn: number | undefined,
  email: string,
  remember = true
): void {
  setSession({
    token,
    expiresIn: expiresIn ?? 60 * 24 * 60 * 60,
    user: {
      id: "admin",
      name: email,
      email,
      role: "admin",
      country_code: null,
    },
    remember,
  })
  getAppStore().setRole("guest")
}

const getServerUser = () => null

export function useSession(): {
  role: SessionRole
  hydrated: boolean
  /** the signed-in backend user (api mode only) */
  user: SessionUser | null
  live: boolean
} {
  const live = isLive("auth")
  const demo = useDemoSession()
  const hydrated = useHydrated()
  const user = useSyncExternalStore(
    onSessionChange,
    getSessionUser,
    getServerUser
  )
  if (!live)
    return { role: demo.role, hydrated: demo.hydrated, user: null, live }
  const liveUser = hydrated ? user : null
  return { role: roleOf(liveUser), hydrated, user: liveUser, live }
}

/**
 * After POST /auth/login or /auth/register: keep the token and user, and keep
 * the demo store's persona in step so pages still on demo data open normally.
 */
export function startSession(data: ApiAuthData, remember = true): SessionRole {
  const user = toSessionUser(data.user)
  setSession({ token: data.token, expiresIn: data.expires_in, user, remember })
  const role = roleOf(user)
  getAppStore().setRole(role)
  return role
}

/** Demo persona sign-in (mock mode only: the prototype's demo buttons) */
export function startDemoSession(role: Exclude<SessionRole, "guest">): void {
  getAppStore().setRole(role)
}

/**
 * Sign out: the browser forgets the session at once, then POST /auth/logout
 * cancels the token on the server (week 2). A failed logout changes nothing
 * for the person: the token is already gone from this device.
 */
export function endSession(): void {
  if (isLive("auth")) {
    const token = getToken()
    clearSession()
    if (token) void logout(token).catch(() => undefined)
  }
  getAppStore().setRole("guest")
}

const REFRESH_WITHIN_MS = 7 * 24 * 60 * 60 * 1000

/**
 * On app start (api mode): GET /auth/me confirms the token and refreshes the
 * stored user (a revoked or expired token answers 401 -> signed out); then
 * POST /auth/refresh renews a token with less than 7 days left.
 */
export async function checkSession(): Promise<void> {
  if (!isLive("auth") || !getToken()) return
  // GET /auth/me serves family and academy tokens only; admins just renew the token
  const stored = getSessionUser()
  if (stored?.role === "admin") {
    const exp = getTokenExpiry()
    if (exp && exp.at - Date.now() < REFRESH_WITHIN_MS) {
      try {
        const fresh = await refresh()
        setSession({
          token: fresh.token,
          expiresIn: fresh.expires_in,
          user: stored,
          remember: exp.remember,
        })
      } catch {
        // 401 already cleared the session
      }
    }
    return
  }
  try {
    const user = await me()
    updateSessionUser(toSessionUser(user))
    getAppStore().setRole(roleOf(getSessionUser()))
    const exp = getTokenExpiry()
    if (exp && exp.at - Date.now() < REFRESH_WITHIN_MS) {
      const fresh = await refresh()
      setSession({
        token: fresh.token,
        expiresIn: fresh.expires_in,
        user: toSessionUser(user),
        remember: exp.remember,
      })
    }
  } catch {
    // 401 already cleared the session; other failures keep it as it was
  }
}

/** Keeps the demo persona equal to the backend session (called once after hydration). */
export function syncDemoRole(): void {
  if (!isLive("auth")) return
  getAppStore().setRole(roleOf(getSessionUser()))
}

/** "Ana Garcia" -> { firstName: "Ana", lastName: "Garcia", initials: "AG" } */
export function personOf(user: SessionUser) {
  const parts = user.name.trim().split(/\s+/).filter(Boolean)
  const firstName = parts[0] ?? user.email
  const lastName = parts.slice(1).join(" ")
  const initials = (
    (parts[0]?.[0] ?? user.email[0] ?? "") +
    (parts[parts.length - 1]?.[0] ?? "")
  )
    .slice(0, parts.length > 1 ? 2 : 1)
    .toUpperCase()
  return { firstName, lastName, initials }
}
