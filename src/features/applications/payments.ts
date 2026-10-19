import type { View } from "@/stores/app-store"

import type { Application, PlanItem } from "./types"

/** One payment item with the application it belongs to (flatPayments in js/amk-shell.jsx) */
export type PaymentRow = PlanItem & {
  appId: string
  program: string
  academy: string
  who: string
}

type Lookup = Pick<View, "listingsById" | "playerById">

/** All payment items across applications: unpaid first, then by due date. */
export function flatPayments(apps: Application[], view: Lookup): PaymentRow[] {
  const out: PaymentRow[] = []
  apps.forEach((a) => {
    if (!a.payment) return
    const l = view.listingsById[a.listingId]
    const who = a.applicant
      ? a.applicant.name
      : (view.playerById[a.playerId ?? ""]?.firstName ?? "")
    a.payment.items.forEach((it) =>
      out.push({
        ...it,
        appId: a.id,
        program: l.title,
        academy: l.academy.name,
        who,
      })
    )
  })
  return out.sort((x, y) =>
    x.status === y.status
      ? x.due < y.due
        ? -1
        : 1
      : x.status === "paid"
        ? 1
        : -1
  )
}
