import type { Metadata } from "next"

import { AdminLoginPageClient } from "./client"

export const metadata: Metadata = {
  title: "Admin sign in · Admin",
  robots: { index: false },
}

export default async function Page({
  searchParams,
}: PageProps<"/admin/login">) {
  const q = await searchParams
  const next = Array.isArray(q.next) ? q.next[0] : q.next
  return <AdminLoginPageClient next={next ?? null} />
}
