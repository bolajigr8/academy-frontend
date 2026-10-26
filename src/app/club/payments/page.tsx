import { LivePortalEnrollments } from "@/components/enrollments/live-portal-enrollments"
import { isLive } from "@/lib/data-source"
import type { Metadata } from "next"

import { ClubPaymentsClient } from "./client"

export const metadata: Metadata = { title: "Payments · Academy" }

export default function ClubPaymentsPage() {
  // api mode: week 3 part 1 (GET /academy/portal/enrollments); payouts arrive in part 3
  return isLive("payments") ? <LivePortalEnrollments /> : <ClubPaymentsClient />
}
