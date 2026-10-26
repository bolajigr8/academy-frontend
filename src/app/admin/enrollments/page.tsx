import type { Metadata } from "next"

import { AdminEnrollmentsPageClient } from "./client"

export const metadata: Metadata = {
  title: "Enrollments · Admin",
  robots: { index: false },
}

export default function Page() {
  return <AdminEnrollmentsPageClient />
}
