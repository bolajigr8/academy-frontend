import type { Metadata } from "next"

import { AdminUsersPageClient } from "./client"

export const metadata: Metadata = {
  title: "Users · Admin",
  robots: { index: false },
}

export default function Page() {
  return <AdminUsersPageClient />
}
