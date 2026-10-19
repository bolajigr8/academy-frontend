"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useMemo, useState } from "react"

import {
  ApplicationJourney,
  jumpTo,
  type JourneyStep,
} from "@/components/apply/application-journey"
import { TravelHandoff } from "@/components/family/travel-handoff"
import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { CardBlock } from "@/components/shared/card-block"
import { CheckField } from "@/components/shared/check-field"
import { DocItem, DocList } from "@/components/shared/doc-list"
import { EmptyState } from "@/components/shared/empty-state"
import { FormField } from "@/components/shared/form-field"
import { Kv, KvLines } from "@/components/shared/key-value"
import { Modal } from "@/components/shared/modal"
import { NativeSelect } from "@/components/shared/native-select"
import { Notice } from "@/components/shared/notice"
import { notify } from "@/components/shared/notify"
import { Grid2, Stack } from "@/components/shared/page-grid"
import { QueryState } from "@/components/shared/query-state"
import { SectionHead } from "@/components/shared/section-head"
import { StatusExplainer } from "@/components/shared/status-explainer"
import { StatusPill } from "@/components/shared/status-pill"
import { Timeline } from "@/components/shared/timeline"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DATES } from "@/data/catalog"
import { FAMILY } from "@/data/family-copy"
import { LIVE } from "@/data/live-copy"
import type { AppEvent } from "@/features/applications/types"
import {
  attachProfileFile,
  cancelApplication,
  changeIntake,
  deleteDocument,
  downloadPrivateFile,
  getApplication,
  getMeOptions,
  missingFromError,
  respondToRequest,
  saveAnswers,
  submitApplication,
  uploadDocument,
  type ApiApplication,
  PROFILE_FILE_FOR_DOC,
  type ApiAppDocument,
  type ApiAppQuestion,
  type ApiMissingForSubmission,
} from "@/features/family/api"
import { getPublicListing } from "@/features/academies/api"
import { placesLabel } from "@/features/academies/search"
import { ageOn } from "@/features/family/player-form"
import { familyKeys } from "@/features/family/query-keys"
import { useSession } from "@/features/auth/session"
import { todayISO } from "@/lib/date"
import { getApiFieldErrors, getCurrentStatus } from "@/lib/api/errors"
import { isLive } from "@/lib/data-source"
import { routes } from "@/routes"

/*
 * One application in api mode: GET /academy/me/applications/{id}; answers,
 * documents, submit (with consent for a minor), reply to an information
 * request, withdraw. Same page pieces as the prototype (account/application.html).
 */

const t = LIVE.application
const EDITABLE = new Set(["draft", "info_required"])
const CANCELLABLE = new Set([
  "draft",
  "submitted",
  "under_review",
  "info_required",
  "accepted",
  "enrollment_pending",
])

const docLabel = (type: string) =>
  t.docLabels[type] ??
  type.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())

/** The backend's timeline as the prototype Timeline's events */
function eventsOf(a: ApiApplication): AppEvent[] {
  return a.timeline.map((e) => ({
    status: e.to_status,
    at: e.at,
    by:
      e.actor_type === "applicant"
        ? "family"
        : e.actor_type === "academy"
          ? "academy"
          : "system",
    note: e.note ?? "",
  }))
}

export function LiveApplicationClient({ id }: { id: string }) {
  const numeric = /^\d+$/.test(id) ? Number(id) : null
  const { user } = useSession()
  const query = useQuery({
    queryKey: familyKeys.application(numeric ?? 0),
    queryFn: () => getApplication(numeric ?? 0),
    enabled: numeric !== null && user?.role === "applicant",
  })
  return (
    <QueryState
      query={query}
      errorFallback={LIVE.requestFailed}
      skeleton={<div className="h-[520px] animate-pulse rounded-lg bg-bg-2" />}
      empty={<EmptyState icon="search" title={t.notFound} />}
    >
      {(a) => <ApplicationView a={a} />}
    </QueryState>
  )
}

function ApplicationView({ a }: { a: ApiApplication }) {
  const queryClient = useQueryClient()
  const options = useQuery({
    queryKey: familyKeys.options(),
    queryFn: getMeOptions,
    staleTime: Infinity,
  })
  const [busy, setBusy] = useState(false)
  const [missing, setMissing] = useState<ApiMissingForSubmission[] | null>(null)
  const [consent, setConsent] = useState(false)
  const [note, setNote] = useState("")
  const [withdraw, setWithdraw] = useState(false)
  const [reason, setReason] = useState("")

  const editable = EDITABLE.has(a.status)
  const player = a.player
  const playerName = player ? `${player.first_name} ${player.last_name}` : ""
  const minor = useMemo(() => {
    const dob = player?.date_of_birth
    const age = options.data?.consent_age
    return Boolean(dob && age && ageOn(dob, todayISO()) < age)
  }, [player, options.data])

  /** Every change answers with the whole application: store it and refresh the lists */
  const apply = (next: ApiApplication) => {
    queryClient.setQueryData(familyKeys.application(a.id), next)
    void queryClient.invalidateQueries({
      queryKey: [...familyKeys.all, "applications"],
    })
    void queryClient.invalidateQueries({ queryKey: familyKeys.dashboard() })
  }
  // 422 field errors under their boxes: answers.<position>, the withdraw
  // reason, the reply note (errors.reason as a LIST is a field error; as a
  // string it is a refusal, shown by the toast only)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const run = async (job: () => Promise<ApiApplication>, done?: string) => {
    setBusy(true)
    try {
      apply(await job())
      setFieldErrors({})
      if (done) notify(done)
      return true
    } catch (e) {
      // the backend's message is shown by the error toast; "incomplete" also lists what is missing
      const list = missingFromError(e)
      if (list) setMissing(list)
      // a status refusal: the academy (or another tab) already moved it, so refresh
      if (getCurrentStatus(e))
        void queryClient.invalidateQueries({
          queryKey: familyKeys.application(a.id),
        })
      const map: Record<string, string> = {
        reason: "app-cancel-reason",
        note: "app-respond-note",
      }
      for (const q of a.questions)
        map[`answers.${q.position}`] = `app-q-${q.position}`
      setFieldErrors(getApiFieldErrors(e, map).byControl)
      return false
    } finally {
      setBusy(false)
    }
  }

  const shownMissing = missing ?? a.missing_for_submission ?? []

  // Added (Oct 2026 UX round): the draft's steps, from what the backend says is missing
  const draft = a.status === "draft"
  const lacks = (type: ApiMissingForSubmission["type"]) =>
    shownMissing.some((m) => m.type === type)
  const journey: JourneyStep[] = [
    { label: LIVE.journey.pick, done: true },
    ...(a.questions.length
      ? [
          {
            label: LIVE.journey.answers,
            done: !lacks("question"),
            target: "h-answers",
          },
        ]
      : []),
    {
      label: LIVE.journey.documents,
      done: !lacks("document"),
      target: "h-docs",
    },
    { label: LIVE.journey.send, done: false, target: "h-submit" },
  ]
  const firstOpen = journey.findIndex((s) => !s.done)
  const journeyAt = firstOpen === -1 ? journey.length - 1 : firstOpen
  /** where a "still needed" item is fixed: its question, the documents or the player profile */
  const fixTarget = (m: ApiMissingForSubmission): string[] | null =>
    m.type === "question"
      ? [`app-q-${m.key}`, "h-answers"]
      : m.type === "document"
        ? ["h-docs"]
        : null

  return (
    <>
      <PageHeading
        title={a.listing.title}
        subtitle={[a.listing.academy.name, playerName]
          .filter(Boolean)
          .join(" · ")}
        actions={
          a.status !== "draft" || CANCELLABLE.has(a.status) ? (
            <>
              {/* the conversation exists once the application is sent (section 14) */}
              {isLive("messages") && a.status !== "draft" ? (
                <ButtonLink
                  href={routes.family.messages(String(a.id))}
                  variant="secondary"
                  size="sm"
                >
                  <Icon name="chat" size={16} /> {LIVE.messages.title}
                </ButtonLink>
              ) : null}
              {CANCELLABLE.has(a.status) ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setWithdraw(true)}
                >
                  {t.cancel}
                </Button>
              ) : null}
            </>
          ) : null
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Link
          href={routes.family.applications}
          className="inline-flex items-center gap-1.5 text-fs-14 font-semibold text-fg-2 hover:text-fg-1"
        >
          <Icon name="arrowl" size={16} /> {LIVE.journey.allApplications}
        </Link>
        {draft ? (
          <ApplicationJourney steps={journey} current={journeyAt} />
        ) : null}
      </div>
      <Grid2>
        <Stack>
          <StatusExplainer status={a.status} />
          {a.status === "info_required" ? (
            <CardBlock aria-labelledby="h-respond">
              <SectionHead id="h-respond" title={t.infoLead} />
              {a.info_request_note ? (
                <p className="text-fs-16 leading-lh-relaxed text-fg-1">
                  {a.info_request_note}
                </p>
              ) : null}
              {missing?.length ? (
                <div role="status" className="grid gap-1 text-fs-14 text-fg-2">
                  <p className="font-semibold text-fg-1">{t.missingLead}</p>
                  <ul className="grid gap-1">
                    {missing.map((m) => (
                      <li
                        key={`${m.type}-${m.key}`}
                        className="flex items-center gap-1.5"
                      >
                        <Icon name="alert" size={14} />{" "}
                        {m.type === "document"
                          ? docLabel(String(m.key))
                          : m.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <FormField
                id="app-respond-note"
                label={t.respondNote}
                error={fieldErrors["app-respond-note"]}
              >
                {(p) => (
                  <Textarea
                    {...p}
                    value={note}
                    maxLength={2000}
                    onChange={(e) => setNote(e.target.value)}
                  />
                )}
              </FormField>
              <Button
                className="justify-self-start"
                disabled={busy}
                aria-busy={busy}
                onClick={() =>
                  run(() => respondToRequest(a.id, note), t.responded).then(
                    (ok) => ok && setNote("")
                  )
                }
              >
                <Icon name="send" size={16} /> {t.respond}
              </Button>
            </CardBlock>
          ) : null}
          {a.decision_reason &&
          (a.status === "accepted" || a.status === "rejected") ? (
            <Notice
              tone={a.status === "accepted" ? "success" : "neutral"}
              icon="info"
            >
              <b>{t.decisionLead}</b> {a.decision_reason}
            </Notice>
          ) : null}
          {draft ? (
            <>
              {/* a draft is filled top to bottom: questions, documents, then send */}
              {a.questions.length ? (
                <AnswersCard
                  a={a}
                  editable={editable}
                  busy={busy}
                  run={run}
                  errors={fieldErrors}
                />
              ) : null}
              <DocumentsCard a={a} editable={editable} busy={busy} run={run} />
              {draft ? (
                <CardBlock aria-labelledby="h-submit">
                  <SectionHead id="h-submit" title={t.submitTitle} />
                  {shownMissing.length ? (
                    <div
                      id="app-missing"
                      role="status"
                      className="grid gap-1.5 text-fs-14 text-fg-2"
                    >
                      <p className="font-semibold text-fg-1">{t.missingLead}</p>
                      <ul className="grid gap-1">
                        {shownMissing.map((m) => (
                          <li
                            key={`${m.type}-${m.key}`}
                            className="flex items-center gap-1.5"
                          >
                            <Icon name="alert" size={14} />{" "}
                            {fixTarget(m) ? (
                              <button
                                type="button"
                                className="am-link text-left"
                                onClick={() => jumpTo(...(fixTarget(m) ?? []))}
                              >
                                {m.type === "document"
                                  ? docLabel(String(m.key))
                                  : m.label}
                              </button>
                            ) : m.type === "document" ? (
                              docLabel(String(m.key))
                            ) : (
                              m.label
                            )}
                            {m.type === "profile" && player ? (
                              <a
                                className="ml-1 am-link"
                                href={routes.family.players(String(player.id))}
                              >
                                {LIVE.players.edit}
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {minor ? (
                    <CheckField
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    >
                      {t.consent(player?.first_name ?? "")}
                    </CheckField>
                  ) : null}
                  <Button
                    className="justify-self-start"
                    disabled={busy || (minor && !consent)}
                    aria-busy={busy}
                    onClick={() =>
                      run(
                        () => submitApplication(a.id, minor && consent),
                        t.submitted
                      )
                    }
                  >
                    <Icon name="send" size={16} /> {t.submit}
                  </Button>
                </CardBlock>
              ) : null}
            </>
          ) : (
            <>
              <DocumentsCard a={a} editable={editable} busy={busy} run={run} />
              {a.questions.length ? (
                <AnswersCard
                  a={a}
                  editable={editable}
                  busy={busy}
                  run={run}
                  errors={fieldErrors}
                />
              ) : null}
            </>
          )}
        </Stack>
        <Stack>
          <CardBlock aria-labelledby="h-tl">
            <SectionHead id="h-tl" title={LIVE.application.summary} />
            <KvLines>
              {a.reference ? <Kv label={t.reference}>{a.reference}</Kv> : null}
              <Kv label={t.academy}>{a.listing.academy.name}</Kv>
              <Kv label={t.program}>{a.listing.title}</Kv>
              <Kv label={t.starts}>
                <span className="inline-flex flex-wrap items-center gap-2">
                  {DATES.fmt(a.intake.start_date)}
                  {draft ? <ChangeIntake a={a} busy={busy} run={run} /> : null}
                </span>
              </Kv>
              {playerName ? <Kv label={t.player}>{playerName}</Kv> : null}
              {a.submitted_at ? (
                <Kv label={t.sent}>{DATES.fmt(a.submitted_at.slice(0, 10))}</Kv>
              ) : null}
            </KvLines>
          </CardBlock>
          <CardBlock aria-labelledby="h-progress">
            <SectionHead id="h-progress" title={FAMILY.detail.progress} />
            <Timeline app={{ status: a.status, events: eventsOf(a) }} />
          </CardBlock>
          {a.travel ? (
            <TravelHandoff
              city={a.travel.city}
              start={a.travel.arrive_before}
              links={a.travel.links}
            />
          ) : null}
        </Stack>
      </Grid2>
      <Modal
        open={withdraw}
        onClose={() => setWithdraw(false)}
        title={t.cancelTitle}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setWithdraw(false)}
              disabled={busy}
            >
              {t.keep}
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              aria-busy={busy}
              data-autofocus
              onClick={() =>
                run(() => cancelApplication(a.id, reason), t.cancelled).then(
                  (ok) => ok && setWithdraw(false)
                )
              }
            >
              {t.cancelConfirm}
            </Button>
          </>
        }
      >
        <p className="text-fs-16 leading-lh-relaxed text-fg-2">
          {t.cancelText}
        </p>
        <FormField
          id="app-cancel-reason"
          label={t.cancelReason}
          error={fieldErrors["app-cancel-reason"]}
        >
          {(p) => (
            <Textarea
              {...p}
              value={reason}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </FormField>
      </Modal>
    </>
  )
}

type Run = (
  job: () => Promise<ApiApplication>,
  done?: string
) => Promise<boolean>

function DocumentsCard({
  a,
  editable,
  busy,
  run,
}: {
  a: ApiApplication
  editable: boolean
  busy: boolean
  run: Run
}) {
  const types = [...a.required_documents, "other"]
  const tone = (d: ApiAppDocument) =>
    d.review_status === "accepted"
      ? "success"
      : d.review_status === "needs_update"
        ? "warning"
        : "ghost"
  // which picker is uploading (type, or "replace-<id>"): it shows a spinner
  const [uploading, setUploading] = useState<string | null>(null)
  const upload = (
    key: string,
    type: string,
    file: File,
    replacing?: ApiAppDocument
  ) => {
    setUploading(key)
    return run(async () => {
      // "Replace" = delete the flagged document, then upload the new file (part 2, section 13)
      if (replacing) await deleteDocument(a.id, replacing.id)
      return uploadDocument(a.id, type, file)
    }).finally(() => setUploading(null))
  }
  const picker = (type: string, label: string, replacing?: ApiAppDocument) => {
    const key = replacing ? `replace-${replacing.id}` : type
    const active = uploading === key
    return (
      <label
        aria-busy={active || undefined}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-border-2 px-3 py-1.5 text-fs-13 font-semibold text-fg-1 focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-amk-accent-ink hover:bg-tint-neon-1 aria-busy:cursor-progress aria-busy:opacity-85"
      >
        {active ? (
          <Icon name="spinner" size={14} className="animate-spin" />
        ) : (
          <Icon name="upload" size={14} />
        )}{" "}
        {label}
        <input
          type="file"
          className="am-sr"
          disabled={busy}
          accept="application/pdf,image/jpeg,image/png"
          aria-label={`${label}: ${docLabel(type)}`}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void upload(key, type, file, replacing)
            e.target.value = ""
          }}
        />
      </label>
    )
  }
  // a paper the player's profile already holds can be reused in one tap
  const profileFile = (type: string) => {
    const field = PROFILE_FILE_FOR_DOC[type]
    const f = field ? a.player?.files?.[field] : undefined
    return f?.uploaded && f.download_url ? f.download_url : null
  }
  const fromProfile = (type: string, url: string) => {
    setUploading(`profile-${type}`)
    return run(
      () => attachProfileFile(a.id, type, url),
      LIVE.players.fromProfileDone
    ).finally(() => setUploading(null))
  }
  const playerFirst = a.player?.first_name ?? ""
  return (
    <CardBlock aria-labelledby="h-docs">
      <SectionHead id="h-docs" title={t.documents} />
      <DocList>
        {types.map((type) => {
          const docs = a.documents.filter((d) => d.type === type)
          if (!docs.length)
            return type === "other" && !editable ? null : (
              <DocItem
                key={type}
                icon="doc"
                title={docLabel(type)}
                sub={LIVE.players.notUploaded}
                trailing={
                  editable ? (
                    <span className="flex flex-wrap items-center gap-1.5">
                      {profileFile(type) ? (
                        <Button
                          size="sm"
                          disabled={busy}
                          aria-busy={uploading === `profile-${type}`}
                          onClick={() =>
                            fromProfile(type, profileFile(type) ?? "")
                          }
                        >
                          <Icon name="user" size={14} />{" "}
                          {LIVE.players.fromProfile(playerFirst)}
                        </Button>
                      ) : null}
                      {picker(type, t.upload)}
                    </span>
                  ) : undefined
                }
              />
            )
          return docs.map((d) => (
            <DocItem
              key={d.id}
              icon="doc"
              title={docLabel(type)}
              sub={d.original_name}
              trailing={
                <span className="flex flex-wrap items-center justify-end gap-1.5">
                  <StatusPill tone={tone(d)}>
                    {t.review[d.review_status]}
                  </StatusPill>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      downloadPrivateFile(
                        d.download_url,
                        d.original_name
                      ).catch(() => undefined)
                    }
                  >
                    {t.download}
                  </Button>
                  {editable && d.review_status === "needs_update"
                    ? picker(type, t.replace, d)
                    : null}
                  {editable && d.review_status !== "accepted" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => run(() => deleteDocument(a.id, d.id))}
                    >
                      {t.remove}
                    </Button>
                  ) : null}
                </span>
              }
            />
          ))
        })}
      </DocList>
    </CardBlock>
  )
}

function AnswersCard({
  a,
  editable,
  busy,
  run,
  errors = {},
}: {
  a: ApiApplication
  editable: boolean
  busy: boolean
  run: Run
  /** 422 answers.<position> messages, keyed app-q-<position> */
  errors?: Record<string, string>
}) {
  const [values, setValues] = useState<Record<number, string | boolean | null>>(
    () => Object.fromEntries(a.questions.map((q) => [q.position, q.answer]))
  )
  const changed = a.questions.filter((q) => values[q.position] !== q.answer)
  const field = (q: ApiAppQuestion) => {
    const id = `app-q-${q.position}`
    const v = values[q.position]
    const set = (x: string | boolean | null) =>
      setValues((s) => ({ ...s, [q.position]: x }))
    return (
      <FormField
        key={q.position}
        id={id}
        label={q.question}
        required={q.required}
        error={errors[id]}
      >
        {(p) =>
          q.type === "long_text" ? (
            <Textarea
              {...p}
              value={typeof v === "string" ? v : ""}
              maxLength={5000}
              onChange={(e) => set(e.target.value)}
            />
          ) : q.type === "text" ? (
            <Input
              {...p}
              value={typeof v === "string" ? v : ""}
              maxLength={1000}
              onChange={(e) => set(e.target.value)}
            />
          ) : (
            <NativeSelect
              {...p}
              value={
                v === true
                  ? "true"
                  : v === false
                    ? "false"
                    : typeof v === "string"
                      ? v
                      : ""
              }
              onChange={(e) =>
                set(
                  q.type === "yes_no"
                    ? e.target.value === ""
                      ? null
                      : e.target.value === "true"
                    : e.target.value || null
                )
              }
            >
              <option value="">{t.choose}</option>
              {q.type === "yes_no" ? (
                <>
                  <option value="true">{t.yes}</option>
                  <option value="false">{t.no}</option>
                </>
              ) : (
                (q.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))
              )}
            </NativeSelect>
          )
        }
      </FormField>
    )
  }
  return (
    <CardBlock aria-labelledby="h-answers">
      <SectionHead id="h-answers" title={t.answers} />
      {editable ? (
        <form
          noValidate
          className="grid gap-[14px]"
          onSubmit={(e) => {
            e.preventDefault()
            void run(
              () =>
                saveAnswers(
                  a.id,
                  Object.fromEntries(
                    changed.map((q) => [
                      String(q.position),
                      values[q.position] ?? null,
                    ])
                  )
                ),
              t.answersSaved
            )
          }}
        >
          {a.questions.map(field)}
          <Button
            type="submit"
            variant="secondary"
            className="justify-self-start"
            disabled={busy || changed.length === 0}
          >
            {t.saveAnswers}
          </Button>
        </form>
      ) : (
        <KvLines>
          {a.questions.map((q) => (
            <Kv key={q.position} label={q.question}>
              {q.answer === true
                ? t.yes
                : q.answer === false
                  ? t.no
                  : q.answer || t.notAnswered}
            </Kv>
          ))}
        </KvLines>
      )}
    </CardBlock>
  )
}

/*
 * A draft can move to another start date of the same listing (week 2 part 1,
 * section 5). The choices are the listing's upcoming intakes from the public
 * listing (GET /academy/listings/{slug}); the backend checks the move like a
 * new application and its refusal is shown by the error toast.
 */
function ChangeIntake({
  a,
  busy,
  run,
}: {
  a: ApiApplication
  busy: boolean
  run: Run
}) {
  const c = LIVE.changeIntake
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState("")
  const listing = useQuery({
    queryKey: ["public-listing", a.listing.slug],
    queryFn: () => getPublicListing(a.listing.slug),
    enabled: open,
  })
  const others = (listing.data?.intakes ?? []).filter(
    (i) => i.id !== a.intake.id
  )
  const save = async () => {
    if (!choice) return
    if (await run(() => changeIntake(a.id, Number(choice)), c.done))
      setOpen(false)
  }
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setChoice("")
          setOpen(true)
        }}
      >
        <Icon name="calendar" size={14} /> {c.open}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={c.title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {c.cancel}
            </Button>
            <Button
              onClick={() => save()}
              disabled={!choice || busy}
              data-autofocus
            >
              {c.save}
            </Button>
          </>
        }
      >
        <p className="text-fs-14 text-fg-2">{c.lead}</p>
        {listing.isPending ? (
          <p className="text-fs-14 text-fg-3" aria-busy="true">
            …
          </p>
        ) : others.length ? (
          <FormField id="app-change-intake" label={c.label} required>
            {(p) => (
              <NativeSelect
                {...p}
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
              >
                <option value="">{t.choose}</option>
                {others.map((i) => (
                  <option key={i.id} value={i.id}>
                    {c.option(
                      DATES.fmt(i.start_date),
                      i.label,
                      i.places_left === null ? "" : placesLabel(i.places_left)
                    )}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
        ) : (
          <p className="text-fs-14 text-fg-3">{c.none}</p>
        )}
      </Modal>
    </>
  )
}
