"use client"

import { LiveApplicationClient } from "@/components/family/live-application"
import { isLive } from "@/lib/data-source"

import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"

import { PayDialog } from "@/components/family/pay-dialog"
import { RespondForm } from "@/components/family/respond-form"
import { TravelHandoff } from "@/components/family/travel-handoff"
import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { CardBlock } from "@/components/shared/card-block"
import { DocItem, DocList } from "@/components/shared/doc-list"
import { EmptyState } from "@/components/shared/empty-state"
import { Kv, KvLines } from "@/components/shared/key-value"
import { KpiCard } from "@/components/shared/kpi-card"
import { MessageThread } from "@/components/shared/message-thread"
import { Modal } from "@/components/shared/modal"
import { notify } from "@/components/shared/notify"
import { Grid2, Stack } from "@/components/shared/page-grid"
import { PayTable } from "@/components/shared/pay-table"
import { SafeImage } from "@/components/shared/safe-image"
import { SectionHead } from "@/components/shared/section-head"
import { StatusBadge } from "@/components/shared/status-badge"
import { StatusExplainer } from "@/components/shared/status-explainer"
import { StatusPill } from "@/components/shared/status-pill"
import { Timeline } from "@/components/shared/timeline"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES, DOC_TYPES } from "@/data/catalog"
import { FAMILY } from "@/data/family-copy"
import { feeLabel, fmtEuro } from "@/features/academies/search"
import { transitionApplication } from "@/features/applications/actions"
import { canTransition } from "@/features/applications/flow"
import { useFamilyApplication } from "@/features/family/hooks"
import { enter } from "@/lib/motion"
import { routes } from "@/routes"

const OFFERED = ["accepted", "enrollment_pending", "enrolled"]

/* Application detail for the family (account/application.html?id=) */
/* api mode: GET /academy/me/applications/{id} (week 2 parts 1 and 2) */
export function FamilyApplicationClient({ id }: { id: string }) {
  return isLive("applications") ? (
    <LiveApplicationClient id={id} />
  ) : (
    <DemoApplication id={id} />
  )
}

function DemoApplication({ id }: { id: string }) {
  const data = useFamilyApplication(id)
  const [pay, setPay] = useState<string[] | null>(null)
  const [withdraw, setWithdraw] = useState(false)
  const t = FAMILY.detail

  if (!data.found)
    return (
      <>
        <PageHeading title={t.title} />
        <EmptyState
          icon="doc"
          title={t.notFoundTitle}
          text={t.notFoundText}
          cta={
            <ButtonLink href={routes.family.applications}>
              {t.allApplications}
            </ButtonLink>
          }
        />
      </>
    )

  const {
    app,
    listing: l,
    intake,
    player,
    totals,
    messages,
    author,
    documentOf,
    optionalLabels,
  } = data
  const pending = app.status === "enrollment_pending"
  const canWithdraw = canTransition(app.status, "cancelled", "family")
  const items = app.payment
    ? app.payment.items.map((it) => ({
        ...it,
        appId: app.id,
        program: l.title,
        academy: l.academy.name,
        who: player.firstName,
      }))
    : []

  const nextAction =
    app.status === "draft" ? (
      <ButtonLink href={routes.apply(l.id, undefined, app.id)}>
        {t.continue}
      </ButtonLink>
    ) : pending && totals ? (
      <ButtonLink external href="#payment">
        {t.payToConfirm(fmtEuro(totals.requiredDue))}
      </ButtonLink>
    ) : app.status === "info_required" ? (
      <ButtonLink external href="#respond">
        {t.reply}
      </ButtonLink>
    ) : app.status === "rejected" ? (
      <ButtonLink href={routes.academies({ type: l.type })} variant="secondary">
        {t.similar}
      </ButtonLink>
    ) : null

  return (
    <>
      <PageHeading
        title={`${player.firstName} · ${l.academy.name}`}
        subtitle={app.ref ? t.reference(app.ref) : t.draft}
        actions={
          <ButtonLink
            href={routes.family.applications}
            variant="ghost"
            size="sm"
          >
            <Icon name="arrowl" size={16} />
            <span className="le-600:hidden">{t.allApplications}</span>
          </ButtonLink>
        }
      />
      <motion.section
        {...enter(0, 12)}
        aria-label={t.head}
        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border-1 bg-surface-elevated p-[18px] le-900:grid-cols-[auto_minmax(0,1fr)] le-900:[&>:last-child]:col-[1/-1]"
      >
        <span className="relative block h-[84px] w-28 overflow-hidden rounded-sm le-480:size-[72px]">
          <SafeImage
            src={l.image}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        </span>
        <div className="grid min-w-0 gap-1">
          <div>
            <StatusBadge status={app.status} />
          </div>
          <h2 className="font-display text-fs-24 leading-[1.1] font-bold">
            <Link href={routes.academy(l.id, intake.id)}>{l.title}</Link>
          </h2>
          <p className="text-fs-14 text-fg-3">
            {l.academy.name} · {l.city}, {l.country}
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1.5 text-fs-13 text-fg-3 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5">
            <span>
              <Icon name="user" size={14} />
              {player.firstName} {player.lastName}
            </span>
            <span>
              <Icon name="calendar" size={14} />
              {t.starts} {DATES.fmt(intake.start)}
            </span>
            <span>
              <Icon name="receipt" size={14} />
              {feeLabel(l)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-[10px]">
          {app.status !== "draft" ? (
            <ButtonLink external href="#thread" variant="secondary" size="sm">
              <Icon name="chat" size={15} /> {t.message}
            </ButtonLink>
          ) : null}
          {canWithdraw ? (
            <Button variant="ghost" size="sm" onClick={() => setWithdraw(true)}>
              {t.withdraw}
            </Button>
          ) : null}
        </div>
      </motion.section>

      <Grid2>
        <Stack>
          <StatusExplainer status={app.status} action={nextAction} />
          {app.status === "info_required" ? (
            <RespondForm
              app={app}
              academy={l.academy.name}
              playerId={player.id}
              author={author}
            />
          ) : null}

          {app.payment && totals ? (
            <CardBlock
              id="payment"
              aria-labelledby="h-pay"
              className="grid scroll-mt-24 gap-[14px]"
            >
              <SectionHead
                id="h-pay"
                title={t.payment}
                sub={
                  app.status === "enrolled"
                    ? t.paymentEnrolled
                    : t.paymentPending
                }
              />
              <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-[10px] le-900:grid-cols-[1fr_1fr]">
                <KpiCard
                  compact
                  label={t.total}
                  value={fmtEuro(totals.total)}
                />
                <KpiCard compact label={t.paid} value={fmtEuro(totals.paid)} />
                <KpiCard
                  compact
                  label={pending ? t.toConfirm : t.remaining}
                  value={fmtEuro(pending ? totals.requiredDue : totals.due)}
                  tone={pending ? "neon" : undefined}
                />
              </div>
              <PayTable
                items={items}
                today={data.today}
                onPay={(it) => setPay([it.id])}
              />
              {pending ? (
                <Button
                  size="lg"
                  className="justify-self-start"
                  onClick={() => setPay([])}
                >
                  {t.payAndConfirm(fmtEuro(totals.requiredDue))}
                </Button>
              ) : null}
            </CardBlock>
          ) : null}

          {app.status === "draft" ? (
            <EmptyState
              icon="edit"
              title={t.draftTitle}
              text={t.draftText((app.lastStep ?? 0) + 1)}
              cta={
                <ButtonLink href={routes.apply(l.id, undefined, app.id)}>
                  {t.continue}
                </ButtonLink>
              }
            />
          ) : (
            <CardBlock id="thread" aria-labelledby="h-thread">
              <SectionHead id="h-thread" title={t.thread} sub={t.threadSub} />
              <MessageThread
                app={app}
                messages={messages}
                me="family"
                meName={author}
              />
            </CardBlock>
          )}

          <CardBlock aria-labelledby="h-docs">
            <SectionHead id="h-docs" title={t.documents} />
            <DocList>
              {(app.documents ?? []).map((d) => {
                const f = documentOf(d.docId)
                const tone =
                  d.status === "accepted"
                    ? "success"
                    : d.status === "missing" || d.status === "needs_update"
                      ? "warning"
                      : "info"
                const label =
                  d.status === "accepted"
                    ? t.docLabel.accepted
                    : d.status === "missing"
                      ? t.docLabel.missing
                      : d.status === "needs_update"
                        ? t.docLabel.needs_update
                        : t.docLabel.other
                return (
                  <DocItem
                    key={d.type}
                    icon="doc"
                    title={DOC_TYPES[d.type].label}
                    sub={f ? f.name : d.name || "—"}
                    trailing={<StatusPill tone={tone}>{label}</StatusPill>}
                  />
                )
              })}
            </DocList>
          </CardBlock>

          {Object.keys(app.answers ?? {}).length > 0 ? (
            <CardBlock aria-labelledby="h-answers">
              <SectionHead id="h-answers" title={t.answers} />
              <dl className="grid gap-3">
                {l.questions
                  .filter((q) => app.answers[q.id])
                  .map((q) => (
                    <div key={q.id}>
                      <dt className="text-fs-13 text-fg-3">{q.label}</dt>
                      <dd className="text-fs-14 text-fg-1">
                        {app.answers[q.id]}
                      </dd>
                    </div>
                  ))}
              </dl>
            </CardBlock>
          ) : null}
        </Stack>

        <Stack>
          <CardBlock aria-labelledby="h-tl">
            <SectionHead id="h-tl" title={t.progress} />
            <Timeline app={app} />
          </CardBlock>
          {OFFERED.includes(app.status) ? (
            <TravelHandoff city={l.city} start={intake.start} />
          ) : null}
          <CardBlock aria-labelledby="h-prog">
            <SectionHead
              id="h-prog"
              title={t.program}
              action={
                <Link
                  className="am-link"
                  href={routes.academy(l.id, intake.id)}
                >
                  {t.viewListing}
                </Link>
              }
            />
            <KvLines>
              <Kv label={t.startDate}>{DATES.fmt(intake.start)}</Kv>
              {intake.end ? (
                <Kv label={t.endDate}>{DATES.fmt(intake.end)}</Kv>
              ) : null}
              <Kv label={t.fee}>{feeLabel(l)}</Kv>
              <Kv label={t.registration}>{fmtEuro(l.fees.registrationFee)}</Kv>
              {optionalLabels.length > 0 ? (
                <Kv label={t.optional}>{optionalLabels.join(", ")}</Kv>
              ) : null}
            </KvLines>
          </CardBlock>
        </Stack>
      </Grid2>

      <PayDialog
        appId={pay ? app.id : null}
        preselect={pay ?? []}
        onClose={() => setPay(null)}
        onPaid={(status) =>
          notify(
            status === "enrolled" ? t.paid_(player.firstName) : t.paidPlain
          )
        }
      />
      <Modal
        open={withdraw}
        onClose={() => setWithdraw(false)}
        title={t.withdrawTitle(player.firstName)}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setWithdraw(false)}
              data-autofocus
            >
              {t.keep}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                transitionApplication(
                  app.id,
                  "cancelled",
                  "family",
                  t.withdrawNote
                )
                setWithdraw(false)
                notify(t.withdrawn)
              }}
            >
              {t.withdrawCta}
            </Button>
          </>
        }
      >
        <p className="text-fs-16 leading-lh-relaxed text-fg-2">
          {t.withdrawText(l.academy.name, Boolean(app.payment && totals?.paid))}
        </p>
      </Modal>
    </>
  )
}
