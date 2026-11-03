"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { PageHeading } from "@/components/layout/page-heading"
import { CardBlock } from "@/components/shared/card-block"
import { CheckList } from "@/components/shared/check-list"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { SectionHead } from "@/components/shared/section-head"
import { ButtonLink } from "@/components/ui/button-link"
import { EMPTY } from "@/data/copy"
import { FAMILY } from "@/data/family-copy"
import { LIVE } from "@/data/live-copy"
import {
  allPages,
  enrollmentKeys,
  listMyEnrollments,
  listMyPayments,
} from "@/features/enrollments/api"
import { sumByCurrency } from "@/features/enrollments/logic"
import { useSession } from "@/features/auth/session"
import { routes } from "@/routes"

import { ScheduleTable } from "./schedule-table"
import { usePay } from "./use-pay"

const t = LIVE.enrollment

/*
 * The family's Payments page (week 3 part 1, sections 3 and 4), in the
 * prototype's layout. Every schedule line across the family's enrollments
 * comes from GET /academy/me/payments (the next due first); the cards add the
 * lines up by status, per currency (amounts in different currencies are
 * never added together). Paying online arrives in part 3: no Pay button and
 * no saved payment methods yet.
 */
export function LiveFamilyPayments() {
  const { user } = useSession()
  const enabled = user?.role === "applicant"
  const payments = useQuery({
    queryKey: enrollmentKeys.myPayments(),
    // every page of lines, and the current service fee rate from the first (part 5)
    queryFn: async () => {
      const first = await listMyPayments({ page: 1 })
      const rest =
        (first.meta?.last_page ?? 1) > 1
          ? await allPages((page) =>
              page === 1 ? Promise.resolve(first) : listMyPayments({ page })
            )
          : first.data
      return { rows: rest, feeRate: first.meta?.service_fee_rate ?? 0 }
    },
    enabled,
  })
  const enrollments = useQuery({
    queryKey: enrollmentKeys.mine(),
    queryFn: () => allPages((page) => listMyEnrollments({ page })),
    enabled,
  })
  const f = FAMILY.payments
  const { pay, busy } = usePay()
  const [paying, setPaying] = useState<number | null>(null)
  const rows = payments.data?.rows ?? []
  const feeRate = payments.data?.feeRate ?? 0
  const of = (...s: string[]) =>
    rows.filter((r) => s.includes(r.status)).map((r) => r.amount)
  const activeEnrollments = (enrollments.data ?? []).filter(
    (e) => e.status !== "cancelled"
  ).length
  const anyDue = rows.some((r) => r.status === "due" || r.status === "overdue")
  const failed = payments.isError
    ? payments
    : enrollments.isError
      ? enrollments
      : null

  return (
    <>
      <PageHeading title={f.title} subtitle={f.subtitle} />
      {failed && !payments.data ? (
        <ErrorState
          message={LIVE.requestFailed}
          onRetry={() => void failed.refetch()}
        />
      ) : (
        <>
          <KpiGrid label={f.summary}>
            <KpiCard
              label={t.kpiDue}
              value={payments.data ? sumByCurrency(of("due", "overdue")) : "…"}
              sub={t.kpiDueSub}
              icon="alert"
              tone={anyDue ? "neon" : undefined}
            />
            <KpiCard
              label={t.kpiUpcoming}
              value={payments.data ? sumByCurrency(of("scheduled")) : "…"}
              sub={t.kpiUpcomingSub}
              icon="calendar"
            />
            <KpiCard
              label={t.kpiPaid}
              value={payments.data ? sumByCurrency(of("paid")) : "…"}
              sub={t.kpiPaidSub}
              icon="checkcircle"
            />
            <KpiCard
              label={t.kpiEnrollments}
              value={enrollments.data ? activeEnrollments : "…"}
              sub={t.kpiEnrollmentsSub}
              icon="doc"
            />
          </KpiGrid>
          {payments.data && rows.length === 0 ? (
            <EmptyState
              icon="wallet"
              title={EMPTY.payments.title}
              text={t.paymentsEmpty}
              cta={
                <ButtonLink href={routes.family.applications}>
                  {EMPTY.payments.cta}
                </ButtonLink>
              }
            />
          ) : payments.data ? (
            <section aria-labelledby="h-items" className="grid gap-3">
              <SectionHead
                id="h-items"
                title={f.schedule}
                sub={f.scheduleSub}
              />
              <ScheduleTable
                rows={rows}
                // one card payment for every due line of that enrollment (section 18)
                onPay={(group) => {
                  setPaying(
                    "enrollment_id" in group[0]
                      ? (group[0] as { enrollment_id: number }).enrollment_id
                      : 0
                  )
                  void pay(group)
                }}
                payingKey={busy ? paying : null}
                feeRate={feeRate}
                appHref={(r) => {
                  // the line names its enrollment; its application page shows the whole schedule
                  const e = enrollments.data?.find(
                    (x) => x.id === r.enrollment_id
                  )
                  return e
                    ? routes.family.application(String(e.application.id))
                    : routes.family.applications
                }}
              />
            </section>
          ) : (
            <div
              aria-hidden="true"
              className="h-64 animate-pulse rounded-lg bg-bg-2"
            />
          )}
          <CardBlock aria-labelledby="h-how">
            <SectionHead id="h-how" title={f.how} />
            <CheckList items={t.howPoints.map((text) => ({ text }))} />
          </CardBlock>
        </>
      )}
    </>
  )
}
