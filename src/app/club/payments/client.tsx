"use client"

import { PageHeading } from "@/components/layout/page-heading"
import { CardBlock } from "@/components/shared/card-block"
import { CheckList } from "@/components/shared/check-list"
import { EmptyState } from "@/components/shared/empty-state"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PayTable } from "@/components/shared/pay-table"
import { SectionHead } from "@/components/shared/section-head"
import { DATES } from "@/data/catalog"
import { CLUB } from "@/data/club-copy"
import { fmtEuro } from "@/features/academies/search"
import { COMMISSION_RATE } from "@/features/applications/flow"
import { useClubPayments } from "@/features/club/hooks"

/* Academy payments (host/payments.html): collected, outstanding, Golafly fee, net payout */
export function ClubPaymentsClient() {
  const p = useClubPayments()
  const t = CLUB.payments
  const rate = Math.round(COMMISSION_RATE * 100)
  return (
    <>
      <PageHeading title={t.title} subtitle={t.subtitle} />
      <KpiGrid label={t.summary}>
        <KpiCard
          label={t.collected}
          value={fmtEuro(p.collected)}
          sub={t.collectedSub}
          icon="wallet"
          tone="ink"
        />
        <KpiCard
          label={t.outstanding}
          value={fmtEuro(p.outstanding)}
          sub={t.outstandingSub}
          icon="clock"
        />
        <KpiCard
          label={`${t.fee} · ${rate}%`}
          value={fmtEuro(p.fee)}
          sub={t.feeSub}
          icon="receipt"
        />
        <KpiCard
          label={t.net}
          value={fmtEuro(p.net)}
          sub={`${t.nextPayout} ${DATES.fmt(p.nextPayout)}`}
          icon="bank"
          tone="neon"
        />
      </KpiGrid>
      {p.items.length === 0 ? (
        <EmptyState icon="wallet" title={t.emptyTitle} text={t.emptyText} />
      ) : (
        <section aria-labelledby="h-items">
          <SectionHead id="h-items" title={t.items} sub={t.itemsSub} />
          <PayTable items={p.items} today={p.today} showApp />
        </section>
      )}
      <CardBlock aria-labelledby="h-model">
        <SectionHead id="h-model" title={t.model} />
        <CheckList
          items={[
            { text: t.modelPoints[0] },
            { text: `${t.modelFeeLead} ${rate}% ${t.modelFee}` },
            { text: t.modelPoints[1] },
            { text: t.modelPoints[2] },
          ]}
        />
      </CardBlock>
    </>
  )
}
