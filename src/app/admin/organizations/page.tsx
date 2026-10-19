import type { Metadata } from "next"

import { AdminOrganizationsPageClient } from "./client"

export const metadata: Metadata = {
  title: "Organizations · Admin",
  robots: { index: false },
}

export default function Page() {
  return <AdminOrganizationsPageClient />
}
