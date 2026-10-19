"use client"

import { AdminLoginClient } from "@/components/admin/admin-pages"

export function AdminLoginPageClient({ next }: { next: string | null }) {
  return <AdminLoginClient next={next} />
}
