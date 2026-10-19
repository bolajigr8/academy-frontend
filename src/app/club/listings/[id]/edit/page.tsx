import type { Metadata } from "next"

import { notFound } from "next/navigation"

import { EDITOR } from "@/data/editor-copy"
import { isLive } from "@/lib/data-source"

import { EditListingClient } from "./client"

export const metadata: Metadata = { title: EDITOR.title }

/* host/listing-edit.html?id= */
export default async function EditListingPage({
  params,
}: PageProps<"/club/listings/[id]/edit">) {
  const { id } = await params
  // api mode: listing ids are numbers (contract section 1)
  if (isLive("listingEditor") && !/^\d+$/.test(id)) notFound()
  return <EditListingClient key={id} id={id} />
}
