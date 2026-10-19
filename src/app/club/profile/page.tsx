import type { Metadata } from "next"

import { ClubProfileClient } from "./client"

export const metadata: Metadata = { title: "Academy profile" }

export default function ClubProfilePage() {
  return <ClubProfileClient />
}
