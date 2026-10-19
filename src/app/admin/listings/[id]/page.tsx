import type { Metadata } from "next"

import { AdminListingPageClient } from "./client"

export const metadata: Metadata = {
  title: "Listing · Admin",
  robots: { index: false },
}

export default async function Page({
  params,
}: PageProps<"/admin/listings/[id]">) {
  const { id } = await params
  return <AdminListingPageClient id={id} />
}
