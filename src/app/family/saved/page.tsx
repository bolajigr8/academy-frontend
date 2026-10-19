import type { Metadata } from "next"

import { LiveSavedClient } from "@/components/family/live-saved"
import { FAMILY } from "@/data/family-copy"
import { isLive } from "@/lib/data-source"

import { FamilySavedClient } from "./client"

export const metadata: Metadata = { title: FAMILY.saved.title }

export default function Page() {
  // api mode: GET /academy/me/saved (week 1 part 2, section 16)
  return isLive("discovery") ? <LiveSavedClient /> : <FamilySavedClient />
}
