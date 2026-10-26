import { LiveDashboardClient } from "@/components/club/live-dashboard"
import { isLive } from "@/lib/data-source"
import type { Metadata } from "next"

import { ClubDashboardClient } from "./client"

export const metadata: Metadata = { title: "Academy dashboard" }

export default function ClubDashboardPage() {
  // api mode: GET /academy/portal/dashboard (week 3 part 2, section 13)
  return isLive("dashboards") ? (
    <LiveDashboardClient />
  ) : (
    <ClubDashboardClient />
  )
}
