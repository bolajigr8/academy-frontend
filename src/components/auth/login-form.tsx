"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { CheckField } from "@/components/shared/check-field"
import { DisplayHeading } from "@/components/shared/display-heading"
import {
  ErrorSummary,
  type ErrorSummaryHandle,
} from "@/components/shared/error-summary"
import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AUTH } from "@/data/auth-copy"
import { LIVE } from "@/data/live-copy"
import { roleForEmail } from "@/features/auth/demo-login"
import { useLogin } from "@/features/auth/hooks"
import { startDemoSession, startSession } from "@/features/auth/session"
import { safeNext, type LoginRole } from "@/features/auth/next"
import { LOGIN_IDS, validateLogin } from "@/features/auth/validation"
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api/errors"
import { isLive } from "@/lib/data-source"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

import { PasswordInput } from "./password-input"

type Props = {
  /** the ?next= value, as received */
  next?: string
  /** true when the page was opened with ?role=academy */
  academyFirst: boolean
}

const demoButton =
  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-sm border bg-surface-elevated px-[14px] py-3 text-left [transition:border-color_var(--dur-base),transform_var(--dur-fast)] hover:-translate-y-px"

/** Backend field -> control id, for 422 field errors */
const SERVER_FIELDS = {
  email: LOGIN_IDS.email,
  password: LOGIN_IDS.password,
}

/*
 * Sign in (login.html).
 * api mode: POST /auth/login, then the person goes to their own area.
 * mock mode (prototype behavior): nothing is sent; the demo personas sign in locally.
 */
export function LoginForm({ next, academyFirst }: Props) {
  const router = useRouter()
  const live = isLive("auth")
  const [values, setValues] = useState({ email: "", password: "" })
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const summaryRef = useRef<ErrorSummaryHandle>(null)
  const loginRequest = useLogin()
  const t = AUTH.login

  const go = (role: LoginRole) => {
    startDemoSession(role)
    router.push(safeNext(next, role))
  }

  const showErrors = (found: Record<string, string>) => {
    setErrors(found)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = validateLogin(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    if (!live) {
      go(roleForEmail(values.email, academyFirst))
      return
    }
    loginRequest.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onSuccess: (data) => {
          const role = startSession(data, remember)
          if (role === "guest") return
          router.push(safeNext(next, role))
        },
        onError: (error) => {
          const { byControl } = getApiFieldErrors(error, SERVER_FIELDS)
          showErrors(
            Object.keys(byControl).length > 0
              ? byControl
              : {
                  [LOGIN_IDS.email]: getApiErrorMessage(
                    error,
                    LIVE.requestFailed
                  ),
                }
          )
        },
      }
    )
  }

  return (
    <>
      <DisplayHeading as="h1">{t.title}</DisplayHeading>
      <p className="text-fs-14 text-fg-3">
        {t.newHere}{" "}
        <Link href={routes.register(undefined, next)} className="am-link">
          {t.createAccount}
        </Link>
      </p>

      {live ? null : (
        <>
          <div
            role="group"
            aria-label={t.demoGroup}
            className="grid gap-[10px] rounded-md border border-border-1 bg-bg-2 p-4"
          >
            <p className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
              {t.demoLabel}
            </p>
            <button
              type="button"
              onClick={() => go("family")}
              className={cn(
                demoButton,
                !academyFirst
                  ? "border-fg-1 hover:border-fg-1"
                  : "border-border-2 hover:border-border-accent"
              )}
            >
              <AvatarInitials initials={t.demoFamily.initials} size={40} />
              <span className="grid min-w-0">
                <b className="text-fs-14">{t.demoFamily.name}</b>
                <small className="text-fs-12 text-fg-3">
                  {t.demoFamily.sub}
                </small>
              </span>
              <Icon name="arrow" size={18} />
            </button>
            <button
              type="button"
              onClick={() => go("host")}
              className={cn(
                demoButton,
                academyFirst
                  ? "border-fg-1 hover:border-fg-1"
                  : "border-border-2 hover:border-border-accent"
              )}
            >
              <AvatarInitials
                initials={t.demoHost.initials}
                size={40}
                tone="ink"
              />
              <span className="grid min-w-0">
                <b className="text-fs-14">{t.demoHost.name}</b>
                <small className="text-fs-12 text-fg-3">{t.demoHost.sub}</small>
              </span>
              <Icon name="arrow" size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 text-fs-13 text-fg-3 before:h-px before:flex-1 before:bg-border-2 before:content-[''] after:h-px after:flex-1 after:bg-border-2 after:content-['']">
            <span>{t.or}</span>
          </div>
        </>
      )}

      <form className="mt-1 grid gap-4" onSubmit={submit} noValidate>
        <ErrorSummary errors={errors} ref={summaryRef} />
        <FormField
          id={LOGIN_IDS.email}
          label={t.email}
          required
          error={errors[LOGIN_IDS.email]}
        >
          {(c) => (
            <Input
              {...c}
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
            />
          )}
        </FormField>
        <FormField
          id={LOGIN_IDS.password}
          label={t.password}
          required
          error={errors[LOGIN_IDS.password]}
        >
          {(c) => (
            <PasswordInput
              {...c}
              name="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(e) =>
                setValues({ ...values, password: e.target.value })
              }
            />
          )}
        </FormField>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CheckField
            name="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          >
            {t.keepSignedIn}
          </CheckField>
          <button type="button" className="border-0 bg-transparent am-link">
            {t.forgot}
          </button>
        </div>
        <Button
          type="submit"
          size="lg"
          block
          disabled={loginRequest.isPending}
          aria-busy={loginRequest.isPending}
        >
          {t.submit}
        </Button>
        {live ? null : (
          <p className="flex items-center gap-2 text-fs-13 text-fg-3">
            {t.hint}
          </p>
        )}
      </form>
    </>
  )
}
