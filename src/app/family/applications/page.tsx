import type { Metadata } from "next"

import { FAMILY } from "@/data/family-copy"
import { firstParam } from "@/features/auth/demo-login"

import { FamilyApplicationsClient } from "./client"

export const metadata: Metadata = { title: FAMILY.applications.title }

/* account/applications.html?tab=&player= */
export default async function FamilyApplicationsPage({
  searchParams,
}: PageProps<"/family/applications">) {
  const q = await searchParams
  return (
    <FamilyApplicationsClient
      tab={firstParam(q.tab) ?? "all"}
      player={firstParam(q.player) ?? "all"}
    />
  )
}
