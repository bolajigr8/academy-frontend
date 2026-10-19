import { AdminShell } from "@/components/admin/admin-shell"

/* Golafly admin: its own shell (no site nav, no portal shell); api mode only */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>
}
