import type { Metadata } from "next"

import { EDITOR } from "@/data/editor-copy"

import { NewListingClient } from "./client"

export const metadata: Metadata = { title: EDITOR.title }

export default function NewListingPage() {
  return <NewListingClient />
}
