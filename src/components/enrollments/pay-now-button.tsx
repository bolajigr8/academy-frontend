"use client"

import { Icon } from "@/components/icons/icon"
import { notify } from "@/components/shared/notify"
import { Button } from "@/components/ui/button"
import { LIVE } from "@/data/live-copy"

/*
 * "Pay now": paying online arrives with week 3 part 3. Until the payment API
 * is connected the button tells the person so instead of doing nothing.
 */
export function PayNowButton({
  amount,
  size,
  variant,
}: {
  amount?: string
  size?: "sm" | "default"
  variant?: "primary" | "secondary"
}) {
  const t = LIVE.enrollment
  return (
    <Button
      size={size}
      variant={variant}
      onClick={() => notify(t.payNotReady, undefined, "info")}
    >
      <Icon name="wallet" size={size === "sm" ? 15 : 16} />{" "}
      {amount ? t.payNowAll(amount) : t.payNow}
    </Button>
  )
}
