import type { Metadata } from "next"

import { AdminOrganizationPageClient } from "./client"

export const metadata: Metadata = {
  title: "Organization · Admin",
  robots: { index: false },
}

export default async function Page({
  params,
}: PageProps<"/admin/organizations/[id]">) {
  const { id } = await params
  return <AdminOrganizationPageClient id={id} />
}
