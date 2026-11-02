"use client"

import { Icon } from "@/components/icons/icon"
import { CardBlock } from "@/components/shared/card-block"
import { Kv, KvLines } from "@/components/shared/key-value"
import { Notice } from "@/components/shared/notice"
import { SectionHead } from "@/components/shared/section-head"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import type {
  ApiEnrollmentCore,
  ApiEnrollmentPayment,
} from "@/features/enrollments/api"
import { ENROLLMENT_TONE, sumByCurrency } from "@/features/enrollments/logic"
import { formatMoney } from "@/lib/money"
import { routes } from "@/routes"

import { ScheduleTable } from "./schedule-table"
import { payable, usePay } from "./use-pay"

const t = LIVE.enrollment
const day = (iso: string) => DATES.fmt(iso.slice(0, 10))

/*
 * An enrollment with its schedule (week 3 part 1): status, plan, totals,
 * the first-payment deadline (or when it was confirmed or cancelled, and
 * why) and every line. The family is reminded that the place is held until
 * the deadline; paying arrives in part 3, so there is no Pay button.
 */
export function EnrollmentCard({
  e,
  side,
}: {
  e: ApiEnrollmentCore & {
    payments: ApiEnrollmentPayment[]
    cancelled_at?: string | null
    cancel_reason?: string | null
  }
  side: "family" | "academy"
}) {
  const { pay, busy } = usePay()
  return (
    <CardBlock aria-labelledby="h-enrollment">
      <SectionHead
        id="h-enrollment"
        title={t.title}
        action={
          <StatusPill tone={ENROLLMENT_TONE[e.status] ?? "ghost"}>
            {t.status[e.status] ?? e.status}
          </StatusPill>
        }
      />
      <KvLines>
        <Kv label={t.plan}>{t.plans[e.plan] ?? e.plan}</Kv>
        <Kv label={t.total}>{formatMoney(e.total)}</Kv>
        <Kv label={t.paid}>{formatMoney(e.paid)}</Kv>
        <Kv label={t.outstanding}>{formatMoney(e.outstanding)}</Kv>
      </KvLines>
      {e.status === "pending" && e.first_payment_deadline ? (
        <Notice tone="warning" icon="calendar">
          {side === "family"
            ? t.payBy(day(e.first_payment_deadline))
            : t.familyDeadline(day(e.first_payment_deadline))}
        </Notice>
      ) : null}
      {side === "family" &&
      e.status !== "cancelled" &&
      e.payments.some((r) => r.status === "due" || r.status === "overdue") ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => pay(payable(e.payments))} aria-busy={busy}>
            <Icon name="wallet" size={16} />{" "}
            {t.payAmount(
              sumByCurrency(payable(e.payments).map((r) => r.amount))
            )}
          </Button>
          <ButtonLink href={routes.family.payments} variant="secondary">
            {t.goPayments}
          </ButtonLink>
          <p className="w-full text-fs-13 text-fg-3">{t.payHint}</p>
        </div>
      ) : null}
      {e.status === "confirmed" && e.confirmed_at ? (
        <Notice tone="success" icon="checkcircle">
          {t.confirmedOn(day(e.confirmed_at))}
        </Notice>
      ) : null}
      {e.status === "cancelled" && e.cancelled_at ? (
        <Notice tone="neutral" icon="info">
          {t.cancelledOn(day(e.cancelled_at), e.cancel_reason ?? null)}
        </Notice>
      ) : null}
      <h3 className="mt-2 text-fs-14 font-semibold text-fg-1">{t.schedule}</h3>
      {e.payments.length ? (
        <ScheduleTable rows={e.payments} />
      ) : (
        <p className="text-fs-14 text-fg-3">{t.noRows}</p>
      )}
    </CardBlock>
  )
}
