import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LIVE } from "@/data/live-copy"
import { isLive } from "@/lib/data-source"

import { EditProfileClient } from "./client"

export const metadata: Metadata = { title: LIVE.profileForm.pageTitle }

/* Organization + academy forms. api mode only: the prototype has no such page. */
export default function EditProfilePage() {
  if (!isLive("clubPortal")) notFound()
  return <EditProfileClient />
}
