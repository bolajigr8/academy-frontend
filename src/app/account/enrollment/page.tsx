import { redirect } from "next/navigation"

import { routes } from "@/routes"

/*
 * Stripe's return address (week 3 part 3, section 18): the backend sends the
 * family to /account/enrollment?id=…&paid=1&session_id=… (or &cancelled=1).
 * The page lives in the family area, so this address forwards there with the
 * same query; the backend's default needs no change.
 */
export default async function StripeReturn({
  searchParams,
}: PageProps<"/account/enrollment">) {
  const q = await searchParams
  const params = new URLSearchParams()
  for (const k of ["id", "paid", "session_id", "cancelled"]) {
    const v = q[k]
    if (typeof v === "string" && v) params.set(k, v)
  }
  redirect(`${routes.family.paymentReturn}?${params.toString()}`)
}
