import type { Metadata } from "next"

import { CheckoutReturnClient } from "./client"

export const metadata: Metadata = { title: "Your payment" }

export default async function Page({
  searchParams,
}: PageProps<"/family/payments/return">) {
  const q = await searchParams
  const one = (v: unknown) => (typeof v === "string" ? v : null)
  const id = Number(one(q.id))
  return (
    <CheckoutReturnClient
      enrollmentId={Number.isInteger(id) && id > 0 ? id : null}
      sessionId={one(q.session_id)}
      left={one(q.cancelled) === "1"}
    />
  )
}
