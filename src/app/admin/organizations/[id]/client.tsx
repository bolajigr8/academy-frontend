"use client"

import { AdminOrganizationClient } from "@/components/admin/admin-pages"

export function AdminOrganizationPageClient({ id }: { id: string }) {
  return <AdminOrganizationClient id={id} />
}
