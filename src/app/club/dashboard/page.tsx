import type { Metadata } from "next"

import { ClubDashboardClient } from "./client"

export const metadata: Metadata = { title: "Academy dashboard" }

export default function ClubDashboardPage() {
  return <ClubDashboardClient />
}
