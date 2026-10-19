import type { Metadata } from "next"

import { AdminListingsPageClient } from "./client"

export const metadata: Metadata = {
  title: "Listing moderation · Admin",
  robots: { index: false },
}

export default function Page() {
  return <AdminListingsPageClient />
}
