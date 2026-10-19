import type { Metadata } from "next"

import { ProgramClient } from "./client"
import { build } from "@/data/catalog"
import { PROGRAM } from "@/data/search-copy"
import { firstParam } from "@/features/auth/demo-login"
import { isLive } from "@/lib/data-source"

/* The title is the program and its academy (listing.html sets document.title the same way). */
export async function generateMetadata({
  params,
}: PageProps<"/academies/[slug]">): Promise<Metadata> {
  // api mode: the real title is set by the page once the listing loads
  if (isLive("listingPage")) return { description: PROGRAM.description }
  const { slug } = await params
  const catalog = build()
  const l = catalog.listings.find((x) => x.id === slug)
  const academy = l && catalog.academies.find((a) => a.id === l.academyId)
  return {
    title: l && academy ? `${l.title} · ${academy.name}` : PROGRAM.notFoundMeta,
    description: PROGRAM.description,
  }
}

/* listing.html?id=&intake= */
export default async function AcademyProgramPage({
  params,
  searchParams,
}: PageProps<"/academies/[slug]">) {
  const { slug } = await params
  const { intake } = await searchParams
  return (
    <ProgramClient key={slug} slug={slug} intake={firstParam(intake) ?? null} />
  )
}
