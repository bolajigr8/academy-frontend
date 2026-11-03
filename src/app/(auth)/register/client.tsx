"use client"

import { RegisterForm } from "@/components/auth/register-form"

/* Create an account (register.html?role=) */
export function RegisterClient({
  initialRole,
  next,
}: {
  initialRole: "academy" | undefined
  /** where the person was going (an apply link): a family goes back there */
  next: string | null
}) {
  return <RegisterForm initialRole={initialRole} next={next} />
}
