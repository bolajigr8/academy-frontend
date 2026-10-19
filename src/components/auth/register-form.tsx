"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { ChoiceGroup } from "@/components/shared/choice-group"
import { CheckField } from "@/components/shared/check-field"
import { DisplayHeading } from "@/components/shared/display-heading"
import {
  ErrorSummary,
  type ErrorSummaryHandle,
} from "@/components/shared/error-summary"
import { FieldError, FormField } from "@/components/shared/form-field"
import { NativeSelect } from "@/components/shared/native-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { COUNTRIES } from "@/data/catalog"
import { AUTH } from "@/data/auth-copy"
import { LIVE } from "@/data/live-copy"
import type { ApiOrganizationType } from "@/features/auth/api"
import { useCountries, useRegister } from "@/features/auth/hooks"
import { startDemoSession, startSession } from "@/features/auth/session"
import { passwordScore } from "@/features/applications/flow"
import {
  REGISTER_IDS as ID,
  validateRegister,
  type RegisterValues,
} from "@/features/auth/validation"
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api/errors"
import { isLive } from "@/lib/data-source"
import { routes, type AuthRole } from "@/routes"

import { AuthMain } from "./auth-main"
import { AuthPanel } from "./auth-panel"
import { PasswordInput } from "./password-input"
import { PasswordStrength } from "./password-strength"

type Role = "family" | "academy"

type Props = {
  /** the ?role= value: "academy" pre-selects the academy option */
  initialRole?: AuthRole
}

const EMPTY: RegisterValues = {
  first: "",
  last: "",
  email: "",
  password: "",
  country: "",
  org: "",
  title: "",
  terms: false,
  authority: false,
  orgType: "",
}

/** Backend field -> control id, for 422 field errors */
const SERVER_FIELDS = {
  name: ID.first,
  email: ID.email,
  password: ID.password,
  password_confirmation: ID.password,
  country_code: ID.country,
  organization_name: ID.org,
  organization_type: ID.orgType,
}

/*
 * Registration (register.html).
 * api mode: POST /auth/register (countries from GET /countries), then the
 * success panel; the account is signed in.
 * mock mode (prototype behavior): nothing is sent; the matching demo persona signs in.
 */
export function RegisterForm({ initialRole }: Props) {
  const router = useRouter()
  const live = isLive("auth")
  const countries = useCountries()
  const registerRequest = useRegister()
  const t = AUTH.register
  const [role, setRole] = useState<Role>(
    initialRole === "academy" ? "academy" : "family"
  )
  const [v, setV] = useState<RegisterValues>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const summaryRef = useRef<ErrorSummaryHandle>(null)
  const score = passwordScore(v.password)
  const academy = role === "academy"

  const text =
    (key: keyof RegisterValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setV({ ...v, [key]: e.target.value })
  const flag =
    (key: "terms" | "authority") => (e: React.ChangeEvent<HTMLInputElement>) =>
      setV({ ...v, [key]: e.target.checked })

  const showErrors = (found: Record<string, string>) => {
    setErrors(found)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = validateRegister(role, v, score, live)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    if (!live) {
      setDone(true)
      return
    }
    registerRequest.mutate(
      {
        name: `${v.first.trim()} ${v.last.trim()}`,
        email: v.email.trim(),
        password: v.password,
        // the form has one password field; the API wants it confirmed
        password_confirmation: v.password,
        role: academy ? "academy" : "applicant",
        country_code: v.country,
        ...(academy
          ? {
              organization_name: v.org.trim(),
              organization_type: v.orgType || undefined,
            }
          : {}),
      },
      {
        onSuccess: (data) => {
          startSession(data)
          setDone(true)
        },
        onError: (error) => {
          const { byControl, unmatched } = getApiFieldErrors(
            error,
            SERVER_FIELDS
          )
          if (Object.keys(byControl).length > 0) showErrors(byControl)
          else
            showErrors({
              [ID.email]:
                unmatched[0] ?? getApiErrorMessage(error, LIVE.requestFailed),
            })
        },
      }
    )
  }

  const cont = () => {
    if (!live) startDemoSession(academy ? "host" : "family")
    router.push(academy ? routes.club.dashboard : routes.family.players())
  }

  const panel = academy ? t.panelAcademy : t.panelFamily
  const finished = academy ? t.doneAcademy : t.doneFamily

  return (
    <>
      <AuthPanel title={panel.title} text={panel.text} />
      <AuthMain>
        {done ? (
          <div
            role="status"
            className="grid justify-items-start gap-4 rounded-lg border border-border-2 bg-surface-elevated p-7"
          >
            <span
              aria-hidden="true"
              className="grid size-16 place-items-center rounded-full bg-gf-neon text-text-on-neon shadow-(--glow-neon-md)"
            >
              <Icon name="check" size={30} sw={2.6} />
            </span>
            <DisplayHeading as="h1">{finished.title}</DisplayHeading>
            <p className="text-fs-16 leading-lh-relaxed text-fg-2">
              {finished.text}
            </p>
            <Button size="lg" onClick={cont} ref={(el) => el?.focus()}>
              {finished.cta} <Icon name="arrow" size={18} />
            </Button>
          </div>
        ) : (
          <>
            <DisplayHeading as="h1">{t.title}</DisplayHeading>
            <p className="text-fs-14 text-fg-3">
              {t.haveOne}{" "}
              <Link href={routes.login()} className="am-link">
                {t.signIn}
              </Link>
            </p>
            <form className="mt-1 grid gap-4" onSubmit={submit} noValidate>
              <ErrorSummary errors={errors} ref={summaryRef} />
              <ChoiceGroup<Role>
                id="register-role"
                name="role"
                legend={t.roleLegend}
                value={role}
                onChange={setRole}
                options={[
                  { value: "family", ...t.roleFamily },
                  { value: "academy", ...t.roleAcademy },
                ]}
              />
              {academy ? (
                <FormField
                  id={ID.org}
                  label={t.org}
                  required
                  error={errors[ID.org]}
                >
                  {(c) => (
                    <Input
                      {...c}
                      name="organization"
                      autoComplete="organization"
                      value={v.org}
                      onChange={text("org")}
                    />
                  )}
                </FormField>
              ) : null}
              {academy && live ? (
                <ChoiceGroup<"" | ApiOrganizationType>
                  id={ID.orgType}
                  name="organizationType"
                  legend={LIVE.organizationType.legend}
                  value={v.orgType ?? ""}
                  onChange={(orgType) => setV({ ...v, orgType })}
                  error={errors[ID.orgType]}
                  options={[
                    { value: "club", label: LIVE.organizationType.club },
                    {
                      value: "independent_academy",
                      label: LIVE.organizationType.independent_academy,
                    },
                  ]}
                />
              ) : null}
              <div className="grid grid-cols-2 gap-4 le-720:grid-cols-[1fr]">
                <FormField
                  id={ID.first}
                  label={t.first}
                  required
                  error={errors[ID.first]}
                >
                  {(c) => (
                    <Input
                      {...c}
                      name="firstName"
                      autoComplete="given-name"
                      value={v.first}
                      onChange={text("first")}
                    />
                  )}
                </FormField>
                <FormField
                  id={ID.last}
                  label={t.last}
                  required
                  error={errors[ID.last]}
                >
                  {(c) => (
                    <Input
                      {...c}
                      name="lastName"
                      autoComplete="family-name"
                      value={v.last}
                      onChange={text("last")}
                    />
                  )}
                </FormField>
              </div>
              {academy && !live ? (
                <FormField
                  id="register-title"
                  label={t.yourRole}
                  hint={t.yourRoleHint}
                >
                  {(c) => (
                    <Input
                      {...c}
                      name="jobTitle"
                      autoComplete="organization-title"
                      value={v.title}
                      onChange={text("title")}
                    />
                  )}
                </FormField>
              ) : null}
              <FormField
                id={ID.email}
                label={academy ? t.workEmail : t.email}
                required
                error={errors[ID.email]}
              >
                {(c) => (
                  <Input
                    {...c}
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={v.email}
                    onChange={text("email")}
                  />
                )}
              </FormField>
              <FormField
                id={ID.password}
                label={t.password}
                hint={t.passwordHint}
                required
                error={errors[ID.password]}
              >
                {(c) => (
                  <div>
                    <PasswordInput
                      {...c}
                      name="password"
                      autoComplete="new-password"
                      value={v.password}
                      onChange={text("password")}
                    />
                    <PasswordStrength score={score} hasValue={!!v.password} />
                  </div>
                )}
              </FormField>
              <FormField
                id={ID.country}
                label={t.country}
                required
                error={errors[ID.country]}
              >
                {(c) => (
                  <NativeSelect
                    {...c}
                    name="country"
                    value={v.country}
                    disabled={live && !countries}
                    onChange={(e) => setV({ ...v, country: e.target.value })}
                  >
                    <option value="">{t.countryPlaceholder}</option>
                    {(live ? (countries ?? []) : COUNTRIES).map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                    {live ? null : (
                      <option value="OTHER">{t.countryOther}</option>
                    )}
                  </NativeSelect>
                )}
              </FormField>
              {academy ? (
                <div className="grid min-w-0 gap-1.5">
                  <CheckField
                    id={ID.authority}
                    name="authority"
                    checked={v.authority}
                    onChange={flag("authority")}
                    aria-invalid={errors[ID.authority] ? true : undefined}
                    aria-describedby={
                      errors[ID.authority] ? `${ID.authority}-err` : undefined
                    }
                  >
                    {t.authority}
                  </CheckField>
                  <FieldError id={`${ID.authority}-err`}>
                    {errors[ID.authority]}
                  </FieldError>
                </div>
              ) : null}
              <div className="grid min-w-0 gap-1.5">
                <CheckField
                  id={ID.terms}
                  name="terms"
                  checked={v.terms}
                  onChange={flag("terms")}
                  aria-invalid={errors[ID.terms] ? true : undefined}
                  aria-describedby={
                    errors[ID.terms] ? `${ID.terms}-err` : undefined
                  }
                >
                  {t.termsBefore}
                  <a href={routes.site.terms} className="am-link">
                    {t.terms}
                  </a>
                  {t.termsMiddle}
                  <a href={routes.site.privacy} className="am-link">
                    {t.privacy}
                  </a>
                  {t.termsAfter}
                </CheckField>
                <FieldError id={`${ID.terms}-err`}>
                  {errors[ID.terms]}
                </FieldError>
              </div>
              <Button
                type="submit"
                size="lg"
                block
                disabled={registerRequest.isPending}
                aria-busy={registerRequest.isPending}
              >
                {academy ? t.submitAcademy : t.submitFamily}
              </Button>
              {live ? null : (
                <p className="flex items-center gap-2 text-fs-13 text-fg-3">
                  {t.hint}
                </p>
              )}
            </form>
          </>
        )}
      </AuthMain>
    </>
  )
}
