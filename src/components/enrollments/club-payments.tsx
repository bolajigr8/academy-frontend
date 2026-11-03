"use client"

import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { PageHeading } from "@/components/layout/page-heading"
import { LIVE } from "@/data/live-copy"
import { listAllListings } from "@/features/club/api"
import { clubKeys } from "@/features/club/query-keys"
import {
  getPayoutAccount,
  listPortalPayments,
  paymentKeys,
  payoutKeys,
} from "@/features/payments/api"
import { cn } from "@/lib/utils"

import { LivePortalEnrollments } from "./live-portal-enrollments"
import { PaymentsLedger } from "./payments-ledger"
import { PayoutAccountCard } from "./payout-account"

const M = LIVE.money

/*
 * The academy's Payments page: the money (week 3 part 3, section 19: every
 * line with Golafly's commission and the academy's payout) and the
 * enrollments behind it (part 1, section 6).
 */
export function ClubPayments() {
  const [view, setView] = useState<"payments" | "enrollments">("payments")
  // set when Stripe sent the owner back from its form (/host/payouts)
  const p = useSearchParams().get("payout")
  const back = p === "return" || p === "refresh" ? p : null
  // the same first page the list below loads (shared cache): what is waiting
  const firstPage = useQuery({
    queryKey: paymentKeys.portal({ page: 1 }),
    queryFn: () => listPortalPayments({ page: 1 }),
  })
  const waiting = firstPage.data?.meta?.totals?.EUR?.payout_pending ?? null
  const account = useQuery({
    queryKey: payoutKeys.account(),
    queryFn: getPayoutAccount,
  })
  const listings = useQuery({
    queryKey: clubKeys.listings(),
    queryFn: listAllListings,
  })
  return (
    <>
      <PageHeading title={LIVE.enrollment.listTitle} subtitle={M.academySub} />
      <PayoutAccountCard back={back} waiting={waiting} />
      <div
        role="tablist"
        aria-label={LIVE.enrollment.listTitle}
        className="flex flex-wrap gap-2"
      >
        {(["payments", "enrollments"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn(
              "min-h-10 rounded-pill border border-border-2 bg-transparent px-4 text-fs-14 font-semibold text-fg-2 hover:text-fg-1",
              view === v && "border-fg-1 bg-fg-1 text-bg-0 hover:text-bg-0"
            )}
          >
            {M.views[v]}
          </button>
        ))}
      </div>
      {view === "payments" ? (
        <PaymentsLedger
          side="academy"
          accountReady={account.data?.status === "ready"}
          listings={(listings.data ?? []).map((l) => ({
            id: l.id,
            title: l.title,
          }))}
        />
      ) : (
        <LivePortalEnrollments embedded />
      )}
    </>
  )
}
