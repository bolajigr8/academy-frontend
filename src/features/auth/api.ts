import { apiClient } from "@/lib/api/client"
import type { SessionUser } from "@/lib/api/session"
import type { ApiResponse } from "@/lib/api/types"

/*
 * Week 1 API contract, section 2: registration and login.
 * The only place these endpoints are called.
 */

/** The user object in register/login responses (timestamps are "2026-10-05 16:02:30", not ISO) */
export type ApiUser = {
  id: string
  name: string
  email: string
  role: string
  /** may be missing or null on accounts created before the field existed */
  country_code?: string | null
  status: number
  created_at: string
  updated_at: string
}

export type ApiAuthData = {
  user: ApiUser
  token: string
  /** seconds */
  expires_in: number
}

export type ApiCountry = { code: string; name: string }

/** The two account types the API accepts at sign-up */
export type ApiAccountRole = "academy" | "applicant"
export type ApiOrganizationType = "club" | "independent_academy"

export type RegisterBody = {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: ApiAccountRole
  country_code: string
  /** required when role is academy */
  organization_name?: string
  /** required when role is academy */
  organization_type?: ApiOrganizationType
}

export type LoginBody = { email: string; password: string }

/** GET /countries (public). Show `name`, send `code`. */
export async function listCountries(): Promise<ApiCountry[]> {
  const res = await apiClient.get<ApiResponse<ApiCountry[]>>("/countries")
  return res.data.data
}

/** POST /auth/register (public). Returns the user and a token. */
export async function register(body: RegisterBody): Promise<ApiAuthData> {
  const res = await apiClient.post<ApiResponse<ApiAuthData>>(
    "/auth/register",
    body
  )
  return res.data.data
}

/** POST /auth/login (public). Wrong credentials: 422 with a message. */
export async function login(body: LoginBody): Promise<ApiAuthData> {
  const res = await apiClient.post<ApiResponse<ApiAuthData>>(
    "/auth/login",
    body
  )
  return res.data.data
}

/** The part of the user the app keeps in its session cookie */
export function toSessionUser(u: ApiUser): SessionUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    country_code: u.country_code ?? null,
  }
}

/* ---------------- week 2: staying signed in ---------------- */

/** GET /auth/me: the signed-in account (call on app start / reload) */
export async function me(): Promise<ApiUser> {
  const res = await apiClient.get<ApiResponse<{ user: ApiUser }>>("/auth/me")
  return res.data.data.user
}

/** POST /auth/refresh: a new token; the one sent is retired */
export async function refresh(): Promise<{
  token: string
  expires_in: number
}> {
  const res =
    await apiClient.post<ApiResponse<{ token: string; expires_in: number }>>(
      "/auth/refresh"
    )
  return res.data.data
}

/**
 * POST /auth/logout with the token that is being signed out (the session
 * cookies are already gone, so it is passed explicitly). Never shows a toast.
 */
export async function logout(token: string): Promise<void> {
  await apiClient.post("/auth/logout", null, {
    headers: { Authorization: `Bearer ${token}`, "X-Silent-Error": "1" },
  })
}
