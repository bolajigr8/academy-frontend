import type { Metadata } from "next"

import { ClubPaymentsClient } from "./client"

export const metadata: Metadata = { title: "Payments · Academy" }

export default function ClubPaymentsPage() {
  return <ClubPaymentsClient />
}
