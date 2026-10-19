import type { Metadata } from "next"

import { ClubListingsClient } from "./client"

export const metadata: Metadata = { title: "Listings · Academy" }

export default function ClubListingsPage() {
  return <ClubListingsClient />
}
