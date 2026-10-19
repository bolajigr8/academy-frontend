import type { Metadata } from "next"

import { APPLY } from "@/data/apply-copy"
import { firstParam } from "@/features/auth/demo-login"

import { ApplyClient } from "./client"

export const metadata: Metadata = {
  title: APPLY.title,
  description: APPLY.description,
}

/* apply.html?listing=&intake= (a draft is resumed with &app=) */
export default async function ApplyPage({
  params,
  searchParams,
}: PageProps<"/academies/[slug]/apply">) {
  const { slug } = await params
  const query = await searchParams
  return (
    <ApplyClient
      key={slug}
      slug={slug}
      intake={firstParam(query.intake) ?? null}
      app={firstParam(query.app) ?? null}
      player={firstParam(query.player) ?? null}
    />
  )
}
