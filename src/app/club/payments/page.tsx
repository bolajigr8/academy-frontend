import { ClubPayments } from "@/components/enrollments/club-payments"
import { isLive } from "@/lib/data-source"
import type { Metadata } from "next"

import { ClubPaymentsClient } from "./client"

export const metadata: Metadata = { title: "Payments · Academy" }

export default function ClubPaymentsPage() {
  // api mode: the money (week 3 part 3) and the enrollments (part 1)
  return isLive("payments") ? <ClubPayments /> : <ClubPaymentsClient />
}
