import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isLive } from "@/lib/data-source"

import { ClubReviewsClient } from "./client"

export const metadata: Metadata = { title: "Reviews · Academy" }

export default function ClubReviewsPage() {
  // no prototype design: api mode only (week 3 part 2, section 10)
  if (!isLive("reviews")) notFound()
  return <ClubReviewsClient />
}
