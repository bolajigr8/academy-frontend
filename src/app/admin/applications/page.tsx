import type { Metadata } from "next"

import { AdminApplicationsPageClient } from "./client"

export const metadata: Metadata = {
  title: "Applications · Admin",
  robots: { index: false },
}

export default async function Page({
  searchParams,
}: PageProps<"/admin/applications">) {
  const q = await searchParams
  const status = Array.isArray(q.status) ? q.status[0] : q.status
  return <AdminApplicationsPageClient status={status ?? ""} />
}
