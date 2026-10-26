import Link from "next/link"

import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { Tag } from "@/components/shared/tag"
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
import type {
  ApiEnrollmentPayment,
  ApiFamilyPayment,
} from "@/features/enrollments/api"
import { PAYMENT_TONE, withLabels } from "@/features/enrollments/logic"
import { formatMoney } from "@/lib/money"

const t = LIVE.enrollment

/*
 * A payment schedule (week 3 part 1, sections 3, 4 and 6), drawn like the
 * prototype's AmPayTable. Each line's status is the backend's own
 * (scheduled, due, paid, overdue, cancelled); amounts in the listing's
 * currency. "Confirms the place" marks the lines needed to be enrolled while
 * still unpaid. No Pay button: paying arrives in part 3.
 */
export function ScheduleTable({
  rows,
  appHref,
  onPay,
}: {
  rows: (ApiEnrollmentPayment | ApiFamilyPayment)[]
  /** the family's payments page: a column naming the program and the player */
  appHref?: (row: ApiFamilyPayment) => string
  /** the family only: a Pay now button on each line due or overdue */
  onPay?: (row: ApiEnrollmentPayment) => void
}) {
  const actions = Boolean(onPay || appHref)
  const named = withLabels(rows)
  const status = (r: (typeof named)[number]) => (
    <StatusPill tone={PAYMENT_TONE[r.status] ?? "ghost"}>
      {t.paymentStatus[r.status] ?? r.status}
    </StatusPill>
  )
  const when = (r: (typeof named)[number]) =>
    r.status === "paid" && r.paid_at
      ? t.paidOn(DATES.fmt(r.paid_at.slice(0, 10)))
      : DATES.fmt(r.due_date)
  const rowActions = (r: (typeof named)[number]) =>
    actions ? (
      <>
        {onPay && (r.status === "due" || r.status === "overdue") ? (
          <Button size="sm" onClick={() => onPay(r)}>
            {t.payNow}
          </Button>
        ) : null}
        {appHref && "enrollment_id" in r ? (
          <ButtonLink href={appHref(r)} variant="secondary" size="sm">
            {t.viewApplication}
          </ButtonLink>
        ) : null}
      </>
    ) : null
  return (
    <>
      {/* phones: one stacked card per line, nothing to scroll sideways */}
      <ul className="hidden gap-2 le-600:grid">
        {named.map((r) => (
          <li
            key={r.id}
            className="grid gap-2 rounded-md border border-border-1 bg-bg-2 p-3"
          >
            {appHref && "enrollment_id" in r ? (
              <small className="text-fs-12 text-fg-3">
                {r.listing_title} · {r.player_name}
              </small>
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <b className="text-fs-15">{r.name}</b>
              <b className="text-fs-15 whitespace-nowrap tabular-nums">
                {formatMoney(r.amount)}
              </b>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-fs-13 text-fg-2">
              {status(r)}
              <span>{when(r)}</span>
              {r.required_for_enrollment &&
              r.status !== "paid" &&
              r.status !== "cancelled" ? (
                <Tag mono>{t.confirmsPlace}</Tag>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap gap-2">{rowActions(r)}</div>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto le-600:hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {appHref ? <TableHead scope="col">{t.program}</TableHead> : null}
              <TableHead scope="col">{t.payment}</TableHead>
              <TableHead scope="col">{t.due}</TableHead>
              <TableHead scope="col">{t.status_}</TableHead>
              <TableHead scope="col" className={numberColumn}>
                {t.amount}
              </TableHead>
              {actions ? (
                <TableHead scope="col">
                  <span className="am-sr">{t.open}</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {named.map((r) => {
              const open = r.status !== "paid" && r.status !== "cancelled"
              return (
                <TableRow key={r.id}>
                  {appHref && "enrollment_id" in r ? (
                    <TableCell>
                      <Link className="am-link" href={appHref(r)}>
                        {r.listing_title}
                      </Link>
                      <small>
                        {r.player_name} · {r.academy_name}
                      </small>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    {r.name}
                    {r.required_for_enrollment && open ? (
                      <Tag mono className="ml-2">
                        {t.confirmsPlace}
                      </Tag>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {r.status === "paid" && r.paid_at
                      ? t.paidOn(DATES.fmt(r.paid_at.slice(0, 10)))
                      : DATES.fmt(r.due_date)}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={PAYMENT_TONE[r.status] ?? "ghost"}>
                      {t.paymentStatus[r.status] ?? r.status}
                    </StatusPill>
                  </TableCell>
                  <TableCell className={numberColumn}>
                    {formatMoney(r.amount)}
                  </TableCell>
                  {actions ? (
                    <TableCell>
                      <span className="flex justify-end gap-1.5 whitespace-nowrap">
                        {onPay &&
                        (r.status === "due" || r.status === "overdue") ? (
                          <Button size="sm" onClick={() => onPay(r)}>
                            {t.payNow}
                          </Button>
                        ) : null}
                        {appHref && "enrollment_id" in r ? (
                          <ButtonLink
                            href={appHref(r)}
                            variant="secondary"
                            size="sm"
                          >
                            {t.viewApplication}
                          </ButtonLink>
                        ) : null}
                      </span>
                    </TableCell>
                  ) : null}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
