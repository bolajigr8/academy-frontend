"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { CardBlock } from "@/components/shared/card-block"
import { Notice } from "@/components/shared/notice"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { LIVE } from "@/data/live-copy"
import {
  enrollmentKeys,
  getMyEnrollment,
  type ApiEnrollment,
} from "@/features/enrollments/api"
import { sumByCurrency } from "@/features/enrollments/logic"
import { familyKeys } from "@/features/family/query-keys"
import { notificationKeys } from "@/features/notifications/api"
import { getCheckout, paymentKeys } from "@/features/payments/api"
import { getApiStatus } from "@/lib/api/errors"
import { formatMoney } from "@/lib/money"
import { routes } from "@/routes"

import { ScheduleTable } from "./schedule-table"
import { payable, usePay } from "./use-pay"

const t = LIVE.checkout
/** "Ask every 2 seconds for about 30 seconds" (section 18) */
const POLL_MS = 2000
const POLL_FOR_MS = 30_000

/*
 * Where Stripe sends the family back (week 3 part 3, section 18). The payment
 * is confirmed by Stripe telling the API, not by this page, so the page asks
 * GET /me/payments/by-session/{id} until it stops saying pending, then shows
 * one of the five outcomes. "cancelled=1" means the family left Stripe's
 * page: nothing was paid.
 */
export function CheckoutReturn({
  enrollmentId,
  sessionId,
  left,
}: {
  enrollmentId: number | null
  sessionId: string | null
  left: boolean
}) {
  const queryClient = useQueryClient()
  const validSession = sessionId?.startsWith("cs_") ? sessionId : null
  const started = useRef<number>(0)
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    started.current = Date.now()
    const id = setTimeout(() => setTimedOut(true), POLL_FOR_MS)
    return () => clearTimeout(id)
  }, [])

  const checkout = useQuery({
    queryKey: paymentKeys.checkout(validSession ?? "none"),
    queryFn: () => getCheckout(validSession ?? ""),
    enabled: Boolean(validSession) && !left,
    retry: false,
    refetchInterval: (q) =>
      q.state.data?.status === "pending" && !timedOut ? POLL_MS : false,
  })
  const status = checkout.data?.status
  const eid = checkout.data?.enrollment.id ?? enrollmentId
  const enrollment = useQuery({
    queryKey: [...enrollmentKeys.myOne(eid ?? 0), "return", status],
    queryFn: () => getMyEnrollment(eid ?? 0),
    enabled:
      eid !== null && (left || (status !== undefined && status !== "pending")),
  })

  // once settled, everything showing payments or statuses is out of date
  useEffect(() => {
    if (!status || status === "pending") return
    void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    void queryClient.invalidateQueries({ queryKey: familyKeys.all })
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  }, [status, queryClient])

  const e = enrollment.data
  const appHref = e
    ? routes.family.application(String(e.application.id))
    : routes.family.applications
  const links = (
    <div className="flex flex-wrap gap-2">
      <ButtonLink href={appHref} variant="secondary">
        {t.viewApplication}
      </ButtonLink>
      <ButtonLink href={routes.family.payments} variant="secondary">
        {t.payments}
      </ButtonLink>
    </div>
  )

  let body: React.ReactNode
  if (left) body = <Retry e={e} text={t.left} links={links} />
  else if (!validSession || getApiStatus(checkout.error) === 404)
    body = (
      <>
        <Notice tone="warning" icon="alert">
          {t.notFound}
        </Notice>
        {links}
      </>
    )
  else if (!checkout.data || status === "pending")
    body = timedOut ? (
      <>
        <Notice tone="neutral" icon="clock">
          {t.stillPending}
        </Notice>
        {links}
      </>
    ) : (
      <div className="grid justify-items-start gap-2" aria-live="polite">
        <span className="flex items-center gap-2 text-fs-18 font-semibold">
          <Icon name="spinner" size={20} className="animate-spin" />
          {t.confirming}
        </span>
        <p className="text-fs-14 text-fg-3">{t.confirmingLead}</p>
      </div>
    )
  else if (status === "paid") {
    const c = checkout.data
    const enrollmentStatus = e?.status ?? c.enrollment.status
    body = (
      <>
        <Notice
          tone={enrollmentStatus === "cancelled" ? "neutral" : "success"}
          icon="checkcircle"
        >
          {enrollmentStatus === "confirmed"
            ? t.paidEnrolled(
                e ? `${e.player.first_name} ${e.player.last_name}` : ""
              )
            : enrollmentStatus === "cancelled"
              ? t.paidCancelled
              : t.paidPart}
          <br />
          {t.amountPaid(formatMoney(c.amount))}
          {enrollmentStatus === "pending" &&
          e &&
          e.outstanding.amount_minor > 0 ? (
            <>
              <br />
              {t.paidPartLead(formatMoney(e.outstanding))}
            </>
          ) : null}
        </Notice>
        <ScheduleTable rows={c.payments} />
        {links}
      </>
    )
  } else if (status === "refund_due")
    body = (
      <>
        <Notice tone="warning" icon="info">
          {t.refundDue}
          <br />
          {t.amountPaid(formatMoney(checkout.data.amount))}
        </Notice>
        {links}
      </>
    )
  else
    body = (
      <Retry
        e={e}
        text={status === "failed" ? t.failed : t.expired}
        links={links}
      />
    )

  return (
    <>
      <PageHeading title={t.title} />
      <CardBlock className="grid gap-4">{body}</CardBlock>
    </>
  )
}

/** Nothing was paid: offer to pay what is still due, in one go */
function Retry({
  e,
  text,
  links,
}: {
  e: ApiEnrollment | undefined
  text: string
  links: React.ReactNode
}) {
  const { pay, busy } = usePay()
  const due = e && e.status === "pending" ? payable(e.payments) : []
  return (
    <>
      <Notice tone="neutral" icon="info">
        {text}
      </Notice>
      {due.length ? (
        <Button
          className="justify-self-start"
          onClick={() => pay(due)}
          aria-busy={busy}
        >
          <Icon name="wallet" size={16} /> {t.payAgain} ·{" "}
          {sumByCurrency(due.map((r) => r.amount))}
        </Button>
      ) : null}
      {links}
    </>
  )
}
