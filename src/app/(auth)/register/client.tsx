"use client"

import { RegisterForm } from "@/components/auth/register-form"

/* Create an account (register.html?role=) */
export function RegisterClient({
  initialRole,
}: {
  initialRole: "academy" | undefined
}) {
  return <RegisterForm initialRole={initialRole} />
}
