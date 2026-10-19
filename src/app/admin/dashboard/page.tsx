import { redirect } from "next/navigation"

import { routes } from "@/routes"

/* /admin/dashboard is a natural address to type or bookmark: it is the overview */
export default function AdminDashboardAlias() {
  redirect(routes.admin.overview)
}
