"use client"

import { CheckoutReturn } from "@/components/enrollments/checkout-return"

export function CheckoutReturnClient(props: {
  enrollmentId: number | null
  sessionId: string | null
  left: boolean
}) {
  return <CheckoutReturn {...props} />
}
