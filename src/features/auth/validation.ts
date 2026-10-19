import { AUTH } from "@/data/auth-copy"
import { LIVE } from "@/data/live-copy"
import { isEmail } from "@/features/applications/flow"

export type FieldErrors = Record<string, string>

export const LOGIN_IDS = {
  email: "login-email",
  password: "login-password",
} as const

export const REGISTER_IDS = {
  org: "register-org",
  orgType: "register-orgtype",
  first: "register-first",
  last: "register-last",
  email: "register-email",
  password: "register-password",
  country: "register-country",
  authority: "register-authority",
  terms: "register-terms",
} as const

export function validateLogin(v: {
  email: string
  password: string
}): FieldErrors {
  const err: FieldErrors = {}
  if (!isEmail(v.email)) err[LOGIN_IDS.email] = AUTH.login.errors.email
  if (!v.password) err[LOGIN_IDS.password] = AUTH.login.errors.password
  return err
}

export type RegisterValues = {
  first: string
  last: string
  email: string
  password: string
  country: string
  org: string
  title: string
  terms: boolean
  authority: boolean
  /** api mode only: the backend requires club | independent_academy for academies */
  orgType?: "" | "club" | "independent_academy"
}

/**
 * Same checks, same order and same messages as register.html. `score` comes
 * from passwordScore(). `needsOrgType` adds the organization type check the
 * backend requires (api mode).
 */
export function validateRegister(
  role: "family" | "academy",
  v: RegisterValues,
  score: number,
  needsOrgType = false
): FieldErrors {
  const e = AUTH.register.errors
  const err: FieldErrors = {}
  if (role === "academy" && !v.org.trim()) err[REGISTER_IDS.org] = e.org
  if (needsOrgType && role === "academy" && !v.orgType)
    err[REGISTER_IDS.orgType] = LIVE.organizationType.error
  if (!v.first.trim()) err[REGISTER_IDS.first] = e.first
  if (!v.last.trim()) err[REGISTER_IDS.last] = e.last
  if (!isEmail(v.email)) err[REGISTER_IDS.email] = e.email
  if (score < 2) err[REGISTER_IDS.password] = e.password
  if (!v.country) err[REGISTER_IDS.country] = e.country
  if (role === "academy" && !v.authority)
    err[REGISTER_IDS.authority] = e.authority
  if (!v.terms) err[REGISTER_IDS.terms] = e.terms
  return err
}
