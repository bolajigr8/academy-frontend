import type { Metadata } from "next"

import { AdminPaymentsPageClient } from "./client"

export const metadata: Metadata = {
  title: "Payments · Admin",
  robots: { index: false },
}

export default function Page() {
  return <AdminPaymentsPageClient />
}
