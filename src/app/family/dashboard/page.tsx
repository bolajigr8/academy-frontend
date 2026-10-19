import type { Metadata } from "next"

import { FAMILY } from "@/data/family-copy"

import { FamilyDashboardClient } from "./client"

export const metadata: Metadata = { title: FAMILY.dashboard.title }

export default function FamilyDashboardPage() {
  return <FamilyDashboardClient />
}
