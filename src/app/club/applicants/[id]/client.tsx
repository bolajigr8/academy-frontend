"use client"

import { LiveApplicantClient } from "@/components/club/live-applications"
import { isLive } from "@/lib/data-source"

import { useEffect, useRef, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { CardBlock } from "@/components/shared/card-block"
import { DocItem, DocList } from "@/components/shared/doc-list"
import { EmptyState } from "@/components/shared/empty-state"
import { Kv, KvLines } from "@/components/shared/key-value"
import { MessageThread } from "@/components/shared/message-thread"
import { notify } from "@/components/shared/notify"
import { Grid2, Stack } from "@/components/shared/page-grid"
import { PayTable } from "@/components/shared/pay-table"
import { ProfileHero } from "@/components/shared/profile-hero"
import { SectionHead } from "@/components/shared/section-head"
import { SpecCells } from "@/components/shared/spec-cells"
import { StatusBadge } from "@/components/shared/status-badge"
import { StatusExplainer } from "@/components/shared/status-explainer"
import { StatusPill } from "@/components/shared/status-pill"
import { Timeline } from "@/components/shared/timeline"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  numberColumn,
} from "@/components/ui/table"
import { DATES, DOC_TYPES } from "@/data/catalog"
import { CLUB } from "@/data/club-copy"
import { feeLabel, placesLabel } from "@/features/academies/search"
import {
  setDocumentStatus,
  transitionApplication,
} from "@/features/applications/actions"
import { COMMISSION_RATE } from "@/features/applications/flow"
import { useApplicant } from "@/features/club/hooks"
import { routes } from "@/routes"

import {
  DecisionDialog,
  type DecisionKind,
} from "@/components/club/decision-dialog"

/* Applicant review (host/applicant.html?id=) */
/* api mode: GET /academy/portal/applications/{id} + decisions (week 2 part 2) */
export function ClubApplicantClient({ id }: { id: string }) {
  return isLive("academyInbox") ? (
    <LiveApplicantClient id={id} />
  ) : (
    <DemoApplicant id={id} />
  )
}

function DemoApplicant({ id }: { id: string }) {
  const data = useApplicant(id)
  const t = CLUB.applicant
  const [modal, setModal] = useState<DecisionKind | null>(null)
  const started = useRef<string | null>(null)

  const appId = data.found ? data.app.id : null
  const status = data.found ? data.app.status : null
  /* Opening a new application starts the review (the prototype does this on load). */
  useEffect(() => {
    if (appId && status === "submitted" && started.current !== appId) {
      started.current = appId
      if (transitionApplication(appId, "under_review", "academy", ""))
        notify(t.reviewStarted)
    }
  }, [appId, status, t.reviewStarted])

  if (!data.found) {
    return (
      <>
        <PageHeading title={t.title} />
        <EmptyState
          icon="columns"
          title={t.notFoundTitle}
          text={t.notFoundText}
          cta={
            <ButtonLink href={routes.club.applications} variant="primary">
              {t.backToApplications}
            </ButtonLink>
          }
        />
      </>
    )
  }

  const {
    app,
    who,
    listing: l,
    intake,
    age,
    ageAtStart,
    eligible,
    actions,
    levelLabel,
    documentName,
    optionalLabels,
    messages,
    author,
    today,
  } = data
  const has = (to: string) => actions.includes(to as (typeof actions)[number])

  return (
    <>
      <PageHeading
        title={who.name}
        subtitle={`${l.title} · ${app.ref ?? ""}`}
        actions={
          <ButtonLink href={routes.club.applications} variant="ghost" size="sm">
            <Icon name="arrowl" size={16} />
            <span className="le-600:hidden">{t.pipeline}</span>
          </ButtonLink>
        }
      />
      <div
        role="toolbar"
        aria-label={t.decision}
        className="sticky top-[72px] z-(--amk-z-sticky) flex flex-wrap items-center gap-2 rounded-md border border-border-2 bg-glass-bg-strong p-3 shadow-(--shadow-sm) am-glass le-900:top-[60px]"
      >
        <span className="mr-auto flex items-center gap-2 text-fs-13 text-fg-2">
          <StatusBadge status={app.status} />
          {t.hint[app.status]}
        </span>
        {has("info_required") ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModal("info")}
          >
            <Icon name="info" size={15} /> {t.requestInfo}
          </Button>
        ) : null}
        {has("rejected") ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModal("decline")}
          >
            {t.decline}
          </Button>
        ) : null}
        {has("accepted") ? (
          <Button size="sm" onClick={() => setModal("accept")}>
            <Icon name="check" size={15} sw={2.4} /> {t.accept}
          </Button>
        ) : null}
        {has("enrollment_pending") ? (
          <Button size="sm" onClick={() => setModal("enroll")}>
            <Icon name="wallet" size={15} /> {t.enroll}
          </Button>
        ) : null}
        <ButtonLink external href="#thread" variant="ghost" size="sm">
          <Icon name="chat" size={15} /> {t.message}
        </ButtonLink>
      </div>

      <ProfileHero
        id="h-app"
        age={age}
        avatar={<AvatarInitials initials={who.initials} size={72} tone="ink" />}
        meta={`${who.position} · ${who.foot} ${t.foot} · ${levelLabel ?? ""}`}
        name={who.name}
        line={`${age} ${t.years} · ${who.nationality} · ${who.club}`}
        side={
          <p className="text-fs-14 text-fg-3">
            <Icon
              name={eligible ? "checkcircle" : "alert"}
              size={14}
              className="inline"
            />{" "}
            {ageAtStart} {t.onStartDate} ({DATES.fmt(intake.start)}) ·{" "}
            {t.program} {l.ageMin}–{l.ageMax}
          </p>
        }
      />

      <Grid2>
        <Stack>
          <StatusExplainer status={app.status} role="academy" />
          <CardBlock aria-labelledby="h-player">
            <SectionHead
              id="h-player"
              title={t.playerProfile}
              sub={t.playerProfileSub}
            />
            <SpecCells
              items={[
                { label: t.dob, value: DATES.fmt(who.dob) },
                { label: t.nationality, value: who.nationality },
                { label: t.position, value: who.position },
                { label: t.footLabel, value: who.foot },
                { label: t.height, value: `${who.heightCm} cm` },
                { label: t.currentClub, value: who.club },
              ]}
            />
            {who.player ? (
              <div className="mt-[14px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{t.season}</TableHead>
                      <TableHead scope="col">{t.club}</TableHead>
                      <TableHead scope="col" className={numberColumn}>
                        {t.apps}
                      </TableHead>
                      <TableHead scope="col" className={numberColumn}>
                        {t.goals}
                      </TableHead>
                      <TableHead scope="col" className={numberColumn}>
                        {t.assists}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {who.player.seasons.map((s) => (
                      <TableRow key={s.season}>
                        <TableCell>{s.season}</TableCell>
                        <TableCell>{s.club}</TableCell>
                        <TableCell className={numberColumn}>{s.apps}</TableCell>
                        <TableCell className={numberColumn}>
                          {s.goals}
                        </TableCell>
                        <TableCell className={numberColumn}>
                          {s.assists}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
            {who.video ? (
              <p className="mt-3 text-fs-14 text-fg-3">
                <Icon name="video" size={14} className="inline" /> {t.highlight}{" "}
                <span className="font-mono">
                  {who.video.replace("https://", "")}
                </span>
              </p>
            ) : null}
          </CardBlock>
          <CardBlock aria-labelledby="h-answers">
            <SectionHead id="h-answers" title={t.answers} />
            <dl className="grid gap-3">
              {l.questions.map((q) => (
                <div key={q.id}>
                  <dt className="text-fs-13 text-fg-3">{q.label}</dt>
                  <dd className="text-fs-14 text-fg-1">
                    {app.answers?.[q.id] || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </CardBlock>
          <CardBlock aria-labelledby="h-docs">
            <SectionHead id="h-docs" title={t.documents} sub={t.documentsSub} />
            <DocList>
              {(app.documents ?? []).map((d) => {
                const label = DOC_TYPES[d.type].label
                return (
                  <DocItem
                    key={d.type}
                    icon="doc"
                    title={label}
                    sub={
                      d.status === "missing" ? t.notProvided : documentName(d)
                    }
                    trailing={
                      <span className="flex flex-wrap justify-end gap-1.5">
                        {d.status === "accepted" ? (
                          <StatusPill tone="success">{t.accepted}</StatusPill>
                        ) : d.status === "missing" ? (
                          <StatusPill tone="warning">{t.missing}</StatusPill>
                        ) : d.status === "needs_update" ? (
                          <StatusPill tone="warning">
                            {t.updateRequested}
                          </StatusPill>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setDocumentStatus(app.id, d.type, "accepted")
                                notify(`${label} ${t.docAccepted}`)
                              }}
                            >
                              {t.acceptDoc}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDocumentStatus(
                                  app.id,
                                  d.type,
                                  "needs_update"
                                )
                                notify(t.docNeedsUpdate)
                              }}
                            >
                              {t.needsUpdate}
                            </Button>
                          </>
                        )}
                      </span>
                    }
                  />
                )
              })}
            </DocList>
          </CardBlock>
          <CardBlock aria-labelledby="h-thread" id="thread">
            <SectionHead id="h-thread" title={t.thread} />
            <MessageThread
              app={app}
              messages={messages}
              me="academy"
              meName={author}
            />
          </CardBlock>
        </Stack>
        <Stack>
          <CardBlock aria-labelledby="h-tl">
            <SectionHead id="h-tl" title={t.progress} />
            <Timeline app={app} />
          </CardBlock>
          <CardBlock aria-labelledby="h-intake">
            <SectionHead id="h-intake" title={t.programStart} />
            <KvLines>
              <Kv label={t.programLabel}>{l.title}</Kv>
              <Kv label={t.startDate}>{DATES.fmt(intake.start)}</Kv>
              <Kv label={t.placesLeft}>{placesLabel(intake.placesLeft)}</Kv>
              <Kv label={t.fee}>{feeLabel(l)}</Kv>
              {optionalLabels.length > 0 ? (
                <Kv label={t.optional}>{optionalLabels.join(", ")}</Kv>
              ) : null}
            </KvLines>
          </CardBlock>
          {app.payment ? (
            <CardBlock aria-labelledby="h-pay">
              <SectionHead
                id="h-pay"
                title={t.enrollmentPayment}
                sub={`${t.golaflyFee} ${Math.round(COMMISSION_RATE * 100)}% ${t.ofCollected}`}
              />
              <PayTable
                items={app.payment.items.map((it) => ({
                  ...it,
                  appId: app.id,
                  program: l.title,
                  academy: l.academy.name,
                  who: who.name,
                }))}
                today={today}
              />
            </CardBlock>
          ) : null}
          {who.guardian ? (
            <CardBlock aria-labelledby="h-guard">
              <SectionHead id="h-guard" title={t.guardian} />
              <SpecCells
                items={[
                  { label: t.name, value: who.guardian.name },
                  { label: t.email, value: who.guardian.email },
                ]}
              />
              <p className="mt-[10px] text-fs-14 text-fg-3">{t.guardianNote}</p>
            </CardBlock>
          ) : null}
        </Stack>
      </Grid2>
      <DecisionDialog
        kind={modal}
        onClose={() => setModal(null)}
        app={app}
        who={who}
        listing={l}
        intake={intake}
        today={today}
        author={author}
        onDone={notify}
      />
    </>
  )
}
