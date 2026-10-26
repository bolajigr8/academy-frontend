import { LiveFamilyPayments } from "@/components/enrollments/live-family-payments"
import { isLive } from "@/lib/data-source"
import type { Metadata } from "next"

import { FAMILY } from "@/data/family-copy"

import { FamilyPaymentsClient } from "./client"

export const metadata: Metadata = { title: FAMILY.payments.title }

export default function Page() {
  // api mode: week 3 part 1 (GET /academy/me/payments and /me/enrollments)
  return isLive("payments") ? <LiveFamilyPayments /> : <FamilyPaymentsClient />
}
