"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { CardBlock } from "@/components/shared/card-block"
import { CheckGrid } from "@/components/shared/check-grid"
import { DocItem, DocList } from "@/components/shared/doc-list"
import { EmptyState } from "@/components/shared/empty-state"
import { CheckField } from "@/components/shared/check-field"
import { FieldError, FormField } from "@/components/shared/form-field"
import { Kv, KvLines } from "@/components/shared/key-value"
import { Modal } from "@/components/shared/modal"
import { NativeSelect } from "@/components/shared/native-select"
import { Notice } from "@/components/shared/notice"
import { notify } from "@/components/shared/notify"
import { Grid2, Stack } from "@/components/shared/page-grid"
import { QueryState } from "@/components/shared/query-state"
import { SectionHead } from "@/components/shared/section-head"
import { SpecCells } from "@/components/shared/spec-cells"
import { StatusBadge } from "@/components/shared/status-badge"
import { StatusPill } from "@/components/shared/status-pill"
import { Timeline } from "@/components/shared/timeline"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DATES, LEVELS } from "@/data/catalog"
import { CLUB } from "@/data/club-copy"
import { LIVE } from "@/data/live-copy"
import { valueLabel } from "@/features/academies/card-view"
import type { AppEvent } from "@/features/applications/types"
import { useCountries } from "@/features/auth/hooks"
import { useSession } from "@/features/auth/session"
import {
  acceptApplication,
  getApplicant,
  listInbox,
  rejectApplication,
  requestInfo,
  reviewDocument,
  type ApiApplicant,
  type ApiInboxItem,
} from "@/features/club/applications-api"
import { listAllListings } from "@/features/club/api"
import { clubKeys } from "@/features/club/query-keys"
import { downloadPrivateFile } from "@/features/family/api"
import { ageOn } from "@/features/family/player-form"
import { apiFeeLabel } from "@/features/club/view-models"
import { todayISO } from "@/lib/date"
import { inView, spring } from "@/lib/motion"
import { getApiFieldErrors, getCurrentStatus } from "@/lib/api/errors"
import { isLive } from "@/lib/data-source"
import { routes } from "@/routes"

/*
 * The academy's applications in api mode (week 2 part 2, sections 11 and 12):
 * the board (GET /academy/portal/applications) and the applicant page
 * (GET …/{id}, document review, request info, accept, decline).
 */

const COLUMNS = CLUB.applications.columns
const MotionLink = motion.create(Link)
const initials = (first: string, last: string) =>
  ((first[0] ?? "") + (last[0] ?? "")).toUpperCase()
const docLabel = (type: string) =>
  LIVE.application.docLabels[type] ??
  type.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())

function InboxCard({ a }: { a: ApiInboxItem }) {
  const t = CLUB.applications
  const age = a.player.date_of_birth
    ? ageOn(a.player.date_of_birth, todayISO())
    : null
  return (
    <li>
      <MotionLink
        whileHover={{ y: -2, transition: spring }}
        whileTap={{ scale: 0.98, transition: spring }}
        href={routes.club.applicant(String(a.id))}
        className="grid gap-2 rounded-sm border border-border-1 bg-surface-elevated p-3 [transition:border-color_var(--dur-base)] hover:border-border-accent"
      >
        <div className="flex items-center gap-[10px]">
          <AvatarInitials
            initials={initials(a.player.first_name, a.player.last_name)}
            size={34}
            tone="soft"
          />
          <span className="grid min-w-0">
            <b className="text-fs-14">
              {a.player.first_name} {a.player.last_name}
            </b>
            <small className="text-fs-12 text-fg-3">
              {[
                age !== null ? String(age) : "",
                a.player.primary_position
                  ? valueLabel([], a.player.primary_position)
                  : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </small>
          </span>
          {a.status === "submitted" ? (
            <i
              aria-label={t.new}
              className="ml-auto size-2 flex-none rounded-full bg-gf-neon shadow-[0_0_0_1px_var(--fg-1)]"
            />
          ) : null}
        </div>
        <p className="text-fs-14 text-fg-3">{a.listing.title}</p>
        <div className="flex justify-between gap-2 text-fs-12 text-fg-3">
          <span>
            {a.submitted_at
              ? `${t.applied} ${DATES.fmtShort(a.submitted_at.slice(0, 10))}`
              : ""}
          </span>
          <span>
            {t.docs} {a.documents_accepted_count}/{a.documents_count}
          </span>
        </div>
      </MotionLink>
    </li>
  )
}

export function LiveInboxClient() {
  const t = CLUB.applications
  const { user } = useSession()
  const [listing, setListing] = useState("")
  const [search, setSearch] = useState("")
  const [term, setTerm] = useState("")
  useEffect(() => {
    // the search runs a moment after typing stops
    const id = setTimeout(() => setTerm(search.trim()), 350)
    return () => clearTimeout(id)
  }, [search])
  const filters = {
    listing_id: listing ? Number(listing) : undefined,
    search: term || undefined,
  }
  const enabled = user?.role === "academy"
  const listings = useQuery({
    queryKey: clubKeys.listings(),
    queryFn: listAllListings,
    enabled,
  })
  const query = useQuery({
    queryKey: clubKeys.inbox(filters),
    queryFn: () => listInbox(filters),
    enabled,
  })
  const total = query.data?.meta.total ?? 0
  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={query.data ? `${total} ${t.title.toLowerCase()}` : undefined}
      />
      <div className="flex flex-wrap items-center gap-[10px]">
        <NativeSelect
          aria-label={t.listing}
          value={listing}
          onChange={(e) => setListing(e.target.value)}
          className="w-auto min-w-[220px]"
        >
          <option value="">{t.allListings}</option>
          {(listings.data ?? [])
            .filter((l) => l.status !== "draft")
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
        </NativeSelect>
        <Input
          aria-label={t.searchLabel}
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-auto min-w-[220px]"
        />
        <p className="ml-auto flex items-center gap-1.5 text-fs-13 text-fg-3">
          <Icon name="info" size={14} /> {t.note}
        </p>
      </div>
      <QueryState
        query={{ ...query, data: query.data?.data }}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[360px] animate-pulse rounded-md bg-bg-2" />
        }
        empty={null}
      >
        {(rows) => (
          <div
            role="list"
            aria-label={t.pipeline}
            className="relative grid [scrollbar-width:thin] auto-cols-[minmax(250px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2"
          >
            {COLUMNS.map((c, i) => {
              const list = rows.filter((a) =>
                (c.statuses as readonly string[]).includes(a.status)
              )
              const count = c.statuses.reduce(
                (n, s) => n + (query.data?.meta.status_counts[s] ?? 0),
                0
              )
              return (
                <motion.section
                  {...inView(i)}
                  key={c.id}
                  role="listitem"
                  aria-labelledby={`col-${c.id}`}
                  className="grid min-h-[360px] min-w-0 grid-rows-[auto_1fr] content-start gap-[10px] rounded-md border border-border-1 bg-bg-2 p-3"
                >
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <h2
                        id={`col-${c.id}`}
                        className="font-display text-fs-18 leading-lh-snug font-bold text-fg-1"
                      >
                        {c.label}
                      </h2>
                      <span className="min-w-[22px] rounded-[99px] bg-bg-4 px-[7px] py-px text-center font-mono text-[11px] font-bold text-fg-2">
                        {count}
                      </span>
                    </div>
                    {list.length ? (
                      <ul className="grid content-start gap-2">
                        {list.map((a) => (
                          <InboxCard key={a.id} a={a} />
                        ))}
                      </ul>
                    ) : (
                      <p className="p-2 text-fs-13 text-fg-4">{t.none}</p>
                    )}
                  </>
                </motion.section>
              )
            })}
          </div>
        )}
      </QueryState>
    </>
  )
}

/* ---------------- applicant page ---------------- */

const eventsOf = (a: ApiApplicant): AppEvent[] =>
  a.timeline.map((e) => ({
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

export function LiveApplicantClient({ id }: { id: string }) {
  const t = CLUB.applicant
  const numeric = /^\d+$/.test(id) ? Number(id) : null
  const { user } = useSession()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: clubKeys.applicant(numeric ?? 0),
    queryFn: async () => {
      const a = await getApplicant(numeric ?? 0)
      // opening a submitted application started the review: refresh the board
      void queryClient.invalidateQueries({
        queryKey: [...clubKeys.all, "inbox"],
      })
      return a
    },
    enabled: numeric !== null && user?.role === "academy",
    staleTime: 0,
  })
  return (
    <QueryState
      query={query}
      errorFallback={LIVE.requestFailed}
      skeleton={<div className="h-[520px] animate-pulse rounded-lg bg-bg-2" />}
      empty={
        <EmptyState
          icon="search"
          title={t.notFoundTitle}
          text={t.notFoundText}
        />
      }
    >
      {(a) => <Applicant a={a} />}
    </QueryState>
  )
}

type Kind = "info" | "accept" | "decline"

function Applicant({ a }: { a: ApiApplicant }) {
  const t = CLUB.applicant
  const L = LIVE.academyApps
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<Kind | null>(null)
  const [busy, setBusy] = useState(false)
  const countries = useCountries()
  const p = a.player
  const name = `${p.first_name} ${p.last_name}`
  const country = (code: unknown) =>
    code ? (countries?.find((c) => c.code === code)?.name ?? String(code)) : ""
  const ageAtStart = p.date_of_birth
    ? ageOn(p.date_of_birth, a.intake.start_date)
    : null
  const reviewable = a.status === "under_review" || a.status === "info_required"
  const apply = (next: ApiApplicant) => {
    queryClient.setQueryData(clubKeys.applicant(a.id), next)
    void queryClient.invalidateQueries({ queryKey: [...clubKeys.all, "inbox"] })
  }
  const run = async (
    job: () => Promise<ApiApplicant>,
    done?: string,
    onError?: (e: unknown) => void
  ) => {
    setBusy(true)
    try {
      apply(await job())
      if (done) notify(done)
      return true
    } catch (e) {
      // refusals (intake full, …) are shown by the error toast; a status
      // refusal means someone already decided: refresh the application
      if (getCurrentStatus(e))
        void queryClient.invalidateQueries({
          queryKey: clubKeys.applicant(a.id),
        })
      onError?.(e)
      return false
    } finally {
      setBusy(false)
    }
  }
  const cell = (v: unknown) =>
    v === null || v === undefined || v === "" ? "" : String(v)
  const specs = [
    { label: t.dob, value: p.date_of_birth ? DATES.fmt(p.date_of_birth) : "" },
    { label: t.nationality, value: country(p.nationality) },
    {
      label: t.position,
      value: p.primary_position
        ? valueLabel([], String(p.primary_position))
        : "",
    },
    {
      label: t.footLabel,
      value: p.preferred_foot ? valueLabel([], String(p.preferred_foot)) : "",
    },
    { label: t.height, value: p.height_cm ? `${p.height_cm} cm` : "" },
    { label: t.currentClub, value: cell(p.current_club_academy) },
    {
      label: LIVE.program.level,
      value: p.current_level ? valueLabel(LEVELS, String(p.current_level)) : "",
    },
  ].filter((s) => s.value)
  const program =
    a.listing.age_min !== null && a.listing.age_max !== null
      ? `${a.listing.age_min}–${a.listing.age_max}`
      : ""

  return (
    <>
      <PageHeading
        title={name}
        subtitle={[a.listing.title, a.reference].filter(Boolean).join(" · ")}
        actions={
          <div className="flex flex-wrap gap-2">
            {/* every sent application has its conversation (section 14) */}
            {isLive("messages") ? (
              <ButtonLink
                href={`${routes.club.messages}?thread=${a.id}`}
                variant="secondary"
                size="sm"
              >
                <Icon name="chat" size={16} /> {LIVE.messages.title}
              </ButtonLink>
            ) : null}
            {a.status === "under_review" ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setKind("info")}
                >
                  {t.requestInfo}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setKind("decline")}
                >
                  {t.decline}
                </Button>
                <Button size="sm" onClick={() => setKind("accept")}>
                  {t.accept}
                </Button>
              </>
            ) : null}
          </div>
        }
      />
      <Grid2>
        <Stack>
          <CardBlock aria-labelledby="h-player">
            <SectionHead id="h-player" title={t.playerProfile} />
            <div className="flex items-center gap-3">
              <AvatarInitials
                initials={initials(p.first_name, p.last_name)}
                size={56}
              />
              <p className="text-fs-14 text-fg-2">
                {ageAtStart !== null ? `${ageAtStart} ${t.onStartDate}` : ""}
                {program ? ` · ${t.program} ${program}` : ""}
              </p>
            </div>
            {specs.length ? <SpecCells items={specs} /> : null}
          </CardBlock>
          {a.questions.length ? (
            <CardBlock aria-labelledby="h-answers">
              <SectionHead id="h-answers" title={t.answers} />
              <KvLines>
                {a.questions.map((q) => (
                  <Kv key={q.position} label={q.question}>
                    {q.answer === true
                      ? LIVE.application.yes
                      : q.answer === false
                        ? LIVE.application.no
                        : q.answer || t.notProvided}
                  </Kv>
                ))}
              </KvLines>
            </CardBlock>
          ) : null}
          <CardBlock aria-labelledby="h-docs">
            <SectionHead
              id="h-docs"
              title={t.documents}
              sub={reviewable ? t.documentsSub : undefined}
            />
            <DocList>
              {a.required_documents
                .filter((type) => !a.documents.some((d) => d.type === type))
                .map((type) => (
                  <DocItem
                    key={type}
                    icon="doc"
                    title={docLabel(type)}
                    sub={t.notProvided}
                    trailing={
                      <StatusPill tone="warning">{t.missing}</StatusPill>
                    }
                  />
                ))}
              {a.documents.map((d) => (
                <DocItem
                  key={d.id}
                  icon="doc"
                  title={docLabel(d.type)}
                  sub={d.original_name}
                  trailing={
                    <span className="flex flex-wrap items-center justify-end gap-1.5">
                      <StatusPill
                        tone={
                          d.review_status === "accepted"
                            ? "success"
                            : d.review_status === "needs_update"
                              ? "warning"
                              : "ghost"
                        }
                      >
                        {d.review_status === "accepted"
                          ? t.accepted
                          : d.review_status === "needs_update"
                            ? t.updateRequested
                            : LIVE.application.review.uploaded}
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
                        {L.download}
                      </Button>
                      {reviewable && d.review_status !== "accepted" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            run(() => reviewDocument(a.id, d.id, "accepted"))
                          }
                        >
                          {t.acceptDoc}
                        </Button>
                      ) : null}
                      {reviewable && d.review_status !== "needs_update" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              reviewDocument(a.id, d.id, "needs_update")
                            )
                          }
                        >
                          {t.needsUpdate}
                        </Button>
                      ) : null}
                    </span>
                  }
                />
              ))}
            </DocList>
            {!a.documents.length && !a.required_documents.length ? (
              <p className="text-fs-14 text-fg-3">{L.noDocs}</p>
            ) : null}
          </CardBlock>
        </Stack>
        <Stack>
          <CardBlock aria-labelledby="h-pipeline">
            <SectionHead id="h-pipeline" title={t.pipeline} />
            <StatusBadge status={a.status} />
            <p className="text-fs-14 text-fg-2">{t.hint[a.status]}</p>
            {a.status === "info_required" && a.info_request_note ? (
              <Notice tone="neutral" icon="info">
                {a.info_request_note}
              </Notice>
            ) : null}
            {a.decision_reason &&
            (a.status === "accepted" || a.status === "rejected") ? (
              <Notice tone="neutral" icon="info">
                {a.decision_reason}
              </Notice>
            ) : null}
          </CardBlock>
          <CardBlock aria-labelledby="h-progress">
            <SectionHead id="h-progress" title={t.progress} />
            <Timeline app={{ status: a.status, events: eventsOf(a) }} />
          </CardBlock>
          <CardBlock aria-labelledby="h-program">
            <SectionHead id="h-program" title={t.programStart} />
            <KvLines>
              <Kv label={t.programLabel}>{a.listing.title}</Kv>
              <Kv label={t.startDate}>{DATES.fmt(a.intake.start_date)}</Kv>
              {a.intake.places_left !== undefined &&
              a.intake.places_left !== null ? (
                <Kv label={t.placesLeft}>{a.intake.places_left}</Kv>
              ) : null}
              {a.listing.price ? (
                <Kv label={t.fee}>
                  {apiFeeLabel({
                    price: a.listing.price,
                    payment_frequency: a.listing.payment_frequency,
                  } as Parameters<typeof apiFeeLabel>[0])}
                </Kv>
              ) : null}
              {a.reference ? <Kv label={L.reference}>{a.reference}</Kv> : null}
            </KvLines>
          </CardBlock>
          {a.applicant.relationship !== "self" ? (
            <CardBlock aria-labelledby="h-parent">
              <SectionHead id="h-parent" title={L.parent} />
              <KvLines>
                <Kv
                  label={
                    L.relationship[a.applicant.relationship] ??
                    a.applicant.relationship
                  }
                >
                  {a.applicant.name}
                </Kv>
                <Kv label="Email">{a.applicant.email}</Kv>
                {a.consent_at ? (
                  <Kv label={L.consent}>
                    {DATES.fmt(a.consent_at.slice(0, 10))}
                  </Kv>
                ) : null}
              </KvLines>
            </CardBlock>
          ) : null}
        </Stack>
      </Grid2>
      {kind ? (
        <Decision
          a={a}
          kind={kind}
          busy={busy}
          run={run}
          onClose={() => setKind(null)}
        />
      ) : null}
    </>
  )
}

function Decision({
  a,
  kind,
  busy,
  run,
  onClose,
}: {
  a: ApiApplicant
  kind: Kind
  busy: boolean
  run: (
    job: () => Promise<ApiApplicant>,
    done?: string,
    onError?: (e: unknown) => void
  ) => Promise<boolean>
  onClose: () => void
}) {
  const t = CLUB.decision
  const L = LIVE.academyApps
  const who = `${a.player.first_name} ${a.player.last_name}`
  const O = LIVE.offer
  const standardOffer = O.standard(
    who,
    a.listing.title,
    DATES.fmt(a.intake.start_date)
  )
  // accept: the standard offer is on by default; switching it off opens an
  // editable message that starts from the standard text
  const [useStandard, setUseStandard] = useState(true)
  const [note, setNote] = useState("")
  const [docs, setDocs] = useState<string[]>([])
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const docOptions = useMemo(
    () =>
      a.documents.map((d) => ({
        value: String(d.id),
        label: `${docLabel(d.type)} · ${d.original_name}`,
      })),
    [a.documents]
  )
  // decline sends "<reason> <note>" as one reason of at most 2,000 characters
  const noteMax = kind === "decline" && reason ? 2000 - reason.length - 1 : 2000
  // 422 field errors under their box (note / message / reason / document_ids)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const onError = (e: unknown) =>
    setServerErrors(
      getApiFieldErrors(e, {
        note: "dec-note",
        message: "dec-note",
        reason: kind === "decline" ? "dec-reason" : "dec-note",
        document_ids: "dec-note",
      }).byControl
    )
  const go = async () => {
    setError("")
    setServerErrors({})
    if (kind === "info") {
      if (!note.trim()) return setError(t.info.error)
      if (
        await run(
          () => requestInfo(a.id, note.trim(), docs.map(Number)),
          L.infoSent,
          onError
        )
      )
        onClose()
    } else if (kind === "accept") {
      const message = useStandard ? standardOffer : note.trim()
      if (!message) return setServerErrors({ "dec-note": O.empty })
      if (
        await run(() => acceptApplication(a.id, message), L.accepted, onError)
      )
        onClose()
    } else {
      if (!reason) return setError(t.decline.error)
      const text = note.trim()
        ? `${reason} ${note.trim().slice(0, noteMax)}`
        : reason
      if (await run(() => rejectApplication(a.id, text), L.declined, onError))
        onClose()
    }
  }
  const title =
    kind === "info"
      ? t.info.title
      : kind === "accept"
        ? `Accept ${who}?`
        : `Decline ${who}’s application?`
  const cta =
    kind === "info"
      ? t.info.cta
      : kind === "accept"
        ? t.accept.cta
        : t.decline.cta
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button
            variant={kind === "decline" ? "danger" : "primary"}
            onClick={() => go()}
            disabled={busy}
            aria-busy={busy}
            data-autofocus
          >
            {cta}
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="grid gap-[14px]"
        onSubmit={(e) => {
          e.preventDefault()
          void go()
        }}
      >
        {kind === "decline" ? (
          <FormField
            id="dec-reason"
            label={t.decline.reason}
            hint={t.decline.reasonHint}
            required
            error={error || serverErrors["dec-reason"] || undefined}
          >
            {(p) => (
              <NativeSelect
                {...p}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">{t.decline.choose}</option>
                {t.decline.reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
        ) : null}
        {kind === "accept" ? (
          <div className="grid gap-2">
            <CheckField
              checked={useStandard}
              onChange={(e) => {
                setUseStandard(e.target.checked)
                // writing your own starts from the standard text
                if (!e.target.checked && !note) setNote(standardOffer)
              }}
            >
              {O.useStandard}
            </CheckField>
            {useStandard ? (
              <div className="grid gap-1 rounded-md border border-border-2 bg-bg-2 p-3">
                <small className="text-fs-12 font-semibold text-fg-3">
                  {O.standardLabel}
                </small>
                <p className="text-fs-14 leading-lh-relaxed text-fg-1">
                  {standardOffer}
                </p>
              </div>
            ) : null}
            {useStandard && serverErrors["dec-note"] ? (
              <FieldError id="dec-note-err">
                {serverErrors["dec-note"]}
              </FieldError>
            ) : null}
          </div>
        ) : null}
        {kind === "accept" && useStandard ? null : (
          <FormField
            id="dec-note"
            label={
              kind === "info"
                ? t.info.label
                : kind === "accept"
                  ? O.ownLabel
                  : t.decline.note
            }
            hint={kind === "accept" ? O.ownHint : undefined}
            required={kind === "info"}
            error={
              (kind === "info" && error ? error : undefined) ??
              serverErrors["dec-note"]
            }
          >
            {(p) => (
              <Textarea
                {...p}
                value={note}
                maxLength={noteMax}
                placeholder={kind === "info" ? t.info.placeholder : undefined}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </FormField>
        )}
        {kind === "info" && docOptions.length ? (
          <fieldset className="m-0 grid min-w-0 gap-1.5 border-0 p-0">
            <legend className="p-0 text-fs-14 font-semibold text-fg-1">
              {L.flagDocs}
            </legend>
            <CheckGrid options={docOptions} value={docs} onChange={setDocs} />
          </fieldset>
        ) : null}
      </form>
    </Modal>
  )
}
