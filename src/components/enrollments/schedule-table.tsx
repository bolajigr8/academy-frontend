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
import {
  PAYMENT_TONE,
  sumByCurrency,
  withLabels,
} from "@/features/enrollments/logic"
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
  payingKey = null,
}: {
  rows: (ApiEnrollmentPayment | ApiFamilyPayment)[]
  /** the family's payments page: a column naming the program and the player */
  appHref?: (row: ApiFamilyPayment) => string
  /**
   * The family only: one Pay button per enrollment, on its first due line,
   * paying every due or overdue line of that enrollment in one card payment
   * (week 3 part 3, section 18)
   */
  onPay?: (rows: ApiEnrollmentPayment[]) => void
  /** the enrollment being paid (the button shows it is busy) */
  payingKey?: number | null
}) {
  const actions = Boolean(onPay || appHref)
  // due lines grouped by enrollment; the button sits on each group's first line
  const groups = new Map<number, ApiEnrollmentPayment[]>()
  for (const r of rows)
    if (r.status === "due" || r.status === "overdue") {
      const k = "enrollment_id" in r ? r.enrollment_id : 0
      groups.set(k, [...(groups.get(k) ?? []), r])
    }
  const payButton = (r: ApiEnrollmentPayment) => {
    if (!onPay) return null
    const k = "enrollment_id" in r ? (r as ApiFamilyPayment).enrollment_id : 0
    const group = groups.get(k)
    if (!group || group[0].id !== r.id) return null
    return (
      <Button
        size="sm"
        aria-busy={payingKey === k || undefined}
        onClick={() => onPay(group)}
      >
        {t.payAmount(sumByCurrency(group.map((x) => x.amount)))}
      </Button>
    )
  }
  const named = withLabels(rows)
  const status = (r: (typeof named)[number]) => (
    <StatusPill tone={PAYMENT_TONE[r.status] ?? "ghost"}>
      {t.paymentStatus[r.status] ?? r.status}
    </StatusPill>
  )
  const rowActions = (r: (typeof named)[number]) =>
    actions ? (
      <>
        {payButton(r)}
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
              {/* the pill already says Paid: the date alone */}
              <span>
                {r.status === "paid" && r.paid_at
                  ? DATES.fmt(r.paid_at.slice(0, 10))
                  : DATES.fmt(r.due_date)}
              </span>
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
                        {payButton(r)}
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
