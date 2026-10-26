import type { Metadata } from "next"

import { AdminReviewsPageClient } from "./client"

export const metadata: Metadata = {
  title: "Reviews · Admin",
  robots: { index: false },
}

export default function Page() {
  return <AdminReviewsPageClient />
}
