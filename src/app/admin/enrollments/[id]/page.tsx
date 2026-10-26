import type { Metadata } from "next"

import { AdminEnrollmentPageClient } from "./client"

export const metadata: Metadata = {
  title: "Enrollment · Admin",
  robots: { index: false },
}

export default async function Page({
  params,
}: PageProps<"/admin/enrollments/[id]">) {
  const { id } = await params
  return <AdminEnrollmentPageClient id={id} />
}
