import type { Metadata } from "next"

import { FAMILY } from "@/data/family-copy"

import { FamilyPaymentsClient } from "./client"

export const metadata: Metadata = { title: FAMILY.payments.title }

export default function Page() {
  return <FamilyPaymentsClient />
}
