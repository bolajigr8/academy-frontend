"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"

import { ScheduleTable } from "@/components/enrollments/schedule-table"
import { Stars } from "@/components/reviews/stars"
import { CardBlock } from "@/components/shared/card-block"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { FieldError, FormField } from "@/components/shared/form-field"
import { Kv, KvLines } from "@/components/shared/key-value"
import { Modal } from "@/components/shared/modal"
import { NativeSelect } from "@/components/shared/native-select"
import { Notice } from "@/components/shared/notice"
import { notify } from "@/components/shared/notify"
import { SectionHead } from "@/components/shared/section-head"
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
import { Textarea } from "@/components/ui/textarea"
import { ADMIN } from "@/data/admin-copy"
import { LIVE } from "@/data/live-copy"
import {
  cancelAdminEnrollment,
  getAdminEnrollment,
  getAdminSettings,
  listAdminEnrollments,
  listAdminReviews,
  listOrganizations,
  publishReview,
  rejectReview,
  saveCommission,
  type AdminMoneyish,
} from "@/features/admin/api"
import { adminKeys } from "@/features/admin/query-keys"
import { ENROLLMENT_TONE, withLabels } from "@/features/enrollments/logic"
import { getApiFieldErrors } from "@/lib/api/errors"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

import {
  AdminHeader,
  BackLink,
  Confirm,
  Pager,
  RowAction,
  SearchBox,
  date,
  useAdminMutation,
} from "./admin-pages"

const E = LIVE.enrollment

/** Status tabs with the backend's counts (they keep their numbers while one is selected) */
function Tabs<T extends string>({
  value,
  onChange,
  labels,
  counts,
}: {
  value: T
  onChange: (v: T) => void
  labels: Record<string, string>
  counts?: Record<string, number>
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {(Object.keys(labels) as T[]).map((k) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-pill border border-border-2 bg-transparent px-4 text-fs-14 font-semibold text-fg-2 hover:text-fg-1",
            value === k && "border-fg-1 bg-fg-1 text-bg-0 hover:text-bg-0"
          )}
        >
          {labels[k]}
          <span className="font-mono text-fs-12 tabular-nums">
            {counts ? (counts[k] ?? 0) : "…"}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ---------------- reviews (section 11) ---------------- */

export function AdminReviewsClient() {
  const t = ADMIN.reviews
  const [status, setStatus] = useState<"pending" | "published" | "rejected">(
    "pending"
  )
  const [page, setPage] = useState(1)
  const [decide, setDecide] = useState<{
    id: number
    kind: "reject" | "takeDown"
  } | null>(null)
  const run = useAdminMutation()
  const params = { status, page }
  const q = useQuery({
    queryKey: adminKeys.reviews(params),
    queryFn: () => listAdminReviews(params),
  })
  const rows = q.data?.data ?? []
  return (
    <>
      <AdminHeader title={t.title} subtitle={t.subtitle} />
      <Tabs
        value={status}
        onChange={(s) => {
          setStatus(s)
          setPage(1)
        }}
        labels={t.tabs}
        counts={q.data?.meta?.status_counts}
      />
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
        <EmptyState icon="star" title={t.tabs[status]} text={t.none} />
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => (
            <li key={r.id}>
              <CardBlock className="grid gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <b className="text-fs-15">{r.author}</b>
                      <Stars value={r.overall} size={14} />
                      <b className="text-fs-14">{r.overall}/5</b>
                    </span>
                    <small className="text-fs-12 text-fg-3">
                      {r.author_account.name} · {r.author_account.email}
                    </small>
                    <small className="text-fs-12 text-fg-3">
                      {r.listing.title} · {r.academy.name}
                      {r.enrollment.application_reference
                        ? ` · ${r.enrollment.application_reference}`
                        : ""}
                    </small>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            run(() => publishReview(r.id), t.published)
                          }
                        >
                          {t.publish}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setDecide({ id: r.id, kind: "reject" })
                          }
                        >
                          {t.reject}
                        </Button>
                      </>
                    ) : r.status === "published" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setDecide({ id: r.id, kind: "takeDown" })
                        }
                      >
                        {t.takeDown}
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="text-fs-14 leading-lh-relaxed whitespace-pre-line text-fg-1">
                  {r.body}
                </p>
                {r.academy_reply ? (
                  <p className="rounded-md border-l-4 border-border-3 bg-bg-2 p-3 text-fs-13 text-fg-2">
                    {r.academy_reply}
                  </p>
                ) : null}
                {r.rejection_reason ? (
                  <small className="text-fs-13 text-fg-3">
                    {t.reasonShown(r.rejection_reason)}
                  </small>
                ) : null}
                {r.reviewed_by ? (
                  <small className="text-fs-12 text-fg-3">
                    {t.decidedBy(r.reviewed_by.name, date(r.reviewed_by.at))}
                  </small>
                ) : null}
              </CardBlock>
            </li>
          ))}
        </ul>
      )}
      <Pager meta={q.data?.meta} page={page} setPage={setPage} />
      {decide ? (
        <Confirm
          title={decide.kind === "reject" ? t.rejectTitle : t.takeDownTitle}
          text={decide.kind === "reject" ? t.rejectText : t.takeDownText}
          cta={decide.kind === "reject" ? t.reject : t.takeDown}
          danger
          reason={{ label: t.reason, error: t.reasonError }}
          onConfirm={(reason) =>
            run(
              () => rejectReview(decide.id, reason),
              decide.kind === "reject" ? t.rejected : t.takenDown
            )
          }
          onClose={() => setDecide(null)}
        />
      ) : null}
    </>
  )
}

/* ---------------- enrollments (section 14) ---------------- */

export function AdminEnrollmentsClient() {
  const t = ADMIN.enrollments
  const [status, setStatus] = useState<"pending" | "confirmed" | "cancelled">(
    "pending"
  )
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const params = { status, page, ...(search ? { search } : {}) }
  const q = useQuery({
    queryKey: adminKeys.enrollments(params),
    queryFn: () => listAdminEnrollments(params),
  })
  const rows = q.data?.data ?? []
  return (
    <>
      <AdminHeader title={t.title} subtitle={t.subtitle} />
      <Tabs
        value={status}
        onChange={(s) => {
          setStatus(s)
          setPage(1)
        }}
        labels={t.tabs}
        counts={q.data?.meta?.status_counts}
      />
      <SearchBox
        value={search}
        onChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        placeholder={t.search}
      />
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
        <EmptyState icon="wallet" title={t.tabs[status]} text={t.none} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-1">
          <Table className="am-stack-sm">
            <TableHeader>
              <TableRow>
                <TableHead>{t.player}</TableHead>
                <TableHead>{t.program}</TableHead>
                <TableHead className={numberColumn}>{t.total}</TableHead>
                <TableHead className={numberColumn}>{t.paid}</TableHead>
                <TableHead>{t.rate}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>
                  <span className="am-sr">{ADMIN.common.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <b>
                      {e.player.first_name} {e.player.last_name}
                    </b>
                    <small>{e.applicant.name}</small>
                    {e.application.reference ? (
                      <small className="whitespace-nowrap">
                        {e.application.reference}
                      </small>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {e.listing.title}
                    <small>
                      {e.listing.academy.name} · {e.organization.name}
                    </small>
                  </TableCell>
                  <TableCell className={numberColumn}>
                    {formatMoney(e.total)}
                  </TableCell>
                  <TableCell className={numberColumn}>
                    {formatMoney(e.paid)}
                  </TableCell>
                  <TableCell>{e.commission_rate}%</TableCell>
                  <TableCell>
                    <StatusPill tone={ENROLLMENT_TONE[e.status] ?? "ghost"}>
                      {E.status[e.status] ?? e.status}
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    <RowAction
                      href={routes.admin.enrollment(e.id)}
                      waiting={false}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pager meta={q.data?.meta} page={page} setPage={setPage} />
    </>
  )
}

/** A paid row's money as the backend sends it (a money object or minor units) */
function moneyish(v: AdminMoneyish, currency: string): string {
  if (v === null || v === undefined || v === "")
    return ADMIN.enrollments.notPaid
  if (typeof v === "object") return formatMoney(v)
  const minor = Number(v)
  return Number.isFinite(minor)
    ? formatMoney({
        amount_minor: minor,
        amount: (minor / 100).toFixed(2),
        currency,
      })
    : String(v)
}

export function AdminEnrollmentClient({ id }: { id: string }) {
  const t = ADMIN.enrollments
  const n = Number(id)
  const run = useAdminMutation()
  const [cancelling, setCancelling] = useState(false)
  const q = useQuery({
    queryKey: adminKeys.enrollment(n),
    queryFn: () => getAdminEnrollment(n),
    enabled: Number.isInteger(n),
  })
  if (q.isError && !q.data)
    return (
      <ErrorState
        message={LIVE.requestFailed}
        onRetry={() => void q.refetch()}
      />
    )
  if (!q.data)
    return (
      <div
        aria-hidden="true"
        className="h-64 animate-pulse rounded-lg bg-bg-2"
      />
    )
  const e = q.data
  const currency = e.total.currency
  const rows = withLabels(e.payments)
  return (
    <>
      <BackLink href={routes.admin.enrollments} />
      <AdminHeader
        title={`${e.player.first_name} ${e.player.last_name}`}
        subtitle={`${e.listing.title} · ${e.listing.academy.name}`}
        actions={
          e.status !== "cancelled" ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCancelling(true)}
            >
              {t.cancel}
            </Button>
          ) : undefined
        }
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-4">
        <CardBlock aria-labelledby="h-money">
          <SectionHead
            id="h-money"
            title={t.money}
            action={
              <StatusPill tone={ENROLLMENT_TONE[e.status] ?? "ghost"}>
                {E.status[e.status] ?? e.status}
              </StatusPill>
            }
          />
          <KvLines>
            <Kv label={E.plan}>{E.plans[e.plan] ?? e.plan}</Kv>
            <Kv label={t.total}>{formatMoney(e.total)}</Kv>
            <Kv label={t.paid}>{formatMoney(e.paid)}</Kv>
            <Kv label={t.outstanding}>{formatMoney(e.outstanding)}</Kv>
            <Kv label={t.rate}>{t.commissionRate(e.commission_rate)}</Kv>
          </KvLines>
        </CardBlock>
        <CardBlock aria-labelledby="h-who">
          <SectionHead id="h-who" title={t.application} />
          <KvLines>
            <Kv label={t.application}>
              <Link
                className="am-link"
                href={routes.admin.application(e.application.id)}
              >
                {e.application.reference ?? `#${e.application.id}`}
              </Link>
            </Kv>
            <Kv label={t.applicant}>
              {e.applicant.name} · {e.applicant.email}
            </Kv>
            <Kv label={t.organization}>{e.organization.name}</Kv>
            <Kv label={E.startsOn("").trim()}>{date(e.intake_start_date)}</Kv>
          </KvLines>
        </CardBlock>
      </div>
      {e.cancellation ? (
        <Notice tone="neutral" icon="info">
          <b>
            {t.cancelledBy(
              t.by[e.cancellation.by.type] ?? e.cancellation.by.type,
              date(e.cancellation.cancelled_at)
            )}
            {e.cancellation.by.name ? ` (${e.cancellation.by.name})` : ""}
          </b>
          <br />
          {e.cancellation.reason}
          {e.cancellation.refund_note ? (
            <>
              <br />
              {t.refund(e.cancellation.refund_note)}
            </>
          ) : null}
        </Notice>
      ) : null}
      <CardBlock aria-labelledby="h-sched">
        <SectionHead id="h-sched" title={t.schedule} sub={t.payoutNote} />
        {rows.length === 0 ? (
          <p className="text-fs-14 text-fg-3">{E.noRows}</p>
        ) : (
          <>
            <ScheduleTable rows={e.payments} />
            <div className="overflow-x-auto">
              <Table className="am-stack-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>{E.payment}</TableHead>
                    <TableHead className={numberColumn}>
                      {t.commission}
                    </TableHead>
                    <TableHead className={numberColumn}>
                      {t.academyNet}
                    </TableHead>
                    <TableHead className={numberColumn}>{t.eurRate}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className={numberColumn}>
                        {moneyish(r.commission ?? null, currency)}
                      </TableCell>
                      <TableCell className={numberColumn}>
                        {moneyish(r.academy_net ?? null, currency)}
                      </TableCell>
                      <TableCell className={numberColumn}>
                        {r.eur_rate ?? t.notPaid}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardBlock>
      {cancelling ? (
        <CancelEnrollment
          id={e.id}
          onClose={() => setCancelling(false)}
          run={run}
        />
      ) : null}
    </>
  )
}

function CancelEnrollment({
  id,
  onClose,
  run,
}: {
  id: number
  onClose: () => void
  run: ReturnType<typeof useAdminMutation>
}) {
  const t = ADMIN.enrollments
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const go = async () => {
    if (!reason.trim()) return setErrors({ "enr-cancel-reason": t.reasonError })
    setBusy(true)
    try {
      await run(
        () => cancelAdminEnrollment(id, { reason, refund_note: note }),
        t.cancelled
      )
      onClose()
    } catch (err) {
      setErrors(
        getApiFieldErrors(err, {
          reason: "enr-cancel-reason",
          refund_note: "enr-cancel-note",
        }).byControl
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={t.cancelTitle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {ADMIN.common.cancel}
          </Button>
          <Button variant="danger" onClick={() => go()} aria-busy={busy}>
            {t.cancel}
          </Button>
        </>
      }
    >
      <p className="text-fs-15 leading-lh-relaxed text-fg-2">{t.cancelText}</p>
      <FormField
        id="enr-cancel-reason"
        label={t.reason}
        required
        error={errors["enr-cancel-reason"]}
      >
        {(p) => (
          <Textarea
            {...p}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </FormField>
      <FormField
        id="enr-cancel-note"
        label={t.refundNote}
        error={errors["enr-cancel-note"]}
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

/* ---------------- commission (section 15) ---------------- */

export function AdminCommissionClient() {
  const t = ADMIN.commission
  const q = useQuery({
    queryKey: adminKeys.settings(),
    queryFn: getAdminSettings,
  })
  const orgs = useQuery({
    queryKey: adminKeys.organizations({ per_page: 50 }),
    queryFn: () => listOrganizations({ per_page: 50 }),
  })
  const queryClient = useQueryClient()
  const [orgId, setOrgId] = useState("")
  const [rate, setRate] = useState("")
  const [error, setError] = useState("")
  const validRate = (v: string) =>
    /^\d{1,3}(\.\d{1,2})?$/.test(v.trim()) && Number(v) <= 100

  const save = async (organizationId: number, value: number | null) => {
    try {
      // the backend's own words: it applies to new enrollments only
      const { message } = await saveCommission(organizationId, value)
      await queryClient.invalidateQueries({ queryKey: adminKeys.all })
      notify(message)
      setOrgId("")
      setRate("")
      setError("")
    } catch (err) {
      setError(
        getApiFieldErrors(err, { commission_rate: "com-rate" }).byControl[
          "com-rate"
        ] ?? ""
      )
    }
  }

  if (q.isError && !q.data)
    return (
      <ErrorState
        message={LIVE.requestFailed}
        onRetry={() => void q.refetch()}
      />
    )
  const s = q.data
  return (
    <>
      <AdminHeader title={t.title} subtitle={t.subtitle} />
      <CardBlock aria-labelledby="h-default">
        <SectionHead
          id="h-default"
          title={t.defaultRate}
          sub={t.defaultRateSub}
        />
        <b className="font-display text-[40px] leading-none">
          {s ? `${s.default_rate}%` : "…"}
        </b>
      </CardBlock>
      <CardBlock aria-labelledby="h-over">
        <SectionHead id="h-over" title={t.overrides} sub={t.overridesSub} />
        {s && s.overrides.length === 0 ? (
          <p className="text-fs-14 text-fg-3">{t.none}</p>
        ) : (
          <ul className="grid gap-2">
            {(s?.overrides ?? []).map((o) => (
              <li
                key={o.organization_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-1 p-3"
              >
                <span className="grid">
                  <b className="text-fs-14">{o.organization_name}</b>
                  <small className="text-fs-12 text-fg-3">
                    {t.updated(o.updated_by, date(o.updated_at))}
                  </small>
                </span>
                <span className="flex items-center gap-3">
                  <b className="font-display text-fs-24">
                    {o.commission_rate}%
                  </b>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => save(o.organization_id, null)}
                  >
                    {t.clear}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-3 border-t border-border-1 pt-4">
          <b className="text-fs-14">{t.add}</b>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] items-end gap-3 le-720:grid-cols-[minmax(0,1fr)]">
            <FormField id="com-org" label={t.organization} required>
              {(p) => (
                <NativeSelect
                  {...p}
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                >
                  <option value="">{t.chooseOrg}</option>
                  {(orgs.data?.data ?? []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </FormField>
            <FormField id="com-rate" label={t.rate} required>
              {(p) => (
                <Input
                  {...p}
                  inputMode="decimal"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              )}
            </FormField>
            <Button
              className="min-h-[52px] le-720:justify-self-start"
              disabled={!orgId}
              onClick={() => {
                if (!validRate(rate)) return setError(t.rateError)
                setError("")
                return save(Number(orgId), Number(rate))
              }}
            >
              {t.save}
            </Button>
          </div>
          {/* one hint for the row, so the two fields and the button line up */}
          <p className="text-fs-13 text-fg-3">{t.rateHint}</p>
          {error ? <FieldError id="com-rate-err">{error}</FieldError> : null}
        </div>
      </CardBlock>
    </>
  )
}
