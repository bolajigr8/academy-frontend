import type { Metadata } from "next"

import { AUTH } from "@/data/auth-copy"
import { firstParam } from "@/features/auth/demo-login"

import { LoginClient } from "./client"

export const metadata: Metadata = {
  title: AUTH.login.title,
  description: AUTH.login.description,
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const query = await searchParams
  return (
    <LoginClient
      next={firstParam(query.next)}
      academyFirst={firstParam(query.role) === "academy"}
    />
  )
}
