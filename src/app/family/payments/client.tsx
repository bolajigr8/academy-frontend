"use client"

import { useState } from "react"

import { PayDialog } from "@/components/family/pay-dialog"
import { PageHeading } from "@/components/layout/page-heading"
import { CardBlock } from "@/components/shared/card-block"
import { CheckList } from "@/components/shared/check-list"
import { DocItem, DocList } from "@/components/shared/doc-list"
import { EmptyState } from "@/components/shared/empty-state"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { notify } from "@/components/shared/notify"
import { Grid2 } from "@/components/shared/page-grid"
import { PayTable } from "@/components/shared/pay-table"
import { SectionHead } from "@/components/shared/section-head"
import { StatusPill } from "@/components/shared/status-pill"
import { ButtonLink } from "@/components/ui/button-link"
import { EMPTY } from "@/data/copy"
import { FAMILY } from "@/data/family-copy"
import { fmtEuro } from "@/features/academies/search"
import type { PaymentRow } from "@/features/applications/payments"
import { useFamilyPayments } from "@/features/family/hooks"
import { routes } from "@/routes"

/* Family payments (account/payments.html): every enrollment payment, plus methods */
export function FamilyPaymentsClient() {
  const p = useFamilyPayments()
  const [pay, setPay] = useState<PaymentRow | null>(null)
  const t = FAMILY.payments
  return (
    <>
      <PageHeading title={t.title} subtitle={t.subtitle} />
      <KpiGrid label={t.summary}>
        <KpiCard
          label={t.kpi.confirm[0]}
          value={fmtEuro(p.dueNow)}
          sub={t.kpi.confirm[1]}
          icon="alert"
          tone={p.dueNow ? "neon" : undefined}
        />
        <KpiCard
          label={t.kpi.upcoming[0]}
          value={fmtEuro(p.upcoming)}
          sub={t.kpi.upcoming[1]}
          icon="calendar"
        />
        <KpiCard
          label={t.kpi.paid[0]}
          value={fmtEuro(p.paid)}
          sub={t.kpi.paid[1]}
          icon="checkcircle"
        />
        <KpiCard
          label={t.kpi.apps[0]}
          value={p.withPlan}
          sub={t.kpi.apps[1]}
          icon="doc"
        />
      </KpiGrid>
      {p.items.length === 0 ? (
        <EmptyState
          icon="wallet"
          title={EMPTY.payments.title}
          text={EMPTY.payments.text}
          cta={
            <ButtonLink href={routes.family.applications}>
              {EMPTY.payments.cta}
            </ButtonLink>
          }
        />
      ) : (
        <section aria-labelledby="h-items">
          <SectionHead id="h-items" title={t.schedule} sub={t.scheduleSub} />
          <PayTable items={p.items} today={p.today} showApp onPay={setPay} />
        </section>
      )}
      <Grid2 even>
        <CardBlock aria-labelledby="h-methods">
          <SectionHead id="h-methods" title={t.methods} />
          <DocList>
            <DocItem
              icon="card"
              title={t.card}
              sub={t.cardSub}
              trailing={<StatusPill tone="success">{t.default}</StatusPill>}
            />
            <DocItem icon="bank" title={t.bank} sub={t.bankSub} />
          </DocList>
        </CardBlock>
        <CardBlock aria-labelledby="h-how">
          <SectionHead id="h-how" title={t.how} />
          <CheckList items={t.howPoints.map((text) => ({ text }))} />
        </CardBlock>
      </Grid2>
      <PayDialog
        appId={pay ? pay.appId : null}
        preselect={pay ? [pay.id] : []}
        onClose={() => setPay(null)}
        onPaid={(status) =>
          notify(status === "enrolled" ? t.paidEnrolled : t.paidPlain)
        }
      />
    </>
  )
}
