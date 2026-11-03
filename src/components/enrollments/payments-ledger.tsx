"use client"

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useState } from "react"

import { Icon } from "@/components/icons/icon"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { FormField } from "@/components/shared/form-field"
import { KpiCard } from "@/components/shared/kpi-card"
import { Modal } from "@/components/shared/modal"
import { NativeSelect } from "@/components/shared/native-select"
import { notify } from "@/components/shared/notify"
import { StatusPill } from "@/components/shared/status-pill"
import { Button, buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  numberColumn,
} from "@/components/ui/table"
import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import type { PaymentStatus } from "@/features/enrollments/api"
import { PAYMENT_TONE, withLabels } from "@/features/enrollments/logic"
import {
  decidePayout,
  listAdminPayments,
  listPortalPayments,
  paymentKeys,
  type ApiAdminPayment,
  type ApiPortalPayment,
  type PayoutStatus,
} from "@/features/payments/api"
import { getApiFieldErrors, getCurrentStatus } from "@/lib/api/errors"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

const M = LIVE.money
const D = LIVE.payoutDecision
const E = LIVE.enrollment
const STATUSES: PaymentStatus[] = [
  "paid",
  "due",
  "overdue",
  "scheduled",
  "cancelled",
]
const PAYOUTS: PayoutStatus[] = [
  "pending",
  "held",
  "processing",
  "paid_out",
  "failed",
  "cancelled",
  "reversed",
]
const PAYOUT_TONE: Record<string, "success" | "warning" | "info" | "ghost"> = {
  paid_out: "success",
  pending: "info",
  processing: "info",
  held: "warning",
  failed: "warning",
  reversed: "warning",
  cancelled: "ghost",
}
const day = (iso: string) => DATES.fmt(iso.slice(0, 10))
/** the admin's extra fields, when the row has them */
const adminOf = (r: ApiPortalPayment): ApiAdminPayment | null =>
  "family_email" in r ? (r as unknown as ApiAdminPayment) : null
const humanize = (s: string) =>
  s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())

/*
 * Payment lines with the money split (week 3 part 3): the academy's own
 * (GET /academy/portal/payments, section 19) or every academy's for Golafly
 * (GET /academy/admin/payments, section 20). Totals are per currency over the
 * whole filtered result, never added across currencies. A paid line of a
 * cancelled enrollment shows that next to its payout, as the contract asks.
 */
export function PaymentsLedger({
  side,
  listings,
  academies,
  accountReady = false,
}: {
  side: "academy" | "admin"
  /** the academy's payout account is ready: a pending payout "will be sent soon" */
  accountReady?: boolean
  listings?: { id: number; title: string }[]
  academies?: { id: number; name: string }[]
}) {
  // the academy reads the contract's sentences; Golafly the short names
  const payoutLabel = (s: string) =>
    side === "academy"
      ? s === "pending" && accountReady
        ? M.pendingReady
        : (M.payoutStatus[s] ?? humanize(s))
      : (M.payoutStatusAdmin[s] ?? humanize(s))
  const [decide, setDecide] = useState<{
    id: number
    action: "release" | "cancel"
  } | null>(null)
  const [status, setStatus] = useState("")
  const [listingId, setListingId] = useState("")
  const [academyId, setAcademyId] = useState("")
  const [payout, setPayout] = useState("")
  const [page, setPage] = useState(1)
  const params = {
    page,
    ...(status ? { status: status as PaymentStatus } : {}),
    ...(side === "academy" && listingId
      ? { listing_id: Number(listingId) }
      : {}),
    ...(side === "admin" && academyId ? { academy_id: Number(academyId) } : {}),
    ...(side === "admin" && payout
      ? { payout_status: payout as PayoutStatus }
      : {}),
  }
  const q = useQuery({
    queryKey:
      side === "admin" ? paymentKeys.admin(params) : paymentKeys.portal(params),
    queryFn: () =>
      side === "admin" ? listAdminPayments(params) : listPortalPayments(params),
    placeholderData: keepPreviousData,
  })
  const rows = withLabels(q.data?.data ?? [])
  const totals = Object.entries(q.data?.meta?.totals ?? {})
  const zero = { amount_minor: 0, amount: "0.00", currency: "EUR" }
  // euros only on the academy's dashboard (other currencies come with the listing currency doc)
  const eur = q.data
    ? (q.data.meta?.totals?.EUR ?? {
        paid_gross: zero,
        commission: zero,
        academy_net: zero,
        paid_count: 0,
        outstanding_gross: zero,
        paid_out: zero,
        payout_pending: zero,
      })
    : null
  const last = q.data?.meta?.last_page ?? 1
  const reset = (f: () => void) => {
    f()
    setPage(1)
  }

  const payoutCell = (r: ApiPortalPayment) => (
    <span className="grid min-w-0 justify-items-start gap-1 [&>*]:max-w-full [&>*]:whitespace-normal">
      {r.academy_net ? (
        <b className="tabular-nums">{formatMoney(r.academy_net)}</b>
      ) : (
        "—"
      )}
      {r.payout ? (
        <StatusPill tone={PAYOUT_TONE[r.payout.status] ?? "ghost"}>
          {payoutLabel(r.payout.status)}
        </StatusPill>
      ) : null}
      {r.payout?.paid_at ? (
        <small>{M.sentOn(day(r.payout.paid_at))}</small>
      ) : null}
      {/* waiting because the academy has no ready account: the next step, here */}
      {side === "academy" && !accountReady && r.payout?.status === "pending" ? (
        <a
          href="#payout-account"
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "mt-1"
          )}
        >
          {LIVE.payoutAccount.connectShort}
        </a>
      ) : null}
      {r.enrollment.status === "cancelled" ? (
        <small className="font-semibold text-gf-warning">
          {M.enrollmentCancelled}
        </small>
      ) : null}
      {/* Golafly only: where the money went, why it is held or failed, who decided */}
      {adminOf(r) ? (
        <>
          {adminOf(r)?.payout_failure ? (
            <small className="text-gf-warning">
              {adminOf(r)?.payout_failure}
            </small>
          ) : null}
          {adminOf(r)?.stripe_transfer_id ? (
            <small className="font-mono [overflow-wrap:anywhere]">
              {D.transfer(String(adminOf(r)?.stripe_transfer_id))}
            </small>
          ) : null}
          {adminOf(r)?.payout_attempts ? (
            <small>{D.attempts(Number(adminOf(r)?.payout_attempts))}</small>
          ) : null}
          {adminOf(r)?.payout_note ? (
            <small>
              {adminOf(r)?.payout_note}
              {adminOf(r)?.payout_decided_by
                ? ` · ${D.decidedBy(String(adminOf(r)?.payout_decided_by))}`
                : ""}
            </small>
          ) : null}
          {r.payout?.status === "held" ? (
            <span className="flex flex-wrap gap-1.5 pt-1">
              <Button
                size="sm"
                onClick={() => setDecide({ id: r.id, action: "release" })}
              >
                {D.release}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDecide({ id: r.id, action: "cancel" })}
              >
                {D.cancel}
              </Button>
            </span>
          ) : null}
        </>
      ) : null}
    </span>
  )
  const lineCell = (r: (typeof rows)[number]) => (
    <>
      <b>{r.name}</b>
      <small>
        {r.player_name} · {r.listing_title}
        {r.application_reference ? ` · ${r.application_reference}` : ""}
      </small>
      {side === "admin" ? (
        <small>
          {adminOf(r)?.academy.name} · {adminOf(r)?.family_email}
        </small>
      ) : null}
    </>
  )

  return (
    <div className="grid min-w-0 gap-4">
      {side === "academy" ? (
        // the academy: three numbers, in euros (dashboards are in euros)
        eur ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
            <KpiCard
              label={M.paidGross}
              value={formatMoney(eur.paid_gross)}
              sub={M.paidCount(eur.paid_count)}
            />
            <KpiCard
              label={M.academyNet}
              value={formatMoney(eur.academy_net)}
              sub={M.payoutSplit(
                formatMoney(eur.paid_out),
                formatMoney(eur.payout_pending)
              )}
              tone="ink"
            />
            <KpiCard
              label={M.outstanding}
              value={formatMoney(eur.outstanding_gross)}
            />
          </div>
        ) : null
      ) : totals.length === 0 && q.data ? null : (
        <div className="grid gap-3">
          {totals.map(([currency, t]) => (
            <section
              key={currency}
              aria-label={M.totalsFor(currency)}
              className="grid gap-2"
            >
              {totals.length > 1 ? (
                <h3 className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
                  {M.totalsFor(currency)}
                </h3>
              ) : null}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-3">
                <KpiCard
                  label={M.paidGross}
                  value={formatMoney(t.paid_gross)}
                  sub={M.paidCount(t.paid_count)}
                />
                <KpiCard
                  label={M.commission}
                  value={formatMoney(t.commission)}
                />
                <KpiCard
                  label={side === "admin" ? M.academyNetAdmin : M.academyNet}
                  value={formatMoney(t.academy_net)}
                  tone="ink"
                />
                <KpiCard label={M.paidOut} value={formatMoney(t.paid_out)} />
                <KpiCard
                  label={M.payoutPending}
                  value={formatMoney(t.payout_pending)}
                />
                <KpiCard
                  label={M.outstanding}
                  value={formatMoney(t.outstanding_gross)}
                />
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
        <label className="grid gap-1 text-fs-13 font-semibold text-fg-2">
          {M.filters.status}
          <NativeSelect
            value={status}
            onChange={(e) => reset(() => setStatus(e.target.value))}
          >
            <option value="">{M.allStatuses}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {E.paymentStatus[s] ?? s}
              </option>
            ))}
          </NativeSelect>
        </label>
        {side === "academy" && listings ? (
          <label className="grid gap-1 text-fs-13 font-semibold text-fg-2">
            {M.filters.listing}
            <NativeSelect
              value={listingId}
              onChange={(e) => reset(() => setListingId(e.target.value))}
            >
              <option value="">{M.allListings}</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </NativeSelect>
          </label>
        ) : null}
        {side === "admin" ? (
          <>
            <label className="grid gap-1 text-fs-13 font-semibold text-fg-2">
              {M.filters.academy}
              <NativeSelect
                value={academyId}
                onChange={(e) => reset(() => setAcademyId(e.target.value))}
              >
                <option value="">{M.allAcademies}</option>
                {(academies ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="grid gap-1 text-fs-13 font-semibold text-fg-2">
              {M.filters.payout}
              <NativeSelect
                value={payout}
                onChange={(e) => reset(() => setPayout(e.target.value))}
              >
                <option value="">{M.allPayouts}</option>
                {PAYOUTS.map((s) => (
                  <option key={s} value={s}>
                    {payoutLabel(s)}
                  </option>
                ))}
              </NativeSelect>
            </label>
          </>
        ) : null}
      </div>

      {q.isError && !q.data ? (
        <ErrorState
          message={LIVE.requestFailed}
          onRetry={() => void q.refetch()}
        />
      ) : !q.data ? (
        <div
          aria-hidden="true"
          className="h-48 animate-pulse rounded-lg bg-bg-2"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="wallet"
          title={M.none}
          text={side === "admin" ? M.howPayout : M.academyEmpty}
        />
      ) : (
        <>
          {/* phones: one card per line */}
          <ul className="hidden min-w-0 grid-cols-[minmax(0,1fr)] gap-3 le-720:grid">
            {rows.map((r) => (
              <li
                key={r.id}
                className="grid min-w-0 gap-2 rounded-lg border border-border-1 bg-surface-elevated p-4 [&_small]:block [&_small]:text-fs-12 [&_small]:text-fg-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="grid min-w-0">{lineCell(r)}</span>
                  <b className="tabular-nums">{formatMoney(r.amount)}</b>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-fs-13">
                  <StatusPill tone={PAYMENT_TONE[r.status] ?? "ghost"}>
                    {E.paymentStatus[r.status] ?? r.status}
                  </StatusPill>
                  <span className="text-fg-3">
                    {r.status === "paid" && r.paid_at
                      ? day(r.paid_at)
                      : M.dueOn(DATES.fmt(r.due_date))}
                  </span>
                </div>
                {r.status === "paid" ? (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-3 rounded-md bg-bg-2 p-3 text-fs-13">
                    <span className="grid">
                      <small>{M.commission}</small>
                      <b className="tabular-nums">
                        {r.commission ? formatMoney(r.commission) : "—"}
                      </b>
                    </span>
                    <span className="grid">
                      <small>
                        {side === "admin" ? M.academyNetAdmin : M.academyNet}
                      </small>
                      {payoutCell(r)}
                    </span>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="overflow-x-auto rounded-lg border border-border-1 le-720:hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{M.line}</TableHead>
                  <TableHead>{M.date}</TableHead>
                  <TableHead>{E.status_}</TableHead>
                  <TableHead className={numberColumn}>{M.amount}</TableHead>
                  <TableHead className={numberColumn}>{M.commission}</TableHead>
                  <TableHead>
                    {side === "admin" ? M.academyNetAdmin : M.academyNet}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{lineCell(r)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.status === "paid" && r.paid_at
                        ? M.paidOn(day(r.paid_at))
                        : M.dueOn(DATES.fmt(r.due_date))}
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={PAYMENT_TONE[r.status] ?? "ghost"}>
                        {E.paymentStatus[r.status] ?? r.status}
                      </StatusPill>
                    </TableCell>
                    <TableCell className={numberColumn}>
                      {formatMoney(r.amount)}
                    </TableCell>
                    <TableCell className={numberColumn}>
                      {r.commission ? formatMoney(r.commission) : "—"}
                    </TableCell>
                    <TableCell>{payoutCell(r)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      {last > 1 ? (
        <nav
          aria-label={LIVE.search.page(page, last)}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <Icon name="arrowl" size={16} /> {LIVE.search.previous}
          </Button>
          <span className="text-fs-14 text-fg-2">
            {LIVE.search.page(page, last)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= last}
            onClick={() => setPage((p) => p + 1)}
          >
            {LIVE.search.next} <Icon name="arrow" size={16} />
          </Button>
        </nav>
      ) : null}
      {decide ? (
        <DecidePayout
          {...decide}
          onClose={() => setDecide(null)}
          onDone={() => void q.refetch()}
        />
      ) : null}
    </div>
  )
}

/** Release or cancel a held payout, with Golafly's note (section 24) */
function DecidePayout({
  id,
  action,
  onClose,
  onDone,
}: {
  id: number
  action: "release" | "cancel"
  onClose: () => void
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const go = async () => {
    if (!note.trim()) return setError(D.noteError)
    setBusy(true)
    try {
      const { message } = await decidePayout(id, action, note)
      notify(message)
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      onDone()
      onClose()
    } catch (err) {
      // payout_not_held / payout_currency_not_supported: the toast says why
      setError(
        getApiFieldErrors(err, { note: "payout-note" }).byControl[
          "payout-note"
        ] ?? ""
      )
      if (getCurrentStatus(err)) {
        onDone()
        onClose()
      }
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={action === "release" ? D.releaseTitle : D.cancelTitle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {D.keep}
          </Button>
          <Button
            variant={action === "cancel" ? "danger" : "primary"}
            onClick={() => go()}
            aria-busy={busy}
          >
            {action === "release" ? D.release : D.cancel}
          </Button>
        </>
      }
    >
      <p className="text-fs-15 leading-lh-relaxed text-fg-2">
        {action === "release" ? D.releaseText : D.cancelText}
      </p>
      <FormField
        id="payout-note"
        label={D.note}
        required
        error={error || undefined}
      >
        {(p) => (
          <Textarea
            {...p}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </FormField>
    </Modal>
  )
}
