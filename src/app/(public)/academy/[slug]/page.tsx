import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LiveAcademyProfile } from "@/components/program/live-academy-profile"
import { isLive } from "@/lib/data-source"

export const metadata: Metadata = {}

/*
 * An academy's public profile (week 1 part 2, section 15): api mode only.
 * The prototype has no such page, so demo mode has no route here.
 */
export default async function AcademyProfilePage({
  params,
}: PageProps<"/academy/[slug]">) {
  if (!isLive("discovery")) notFound()
  const { slug } = await params
  return <LiveAcademyProfile key={slug} slug={slug} />
}
