import { redirect } from "next/navigation"

import { routes } from "@/routes"

/*
 * Stripe's return addresses for the payout account (week 3 part 4, section
 * 22): /host/payouts?return=1 when the owner leaves or finishes the form,
 * ?refresh=1 when the link expired or was used. Both open the academy's
 * Payments page, which checks the status or asks for a new link.
 */
export default async function StripePayoutReturn({
  searchParams,
}: PageProps<"/host/payouts">) {
  const q = await searchParams
  const back =
    q.refresh === "1" ? "refresh" : q.return === "1" ? "return" : null
  redirect(
    back ? `${routes.club.payments}?payout=${back}` : routes.club.payments
  )
}
