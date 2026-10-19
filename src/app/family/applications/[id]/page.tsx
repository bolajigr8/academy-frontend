import type { Metadata } from "next"

import { FAMILY } from "@/data/family-copy"

import { FamilyApplicationClient } from "./client"

export const metadata: Metadata = { title: FAMILY.detail.title }

/* account/application.html?id= */
export default async function FamilyApplicationPage({
  params,
}: PageProps<"/family/applications/[id]">) {
  const { id } = await params
  return <FamilyApplicationClient key={id} id={id} />
}
