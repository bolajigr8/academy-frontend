import type { Metadata } from "next"

import { AdminVerificationsPageClient } from "./client"

export const metadata: Metadata = {
  title: "Verifications · Admin",
  robots: { index: false },
}

export default function Page() {
  return <AdminVerificationsPageClient />
}
