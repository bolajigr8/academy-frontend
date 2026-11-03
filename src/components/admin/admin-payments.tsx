"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { PaymentsLedger } from "@/components/enrollments/payments-ledger"
import { Icon } from "@/components/icons/icon"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  numberColumn,
} from "@/components/ui/table"
import { ADMIN } from "@/data/admin-copy"
import { LIVE } from "@/data/live-copy"
import { listVerifications } from "@/features/admin/api"
import { adminKeys } from "@/features/admin/query-keys"
import {
  listTransactions,
  paymentKeys,
  type ApiTransaction,
} from "@/features/payments/api"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

import { AdminHeader, date } from "./admin-pages"

const M = LIVE.money
const PER_PAGE = 20
const TX_TONE: Record<string, "success" | "warning" | "info" | "ghost"> = {
  applied: "success",
  refund_due: "warning",
  pending: "info",
}

/*
 * Golafly's payments (week 3 part 3, section 20): every payment line with the
 * money split (GET /academy/admin/payments), and every card payment Stripe
 * was asked to take (GET /transactions), where a payment taken but not
 * applied shows as refund due.
 */
export function AdminPaymentsClient() {
  // ?view=refunds (from the overview) opens the card payments' Refund due list
  const refunds = useSearchParams().get("view") === "refunds"
  const [view, setView] = useState<"lines" | "cards">(
    refunds ? "cards" : "lines"
  )
  const academies = useQuery({
    queryKey: adminKeys.verifications({ per_page: 50 }),
    queryFn: () => listVerifications({ per_page: 50 }),
  })
  return (
    <>
      <AdminHeader title={ADMIN.nav.payments} subtitle={M.howPayout} />
      <div role="tablist" className="flex flex-wrap gap-2">
        {(["lines", "cards"] as const).map((v) => (
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
            {v === "lines" ? M.views.payments : M.transactionsTitle}
          </button>
        ))}
      </div>
      {view === "lines" ? (
        <PaymentsLedger
          side="admin"
          academies={(academies.data?.data ?? []).map((a) => ({
            id: a.academy_id,
            name: a.academy_name,
          }))}
        />
      ) : (
        <Transactions initial={refunds ? "refund_due" : "all"} />
      )}
    </>
  )
}

/** The card payments; ?view=refunds opens the refund-due list */
export function Transactions({
  initial = "all",
}: {
  initial?: "all" | "refund_due" | "applied" | "pending"
}) {
  const [filter, setFilter] = useState(initial)
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const params = {
    page,
    per_page: PER_PAGE,
    ...(filter !== "all" ? { fulfilment_status: filter } : {}),
    ...(q.trim() ? { q: q.trim() } : {}),
  }
  const tx = useQuery({
    queryKey: paymentKeys.transactions(params),
    queryFn: () => listTransactions(params),
    placeholderData: keepPreviousData,
  })
  const rows = tx.data?.data ?? []
  const money = (r: ApiTransaction) => {
    const currency = r.paid_for?.academy?.price_currency ?? "EUR"
    const minor = Math.round(Number(r.amount) * 100)
    return Number.isFinite(minor)
      ? formatMoney({ amount_minor: minor, amount: r.amount, currency })
      : r.amount
  }
  return (
    <div className="grid min-w-0 gap-4">
      <p className="text-fs-14 text-fg-3">{M.transactionsSub}</p>
      <div role="tablist" className="flex flex-wrap gap-2">
        {(Object.keys(M.txViews) as (keyof typeof M.txViews)[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={filter === k}
            onClick={() => {
              setFilter(k as typeof filter)
              setPage(1)
            }}
            className={cn(
              "min-h-9 rounded-pill border border-border-2 bg-transparent px-3.5 text-fs-13 font-semibold text-fg-2",
              filter === k && "border-fg-1 bg-fg-1 text-bg-0",
              k === "refund_due" &&
                filter !== k &&
                "border-gf-warning text-fg-1"
            )}
          >
            {M.txViews[k]}
          </button>
        ))}
      </div>
      <label className="grid max-w-md gap-1 text-fs-13 font-semibold text-fg-2">
        {M.txSearch}
        <Input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
        />
      </label>
      {tx.isError && !tx.data ? (
        <ErrorState
          message={LIVE.requestFailed}
          onRetry={() => void tx.refetch()}
        />
      ) : !tx.data ? (
        <div
          aria-hidden="true"
          className="h-48 animate-pulse rounded-lg bg-bg-2"
        />
      ) : rows.length === 0 ? (
        <EmptyState icon="wallet" title={M.txNone} text={M.transactionsSub} />
      ) : (
        <Table className="am-stack-sm">
          <TableHeader>
            <TableRow>
              <TableHead>{M.family}</TableHead>
              <TableHead className={numberColumn}>{M.amount}</TableHead>
              <TableHead>{M.card}</TableHead>
              <TableHead>{M.date}</TableHead>
              <TableHead>
                <span className="am-sr">{ADMIN.common.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const enrollmentId = r.metadata?.academy_enrollment_id
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <b>{r.email}</b>
                    <small>{r.paid_for?.academy?.name ?? ""}</small>
                    {r.stripe_checkout_session_id ? (
                      <small className="font-mono [overflow-wrap:anywhere]">
                        {M.txSession}: {r.stripe_checkout_session_id}
                      </small>
                    ) : null}
                  </TableCell>
                  <TableCell className={numberColumn}>
                    {money(r)}
                    {/* part 5: the fee inside the amount, and its rate */}
                    {r.service_fee_minor ? (
                      <small>
                        {M.txFee(
                          formatMoney({
                            amount_minor: r.service_fee_minor,
                            amount: (r.service_fee_minor / 100).toFixed(2),
                            currency:
                              r.paid_for?.academy?.price_currency ?? "EUR",
                          }),
                          r.service_fee_rate ?? 0
                        )}
                      </small>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-1.5">
                      <StatusPill
                        tone={r.payment_status === "paid" ? "success" : "ghost"}
                      >
                        {M.txPayment[r.payment_status] ?? r.payment_status}
                      </StatusPill>
                      <StatusPill
                        tone={TX_TONE[r.fulfilment_status] ?? "ghost"}
                      >
                        {M.txFulfilment[r.fulfilment_status] ??
                          r.fulfilment_status}
                      </StatusPill>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {date(r.paid_at ?? r.created_at)}
                  </TableCell>
                  <TableCell>
                    {enrollmentId ? (
                      <Link
                        href={routes.admin.enrollment(enrollmentId)}
                        className="am-link text-fs-13 font-semibold whitespace-nowrap"
                      >
                        {ADMIN.nav.enrollments}
                      </Link>
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
      {/* this older endpoint has no meta block: a full page means there may be more */}
      {page > 1 || rows.length === PER_PAGE ? (
        <nav className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <Icon name="arrowl" size={16} /> {LIVE.search.previous}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={rows.length < PER_PAGE}
            onClick={() => setPage((p) => p + 1)}
          >
            {LIVE.search.next} <Icon name="arrow" size={16} />
          </Button>
        </nav>
      ) : null}
    </div>
  )
}
