import type { Metadata } from "next"

import { AdminOverviewPageClient } from "./client"

export const metadata: Metadata = {
  title: "Admin overview · Admin",
  robots: { index: false },
}

export default function Page() {
  return <AdminOverviewPageClient />
}
