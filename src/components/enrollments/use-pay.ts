"use client"

import { useState } from "react"

import type { ApiEnrollmentPayment } from "@/features/enrollments/api"
import { startCheckout } from "@/features/payments/api"

/** Leaving for Stripe (a seam the tests can stand in for) */
export const browser = { go: (url: string) => window.location.assign(url) }

/** The lines a Pay button pays: every due or overdue line of one enrollment (section 18) */
export const payable = (rows: ApiEnrollmentPayment[]) =>
  rows.filter((r) => r.status === "due" || r.status === "overdue")

/*
 * Opens a Stripe Checkout for the lines and sends the browser to it. Stripe
 * brings the family back to /account/enrollment, which asks what happened.
 * A refusal (payment_in_progress, below_minimum_charge, enrollment_cancelled,
 * 502, 429…) is shown by the error toast with the backend's own message.
 */
export function usePay() {
  const [busy, setBusy] = useState(false)
  const pay = async (rows: ApiEnrollmentPayment[]) => {
    const ids = rows.map((r) => r.id).slice(0, 20)
    if (!ids.length || busy) return
    setBusy(true)
    try {
      const { checkout_url } = await startCheckout(ids)
      browser.go(checkout_url)
      // the browser is leaving: keep the button busy
    } catch {
      setBusy(false)
    }
  }
  return { pay, busy }
}
