import type { Metadata } from "next"

import { AdminVerificationPageClient } from "./client"

export const metadata: Metadata = {
  title: "Verification · Admin",
  robots: { index: false },
}

export default async function Page({
  params,
}: PageProps<"/admin/verifications/[id]">) {
  const { id } = await params
  return <AdminVerificationPageClient id={id} />
}
