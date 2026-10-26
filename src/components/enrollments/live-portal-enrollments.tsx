"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Fragment, useEffect, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { NativeSelect } from "@/components/shared/native-select"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
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
import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import { listAllListings } from "@/features/club/api"
import { clubKeys } from "@/features/club/query-keys"
import {
  enrollmentKeys,
  getPortalEnrollment,
  listPortalEnrollments,
  type EnrollmentStatus,
} from "@/features/enrollments/api"
import { ENROLLMENT_TONE } from "@/features/enrollments/logic"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

import { ScheduleTable } from "./schedule-table"

const t = LIVE.enrollment
const TABS: EnrollmentStatus[] = ["pending", "confirmed", "cancelled"]
const day = (iso: string) => DATES.fmt(iso.slice(0, 10))

/*
 * The academy's enrollments (week 3 part 1, section 6) on its Payments page:
 * the players it moved to enrollment, with their totals and what is still to
 * pay. Tabs use meta.status_counts (they keep their numbers while one is
 * selected); the listing filter and the search (family or player name) are
 * the backend's. Each row opens the applicant page, which shows the schedule.
 * Golafly's commission and payouts arrive with part 3.
 */
export function LivePortalEnrollments() {
  const [status, setStatus] = useState<EnrollmentStatus>("pending")
  const [listingId, setListingId] = useState("")
  const [typed, setTyped] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  // one row's schedule open at a time (GET /academy/portal/enrollments/{id})
  const [openId, setOpenId] = useState<number | null>(null)
  // the search waits for a pause in typing
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(typed.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(id)
  }, [typed])

  const params = {
    status,
    page,
    ...(listingId ? { listing_id: Number(listingId) } : {}),
    ...(search ? { search } : {}),
  }
  const list = useQuery({
    queryKey: enrollmentKeys.portal(params),
    queryFn: () => listPortalEnrollments(params),
    placeholderData: keepPreviousData,
  })
  const listings = useQuery({
    queryKey: clubKeys.listings(),
    queryFn: listAllListings,
  })
  const counts = list.data?.meta?.status_counts
  const rows = list.data?.data ?? []
  const last = list.data?.meta?.last_page ?? 1

  return (
    <>
      <PageHeading title={t.listTitle} subtitle={t.listSub} />
      <div
        role="tablist"
        aria-label={t.listTitle}
        className="flex flex-wrap gap-2"
      >
        {TABS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={status === s}
            onClick={() => {
              setStatus(s)
              setPage(1)
            }}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-pill border border-border-2 bg-transparent px-4 text-fs-14 font-semibold text-fg-2 hover:text-fg-1",
              status === s && "border-fg-1 bg-fg-1 text-bg-0 hover:text-bg-0"
            )}
          >
            {t.tabs[s]}
            <span className="font-mono text-fs-12 tabular-nums">
              {counts ? counts[s] : "…"}
            </span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 le-720:grid-cols-[minmax(0,1fr)]">
        <label className="grid gap-1 text-fs-13 font-semibold text-fg-2">
          {t.searchLabel}
          <Input
            type="search"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-fs-13 font-semibold text-fg-2">
          {t.program}
          <NativeSelect
            value={listingId}
            onChange={(e) => {
              setListingId(e.target.value)
              setPage(1)
            }}
          >
            <option value="">{t.allListings}</option>
            {(listings.data ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </NativeSelect>
        </label>
      </div>

      {list.isError && !list.data ? (
        <ErrorState
          message={LIVE.requestFailed}
          onRetry={() => void list.refetch()}
        />
      ) : !list.data ? (
        <div
          aria-hidden="true"
          className="h-64 animate-pulse rounded-lg bg-bg-2"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="wallet"
          title={t.tabs[status]}
          text={t.empty}
          cta={
            <ButtonLink href={routes.club.applications} variant="secondary">
              {LIVE.messages.openApplication}
            </ButtonLink>
          }
        />
      ) : (
        <>
          {/* phones: one card per enrollment, every detail and button in view */}
          <ul className="hidden min-w-0 grid-cols-[minmax(0,1fr)] gap-3 le-720:grid">
            {rows.map((e) => (
              <li
                key={e.id}
                className="grid min-w-0 gap-3 rounded-lg border border-border-1 bg-surface-elevated p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="grid min-w-0">
                    <b className="text-fs-15">
                      {e.player.first_name} {e.player.last_name}
                    </b>
                    <small className="text-fs-12 text-fg-3">
                      {e.applicant.name}
                    </small>
                    {e.application.reference ? (
                      <small className="text-fs-12 whitespace-nowrap text-fg-3">
                        {e.application.reference}
                      </small>
                    ) : null}
                  </span>
                  <StatusPill tone={ENROLLMENT_TONE[e.status] ?? "ghost"}>
                    {t.status[e.status] ?? e.status}
                  </StatusPill>
                </div>
                <span className="grid text-fs-14">
                  {e.listing.title}
                  <small className="text-fs-12 text-fg-3">
                    {t.startsOn(DATES.fmt(e.intake_start_date))} ·{" "}
                    {t.plans[e.plan] ?? e.plan}
                  </small>
                </span>
                <div className="grid grid-cols-2 gap-2 rounded-md bg-bg-2 p-3 text-fs-13">
                  <span className="grid">
                    <small className="text-fg-3">{t.total}</small>
                    <b className="tabular-nums">{formatMoney(e.total)}</b>
                  </span>
                  <span className="grid">
                    <small className="text-fg-3">{t.outstanding}</small>
                    <b className="tabular-nums">{formatMoney(e.outstanding)}</b>
                  </span>
                </div>
                {e.status === "pending" && e.first_payment_deadline ? (
                  <small className="text-fs-12 text-fg-3">
                    {t.familyPaysBy(day(e.first_payment_deadline))}
                  </small>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-expanded={openId === e.id}
                    onClick={() => setOpenId((x) => (x === e.id ? null : e.id))}
                  >
                    {t.scheduleShort}
                  </Button>
                  <ButtonLink
                    href={routes.club.applicant(String(e.application.id))}
                    size="sm"
                  >
                    {t.open} <Icon name="arrow" size={14} />
                  </ButtonLink>
                </div>
                {openId === e.id ? <RowSchedule id={e.id} /> : null}
              </li>
            ))}
          </ul>
          <div
            aria-busy={list.isFetching || undefined}
            className={cn(
              "overflow-x-auto rounded-lg border border-border-1 le-720:hidden",
              list.isFetching && "opacity-70"
            )}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{t.player}</TableHead>
                  <TableHead scope="col">{t.program}</TableHead>
                  <TableHead scope="col">{t.plan}</TableHead>
                  <TableHead scope="col" className={numberColumn}>
                    {t.total}
                  </TableHead>
                  <TableHead scope="col" className={numberColumn}>
                    {t.outstanding}
                  </TableHead>
                  <TableHead scope="col">{t.status_}</TableHead>
                  <TableHead scope="col">
                    <span className="am-sr">{t.open}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <Fragment key={e.id}>
                    <TableRow>
                      <TableCell>
                        <Link
                          className="am-link"
                          href={routes.club.applicant(String(e.application.id))}
                        >
                          {e.player.first_name} {e.player.last_name}
                        </Link>
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
                          {t.startsOn(DATES.fmt(e.intake_start_date))}
                        </small>
                      </TableCell>
                      <TableCell>{t.plans[e.plan] ?? e.plan}</TableCell>
                      <TableCell className={numberColumn}>
                        {formatMoney(e.total)}
                      </TableCell>
                      <TableCell className={numberColumn}>
                        {formatMoney(e.outstanding)}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={ENROLLMENT_TONE[e.status] ?? "ghost"}>
                          {t.status[e.status] ?? e.status}
                        </StatusPill>
                        <small>
                          {e.status === "pending" && e.first_payment_deadline
                            ? t.familyPaysBy(day(e.first_payment_deadline))
                            : e.status === "confirmed" && e.confirmed_at
                              ? t.confirmedOn(day(e.confirmed_at))
                              : e.status === "cancelled" && e.cancelled_at
                                ? t.cancelledOn(
                                    day(e.cancelled_at),
                                    e.cancel_reason
                                  )
                                : ""}
                        </small>
                      </TableCell>
                      <TableCell>
                        <span className="flex gap-1.5 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-expanded={openId === e.id}
                            aria-controls={`enr-sched-${e.id}`}
                            onClick={() =>
                              setOpenId((x) => (x === e.id ? null : e.id))
                            }
                          >
                            {t.scheduleShort}
                          </Button>
                          <ButtonLink
                            href={routes.club.applicant(
                              String(e.application.id)
                            )}
                            variant="secondary"
                            size="sm"
                            className="whitespace-nowrap"
                          >
                            {t.open} <Icon name="arrow" size={14} />
                          </ButtonLink>
                        </span>
                      </TableCell>
                    </TableRow>
                    {openId === e.id ? (
                      <TableRow id={`enr-sched-${e.id}`}>
                        <TableCell colSpan={7}>
                          <RowSchedule id={e.id} />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
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
    </>
  )
}

/** One enrollment's lines, read when opened (week 3 part 1, section 6) */
function RowSchedule({ id }: { id: number }) {
  const q = useQuery({
    queryKey: enrollmentKeys.portalOne(id),
    queryFn: () => getPortalEnrollment(id),
  })
  if (q.isPending)
    return (
      <p className="text-fs-14 text-fg-3" aria-busy="true">
        …
      </p>
    )
  if (!q.data)
    return (
      <ErrorState
        message={LIVE.requestFailed}
        onRetry={() => void q.refetch()}
      />
    )
  return q.data.payments.length ? (
    <ScheduleTable rows={q.data.payments} />
  ) : (
    <p className="text-fs-14 text-fg-3">{t.noRows}</p>
  )
}
