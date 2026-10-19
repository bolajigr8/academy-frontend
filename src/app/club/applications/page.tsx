import type { Metadata } from "next"

import { ClubApplicationsClient } from "./client"

export const metadata: Metadata = { title: "Applications · Academy" }

export default function ClubApplicationsPage() {
  return <ClubApplicationsClient />
}
