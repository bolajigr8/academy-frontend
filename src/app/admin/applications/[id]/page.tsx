import type { Metadata } from "next"

import { AdminApplicationPageClient } from "./client"

export const metadata: Metadata = {
  title: "Application · Admin",
  robots: { index: false },
}

export default async function Page({
  params,
}: PageProps<"/admin/applications/[id]">) {
  const { id } = await params
  return <AdminApplicationPageClient id={id} />
}
