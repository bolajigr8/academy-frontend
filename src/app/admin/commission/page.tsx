import type { Metadata } from "next"

import { AdminCommissionPageClient } from "./client"

export const metadata: Metadata = {
  title: "Commission · Admin",
  robots: { index: false },
}

export default function Page() {
  return <AdminCommissionPageClient />
}
