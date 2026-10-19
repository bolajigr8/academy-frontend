import type { Metadata } from "next"

import { AUTH } from "@/data/auth-copy"
import { firstParam } from "@/features/auth/demo-login"

import { RegisterClient } from "./client"

export const metadata: Metadata = {
  title: AUTH.register.title,
  description: AUTH.register.description,
}

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  const query = await searchParams
  return (
    <RegisterClient
      initialRole={firstParam(query.role) === "academy" ? "academy" : undefined}
    />
  )
}
