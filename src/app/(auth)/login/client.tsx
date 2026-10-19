"use client"

import { AuthMain } from "@/components/auth/auth-main"
import { AuthPanel } from "@/components/auth/auth-panel"
import { LoginForm } from "@/components/auth/login-form"
import { AUTH } from "@/data/auth-copy"

/* Sign in (login.html?next=&role=) */
export function LoginClient({
  next,
  academyFirst,
}: {
  next: string | undefined
  academyFirst: boolean
}) {
  return (
    <>
      <AuthPanel title={AUTH.login.panelTitle} text={AUTH.login.panelText} />
      <AuthMain>
        <LoginForm next={next} academyFirst={academyFirst} />
      </AuthMain>
    </>
  )
}
