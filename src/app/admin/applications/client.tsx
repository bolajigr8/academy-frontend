"use client"

import { AdminApplicationsClient } from "@/components/admin/admin-pages"

export function AdminApplicationsPageClient({ status }: { status: string }) {
  return <AdminApplicationsClient status={status} />
}
