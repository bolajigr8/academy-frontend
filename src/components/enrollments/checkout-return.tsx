"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { CardBlock } from "@/components/shared/card-block"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { LIVE } from "@/data/live-copy"
import {
  enrollmentKeys,
  getMyEnrollment,
  type ApiEnrollment,
} from "@/features/enrollments/api"
import { familyKeys } from "@/features/family/query-keys"
import { notificationKeys } from "@/features/notifications/api"
import {
  getCheckout,
  paymentKeys,
  type ApiCheckout,
} from "@/features/payments/api"
import { getApiStatus } from "@/lib/api/errors"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

import { ScheduleTable } from "./schedule-table"
import { payable, payTotals, usePay } from "./use-pay"

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

  // one centred result: an icon, a headline, the amount, a sentence, actions
  let view: ResultProps
  if (left)
    view = {
      tone: "neutral",
      icon: "info",
      head: t.head.left,
      text: t.left,
      retry: true,
    }
  else if (!validSession || getApiStatus(checkout.error) === 404)
    view = {
      tone: "warning",
      icon: "alert",
      head: t.head.notFound,
      text: t.notFound,
    }
  else if (!checkout.data || status === "pending")
    view = timedOut
      ? {
          tone: "neutral",
          icon: "clock",
          head: t.head.pending,
          text: t.stillPending,
        }
      : {
          tone: "neutral",
          icon: "spinner",
          spin: true,
          head: t.head.confirming,
          text: t.confirmingLead,
          live: true,
          noLinks: true,
        }
  else if (status === "paid") {
    const c = checkout.data
    const enrollmentStatus = e?.status ?? c.enrollment.status
    view = {
      tone: enrollmentStatus === "cancelled" ? "neutral" : "success",
      icon: "checkcircle",
      head:
        enrollmentStatus === "confirmed"
          ? t.head.enrolled
          : enrollmentStatus === "cancelled"
            ? t.head.cancelled
            : t.head.paid,
      text:
        enrollmentStatus === "confirmed"
          ? t.paidEnrolled(
              e ? `${e.player.first_name} ${e.player.last_name}` : ""
            )
          : enrollmentStatus === "cancelled"
            ? t.paidCancelled
            : e && e.outstanding.amount_minor > 0
              ? t.paidPartLead(formatMoney(e.outstanding))
              : t.paidPart,
      amount: formatMoney(c.amount),
      // part 5: amount includes the service fee; say how much of it was the fee
      feeNote: c.service_fee
        ? t.feeIncluded(formatMoney(c.service_fee))
        : undefined,
      lines: c.payments,
    }
  } else if (status === "refund_due")
    view = {
      tone: "warning",
      icon: "info",
      head: t.head.refund,
      text: t.refundDue,
      amount: formatMoney(checkout.data.amount),
    }
  else
    view = {
      tone: "neutral",
      icon: "info",
      head: status === "failed" ? t.head.failed : t.head.expired,
      text: status === "failed" ? t.failed : t.expired,
      retry: true,
    }

  return (
    <>
      <PageHeading title={t.title} />
      <Result {...view} e={e} links={links} />
    </>
  )
}

type ResultProps = {
  tone: "success" | "warning" | "neutral"
  icon: "checkcircle" | "info" | "alert" | "clock" | "spinner"
  spin?: boolean
  head: string
  text: string
  amount?: string
  feeNote?: string
  lines?: ApiCheckout["payments"]
  retry?: boolean
  live?: boolean
  noLinks?: boolean
}

const RING: Record<ResultProps["tone"], string> = {
  success: "bg-gf-neon text-text-on-neon shadow-(--glow-neon-md)",
  warning:
    "bg-[color-mix(in_srgb,var(--gf-warning)_18%,transparent)] text-gf-warning",
  neutral: "bg-bg-3 text-fg-1",
}

/** The page's one result card */
function Result({
  tone,
  icon,
  spin,
  head,
  text,
  amount,
  feeNote,
  lines,
  retry,
  live,
  noLinks,
  e,
  links,
}: ResultProps & { e: ApiEnrollment | undefined; links: React.ReactNode }) {
  return (
    <CardBlock className="mx-auto grid w-full max-w-[640px] justify-items-center gap-4 p-[clamp(20px,4vw,40px)] text-center">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-20 place-items-center rounded-full",
          RING[tone]
        )}
      >
        <Icon
          name={icon}
          size={38}
          className={spin ? "animate-spin" : undefined}
        />
      </span>
      <h2 className="font-display text-[clamp(24px,3vw,32px)] leading-tight font-bold">
        {head}
      </h2>
      {amount ? (
        <p className="grid gap-0.5">
          <small className="text-fs-13 text-fg-3">{t.paidLabel}</small>
          <b className="text-[clamp(28px,4vw,40px)] leading-none font-semibold tabular-nums">
            {amount}
          </b>
          {feeNote ? (
            <small className="text-fs-13 text-fg-3">{feeNote}</small>
          ) : null}
        </p>
      ) : null}
      <p
        aria-live={live ? "polite" : undefined}
        className="max-w-[48ch] text-fs-16 leading-lh-relaxed text-fg-2"
      >
        {text}
      </p>
      {retry ? <Retry e={e} /> : null}
      {lines && lines.length ? (
        <div className="grid w-full gap-2 text-left">
          <h3 className="text-fs-14 font-semibold text-fg-2">{t.linesTitle}</h3>
          <ScheduleTable rows={lines} />
        </div>
      ) : null}
      {noLinks ? null : links}
    </CardBlock>
  )
}

/** Nothing was paid: offer to pay what is still due, in one go */
function Retry({
  e,
}: {
  e: (ApiEnrollment & { feeRate?: number }) | undefined
}) {
  const { pay, busy } = usePay()
  const due =
    // any enrollment not cancelled: a confirmed one still owes its later lines
    e && e.status !== "cancelled" ? payable(e.payments) : []
  if (!due.length) return null
  return (
    <Button onClick={() => pay(due)} aria-busy={busy}>
      <Icon name="wallet" size={16} /> {t.payAgain} ·{" "}
      {formatMoney(payTotals(due, e?.feeRate ?? 0).total)}
    </Button>
  )
}
