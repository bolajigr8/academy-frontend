"use client"

import { useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { EmptyState } from "@/components/shared/empty-state"
import {
  ErrorSummary,
  type ErrorSummaryHandle,
} from "@/components/shared/error-summary"
import { Kv, KvLines } from "@/components/shared/key-value"
import { ListingCard } from "@/components/shared/listing-card"
import { Meter } from "@/components/shared/meter"
import { notify } from "@/components/shared/notify"
import { QueryState } from "@/components/shared/query-state"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { EDITOR } from "@/data/editor-copy"
import { LIVE } from "@/data/live-copy"
import { cardFromApi } from "@/features/academies/card-view"
import {
  getListing,
  listingAction,
  missingItems,
  type ApiAcademy,
  type ApiListing,
  type ApiMissingItem,
  type ApiOptions,
} from "@/features/club/api"
import { Notice } from "@/components/shared/notice"
import { useLiveEditorData } from "@/features/club/hooks"
import {
  amountMinor,
  intakeDates,
  newDraft,
  draftFromApi,
  validateDraft,
  type LiveDraft,
} from "@/features/club/live-draft"
import {
  mergeSaved,
  readProgress,
  resumeStep,
  saveStep,
  stepsDone,
  writeProgress,
  type EditorProgress,
} from "@/features/club/live-editor"
import { clubKeys } from "@/features/club/query-keys"
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api/errors"
import { todayISO } from "@/lib/date"
import { formatMoney } from "@/lib/money"
import { easeOut, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"
import { WIZ_STEPS } from "@/features/club/wizard"

import {
  LiveStepAbout,
  LiveStepAges,
  LiveStepAvailability,
  LiveStepDetails,
  LiveStepImages,
  LiveStepIncluded,
  LiveStepPreview,
  LiveStepPricing,
  LiveStepRequirements,
  LiveStepSubmit,
} from "./live-steps"

/** Backend field -> the editor's control id, for 422 field errors */
const SERVER_FIELDS: Record<string, string> = {
  academy_id: "amk-w-academy",
  title: "amk-w-title",
  description: "amk-w-summary",
  images: "amk-w-photos",
  delete_image_ids: "amk-w-photos",
  academy_type: "amk-w-type",
  playing_level: "amk-w-level",
  gender: "amk-w-gender",
  training_frequency: "amk-w-frequency",
  methodology: "amk-w-method",
  competition: "amk-w-comp",
  weekly_schedule: "amk-w-day-monday",
  age_min: "amk-w-ages",
  age_max: "amk-w-ages",
  requirements: "amk-w-req",
  terms: "amk-w-terms",
  price_minor: "amk-w-amount",
  currency: "amk-w-currency",
  payment_frequency: "amk-w-per",
  deposit_minor: "amk-w-deposit",
  registration_fee_minor: "amk-w-reg",
  duration_value: "amk-w-weeks",
  duration_unit: "amk-w-unit",
  label: "amk-w-intakes",
  start_date: "amk-w-intakes",
  end_date: "amk-w-intakes",
  application_deadline: "amk-w-intakes",
  applications_open_at: "amk-w-intakes",
  capacity: "amk-w-intakes",
  required_documents: "amk-w-docs",
}

/** The prototype's step names; the last one as the contract asks ("Submit for review") */
const STEPS = WIZ_STEPS.map((s, i) =>
  i === WIZ_STEPS.length - 1 ? LIVE.listingStatus2.submitStep : s
)

const ERROR_LABELS: Record<string, string> = {
  ...EDITOR.labels,
  "amk-w-academy": LIVE.editorUi.academy,
  "amk-w-reg": LIVE.editorUi.registration,
  "amk-w-currency": LIVE.editorUi.currency,
  "amk-w-per": LIVE.editorUi.frequency,
  "amk-w-unit": LIVE.editorUi.durationUnit,
  "amk-w-frequency": LIVE.editorUi.trainingFrequency,
  "amk-w-step": EDITOR.stepsLabel,
  "amk-w-req": EDITOR.ages.requirements,
  "amk-w-terms": LIVE.editorUi.terms,
}

/** 422 errors keyed by control id; question errors land on their row */
function serverErrors(error: unknown): Record<string, string> {
  const { byControl, unmatched } = getApiFieldErrors(error, SERVER_FIELDS)
  const out = { ...byControl }
  if (Object.keys(out).length === 0)
    out["amk-w-step"] =
      unmatched[0] ?? getApiErrorMessage(error, LIVE.requestFailed)
  return out
}

/** Question errors arrive as application_questions.<n>.<field> */
function questionErrors(error: unknown): Record<string, string> {
  const map: Record<string, string> = {}
  for (let n = 0; n < 20; n++) {
    map[`application_questions.${n}.question`] = `amk-w-q-${n}`
    map[`application_questions.${n}.type`] = `amk-w-q-${n}`
    map[`application_questions.${n}.options`] = `amk-w-q-${n}`
    for (let o = 0; o < 20; o++)
      map[`application_questions.${n}.options.${o}`] = `amk-w-q-${n}`
  }
  return getApiFieldErrors(error, map).byControl
}

/*
 * Create / edit listing in api mode (host/listing-edit.html layout).
 * Loads GET /options, /academies, /organization and, when editing,
 * /listings/{id}; each "Save and continue" saves that step to the backend.
 */
export function LiveListingWizard({ id }: { id: number | null }) {
  const query = useLiveEditorData(id)
  return (
    <QueryState
      query={query}
      errorFallback={LIVE.requestFailed}
      skeleton={
        <div className="grid gap-4">
          <div className="h-[60px] animate-pulse rounded-lg bg-bg-2" />
          <div className="h-[520px] animate-pulse rounded-lg bg-bg-2" />
        </div>
      }
      isEmpty={(data) => data.academies.length === 0}
      empty={
        <EmptyState
          icon="building"
          title={LIVE.noAcademy.title}
          text={LIVE.noAcademy.text}
          cta={
            <ButtonLink href={routes.club.editProfile} variant="primary">
              {LIVE.profileForm.createAcademy}
            </ButtonLink>
          }
        />
      }
    >
      {(data) => (
        <Editor
          options={data.options}
          academies={data.academies}
          orgName={data.orgName}
          listing={data.listing}
        />
      )}
    </QueryState>
  )
}

function Editor({
  options,
  academies,
  orgName,
  listing,
}: {
  options: ApiOptions
  academies: ApiAcademy[]
  orgName: string
  listing: ApiListing | null
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const today = useMemo(() => todayISO(), [])
  const [d, setD] = useState<LiveDraft>(() =>
    listing
      ? draftFromApi(listing, options)
      : newDraft(academies[0]?.id ?? null, options)
  )
  const [saved, setSaved] = useState<ApiListing | null>(listing)
  // progress this browser remembers per listing: the last step and steps saved
  const [progress, setProgress] = useState<EditorProgress>(() =>
    readProgress(listing?.id ?? null)
  )
  // a reopened listing continues where the user stopped (else the first unfinished step)
  const [step, setStep] = useState(() =>
    listing
      ? resumeStep(
          stepsDone(listing, todayISO(), readProgress(listing.id)),
          readProgress(listing.id)
        )
      : 0
  )
  // ticks come from what the backend saved, never from the step's position
  const done = stepsDone(saved, today, progress)
  // remember the step the user is on (storage only, no state change)
  const savedSteps = progress.saved
  useEffect(() => {
    writeProgress(saved?.id ?? null, { last: step, saved: savedSteps })
  }, [step, saved?.id, savedSteps])
  /** moving to a step; the preview counts as done once seen */
  const moveTo = (i: number) => {
    if (i === 8)
      setProgress((p) =>
        p.saved.includes(8) ? p : { ...p, saved: [...p.saved, 8] }
      )
    setStep(i)
  }
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [missing, setMissing] = useState<ApiMissingItem[] | null>(null)
  const headRef = useRef<HTMLHeadingElement>(null)
  const sumRef = useRef<ErrorSummaryHandle>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    headRef.current?.focus()
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [step])

  const set = (patch: Partial<LiveDraft>) => setD((x) => ({ ...x, ...patch }))
  const showErrors = (e: Record<string, string>) => {
    setErrors(e)
    requestAnimationFrame(() => sumRef.current?.focus())
  }

  /** Saves the current step; resolves true when the backend accepted it */
  const save = async (atStep: number): Promise<boolean> => {
    if (d.id === null && !d.title.trim()) {
      setStep(0)
      showErrors({ "amk-w-title": "Give the program a name" })
      return false
    }
    setSaving(true)
    const before = d.status
    try {
      const result = await saveStep(atStep, d, today)
      // contract section 12: editing price, ages or requirements of a live
      // listing sends it back to review
      if (
        (before === "published" || before === "paused") &&
        result.status === "pending_review"
      )
        notify(LIVE.listingStatus2.backToReview)
      setD((x) => mergeSaved(atStep, x, result, options))
      setSaved(result)
      setProgress((p) =>
        p.saved.includes(atStep) ? p : { ...p, saved: [...p.saved, atStep] }
      )
      queryClient.setQueryData(clubKeys.listing(result.id), result)
      void queryClient.invalidateQueries({ queryKey: clubKeys.listings() })
      if (d.id === null)
        window.history.replaceState(
          null,
          "",
          routes.club.editListing(String(result.id))
        )
      return true
    } catch (error) {
      showErrors({ ...serverErrors(error), ...questionErrors(error) })
      // a failed start-date save may have applied part of the changes
      const listingId = d.id
      if (atStep === 5 && listingId !== null) {
        const fresh = await queryClient
          .fetchQuery({
            queryKey: clubKeys.listing(listingId),
            queryFn: () => getListing(listingId),
            staleTime: 0,
          })
          .catch(() => null)
        if (fresh) setD((x) => mergeSaved(5, x, fresh, options))
      }
      return false
    } finally {
      setSaving(false)
    }
  }

  const next = async () => {
    const e = validateDraft(step, d)
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => sumRef.current?.focus())
      return
    }
    if (await save(step)) moveTo(Math.min(step + 1, 9))
  }
  const goTo = (i: number) => {
    setErrors({})
    moveTo(i)
  }
  /** POST /academy/portal/listings/{id}/submit; a 422 lists what is missing */
  const submit = async () => {
    if (d.id === null) {
      setStep(0)
      showErrors({ "amk-w-title": "Give the program a name" })
      return
    }
    setSubmitting(true)
    setMissing(null)
    setErrors({})
    try {
      const { listing: result, message } = await listingAction(d.id, "submit")
      setD((x) => ({ ...x, status: result.status }))
      setSaved(result)
      queryClient.setQueryData(clubKeys.listing(result.id), result)
      void queryClient.invalidateQueries({ queryKey: clubKeys.listings() })
      notify(message)
    } catch (error) {
      const list = missingItems(error)
      if (list) {
        setMissing(list)
        requestAnimationFrame(() =>
          document.getElementById("amk-w-missing")?.focus()
        )
      } else showErrors(serverErrors(error))
    } finally {
      setSubmitting(false)
    }
  }
  const exit = async () => {
    // nothing to keep yet: a new listing without a name was never created
    if (d.id === null && !d.title.trim()) {
      router.push(routes.club.listings)
      return
    }
    if (step >= 8 || (await save(step))) router.push(routes.club.listings)
  }

  const monthOpts = Array.from({ length: 14 }, (_, k) =>
    DATES.monthKey(DATES.monthStart(today, k + 1))
  )
  const price = amountMinor(d.price, d.currency) ?? 0
  const deposit = amountMinor(d.deposit, d.currency) ?? 0
  const registration = amountMinor(d.registrationFee, d.currency) ?? 0
  const fmt = (minor: number) =>
    formatMoney({ amount_minor: minor, amount: "", currency: d.currency })
  const rolling = d.paymentFrequency === "monthly"
  const pricingSummary =
    price > 0
      ? [
          { label: EDITOR.pricing.programTotal, value: fmt(price) },
          ...(deposit > 0
            ? [
                { label: EDITOR.pricing.depositLine, value: fmt(deposit) },
                { label: EDITOR.pricing.balance, value: fmt(price - deposit) },
              ]
            : []),
        ]
      : []
  const intakeLine = d.intakes
    .map((i) => {
      const dates =
        i.saved && i.saved.start_date.slice(0, 7) === i.month
          ? {
              start_date: i.saved.start_date,
              application_deadline: i.saved.application_deadline,
            }
          : intakeDates(d, i.month, today)
      const places = i.capacity.trim()
        ? `, ${i.capacity} ${EDITOR.availability.places_}`
        : ""
      return `${DATES.fmtShort(dates.start_date)}: ${EDITOR.availability.applyBy} ${
        dates.application_deadline
          ? DATES.fmtShort(dates.application_deadline)
          : "—"
      }${places}`
    })
    .join(" · ")
  const card = saved ? cardFromApi(saved, today, null) : null
  const status = d.status
  const statusText =
    status === "pending_review"
      ? EDITOR.statusLabel.in_review
      : (EDITOR.statusLabel[status] ??
        LIVE.listingStatus[status as "paused" | "archived"] ??
        status)
  const stepProps = { d, set, errors, options }
  const meta =
    "flex items-center gap-1.5 font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase"

  return (
    <>
      <PageHeading
        title={d.id ? EDITOR.editTitle : EDITOR.createTitle}
        subtitle={`${d.title || EDITOR.untitled} · ${statusText}`}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exit()}
            disabled={saving}
          >
            <span className="le-600:hidden">{EDITOR.saveAndExit}</span>
            <Icon name="x" size={16} />
          </Button>
        }
        wide
      />
      <div className="grid grid-cols-[220px_minmax(0,1fr)_340px] items-start gap-[clamp(16px,2vw,28px)] le-1200:grid-cols-[200px_minmax(0,1fr)] le-900:grid-cols-[1fr]">
        <nav
          aria-label={EDITOR.stepsLabel}
          className="sticky top-24 grid gap-0.5 le-900:hidden"
        >
          {STEPS.map((s, i) => (
            <motion.button
              key={s}
              type="button"
              whileTap={{ scale: 0.98, transition: spring }}
              aria-current={i === step ? "step" : undefined}
              onClick={() => goTo(i)}
              className="group relative grid grid-cols-[28px_minmax(0,1fr)] items-center gap-[10px] rounded-sm border-0 bg-transparent px-[10px] py-2 text-left text-fs-13 font-semibold text-fg-3 hover:bg-tint-neon-1 hover:text-fg-1 aria-[current=step]:text-bg-0 aria-[current=step]:hover:bg-transparent aria-[current=step]:hover:text-bg-0 [&>*:not([data-pill])]:relative"
            >
              {i === step ? (
                <motion.span
                  data-pill=""
                  layoutId="wizard-rail"
                  transition={spring}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-sm bg-fg-1"
                />
              ) : null}
              <span
                className={cn(
                  "grid size-[26px] flex-none place-items-center rounded-full border-[1.5px] border-border-3 font-mono text-fs-12 font-bold text-fg-2",
                  done[i] &&
                    i !== step &&
                    "border-gf-neon bg-gf-neon text-text-on-neon",
                  i === step && "border-bg-0 text-bg-0"
                )}
              >
                {done[i] && i !== step ? (
                  <Icon name="check" size={12} sw={3} />
                ) : (
                  i + 1
                )}
              </span>
              <span>{s}</span>
            </motion.button>
          ))}
        </nav>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void next()
          }}
          className="grid min-w-0 gap-[18px] rounded-lg border border-border-1 bg-surface-elevated p-[clamp(18px,2.4vw,28px)]"
        >
          <div className="hidden le-900:grid le-900:gap-3">
            <Meter
              value={step + 1}
              max={10}
              label={EDITOR.stepOf(step + 1)}
              right={STEPS[step]}
            />
            <StepStrip step={step} done={done} onStep={goTo} />
          </div>
          {/* phones: the bar above already says "Step n of 10" */}
          <p className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase le-900:hidden">
            {EDITOR.stepOf(step + 1)}
          </p>
          <h2
            id="amk-w-step"
            ref={headRef}
            tabIndex={-1}
            className="font-display text-fs-24 font-bold uppercase focus:outline-none"
          >
            {STEPS[step]}
          </h2>
          <ErrorSummary errors={errors} labels={ERROR_LABELS} ref={sumRef} />
          {d.status === "rejected" && saved?.rejection_reason && step !== 9 ? (
            <Notice tone="warning" icon="alert">
              <b>{LIVE.listingStatus2.rejectedLead}</b> {saved.rejection_reason}
            </Notice>
          ) : null}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: easeOut }}
              className="grid min-w-0 gap-[18px]"
            >
              {step === 0 ? (
                <LiveStepAbout
                  {...stepProps}
                  academies={academies}
                  orgName={orgName}
                />
              ) : null}
              {step === 1 ? <LiveStepImages {...stepProps} /> : null}
              {step === 2 ? <LiveStepDetails {...stepProps} /> : null}
              {step === 3 ? <LiveStepAges {...stepProps} /> : null}
              {step === 4 ? (
                <LiveStepPricing {...stepProps} summary={pricingSummary} />
              ) : null}
              {step === 5 ? (
                <LiveStepAvailability
                  {...stepProps}
                  monthOpts={monthOpts}
                  preview={intakeLine}
                />
              ) : null}
              {step === 6 ? <LiveStepIncluded {...stepProps} /> : null}
              {step === 7 ? <LiveStepRequirements {...stepProps} /> : null}
              {step === 8 ? <LiveStepPreview card={card} /> : null}
              {step === 9 ? (
                <LiveStepSubmit
                  d={d}
                  saving={saving}
                  submitting={submitting}
                  missing={missing}
                  rejectionReason={saved?.rejection_reason ?? null}
                  goToStep={goTo}
                  onSubmit={() => void submit()}
                  onSaveDraft={() => {
                    void save(9).then((ok) => ok && notify(EDITOR.draftSaved))
                  }}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap justify-between gap-[10px] border-t border-border-1 pt-4">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => goTo(step - 1)}>
                <Icon name="arrowl" size={16} /> {EDITOR.back}
              </Button>
            ) : (
              <span />
            )}
            {step < 9 ? (
              <Button type="submit" disabled={saving} aria-busy={saving}>
                {saving ? LIVE.editorUi.saving : EDITOR.saveContinue}{" "}
                <Icon name="arrow" size={16} />
              </Button>
            ) : null}
          </div>
        </form>

        <aside
          aria-label={EDITOR.aside.label}
          className="sticky top-24 grid gap-3 le-1200:static le-1200:col-start-2 le-1200:grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] le-900:col-start-1"
        >
          {card ? (
            <div className="grid content-start gap-[10px] rounded-lg border border-dashed border-border-3 bg-bg-2 p-[14px]">
              <p className={meta}>
                <Icon name="eye" size={14} /> {EDITOR.aside.card}
              </p>
              <ListingCard
                card={card}
                saved={false}
                headingLevel={3}
                linkless
              />
            </div>
          ) : null}
          {price > 0 ? (
            <div className="grid content-start gap-[10px] rounded-lg border border-dashed border-border-3 bg-bg-2 p-[14px]">
              <p className={meta}>
                <Icon name="receipt" size={14} /> {EDITOR.aside.confirm}
              </p>
              <KvLines>
                <Kv label={EDITOR.aside.registration}>{fmt(registration)}</Kv>
                {rolling ? (
                  <Kv label={EDITOR.aside.firstMonth}>{fmt(price)}</Kv>
                ) : deposit > 0 ? (
                  <Kv label={EDITOR.aside.deposit}>{fmt(deposit)}</Kv>
                ) : (
                  <Kv label={EDITOR.aside.programFee}>{fmt(price)}</Kv>
                )}
              </KvLines>
            </div>
          ) : null}
        </aside>
      </div>
      <p className="am-sr" aria-live="polite">
        {saving ? LIVE.editorUi.saving : ""}
      </p>
    </>
  )
}

/*
 * Added (Oct 2026, user request): the step rail for phones and tablets
 * (<=900px, where the side rail is hidden). Every step is a tappable chip,
 * like the desktop rail: done steps are ticked, the current one shows its
 * name, and the strip scrolls sideways keeping the current step in view.
 */
function StepStrip({
  step,
  done,
  onStep,
}: {
  step: number
  done: boolean[]
  onStep: (i: number) => void
}) {
  const listRef = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const list = listRef.current
    const item = list?.querySelector<HTMLElement>('[aria-current="step"]')
    if (!list || !item) return
    // scroll the strip only (never the page) so the current chip is centred
    const left =
      item.offsetLeft -
      list.offsetLeft -
      (list.clientWidth - item.offsetWidth) / 2
    if (typeof list.scrollTo === "function")
      list.scrollTo({ left: Math.max(0, left), behavior: "smooth" })
    else list.scrollLeft = Math.max(0, left)
  }, [step])
  return (
    <nav aria-label={EDITOR.stepsLabel} className="min-w-0">
      <ol
        ref={listRef}
        className="relative flex [scrollbar-width:none] items-center gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden"
      >
        {STEPS.map((s, i) => {
          const current = i === step
          return (
            <li key={s} className="flex flex-none">
              <button
                type="button"
                aria-current={current ? "step" : undefined}
                aria-label={`${EDITOR.stepOf(i + 1)}: ${s}`}
                onClick={() => onStep(i)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-pill border border-border-2 bg-transparent py-1 pr-1 pl-1 text-fs-13 font-semibold whitespace-nowrap text-fg-3",
                  current && "border-fg-1 bg-fg-1 pr-3 text-bg-0"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-8 flex-none place-items-center rounded-full font-mono text-fs-12 font-bold",
                    done[i] && !current && "bg-gf-neon text-text-on-neon",
                    current && "bg-bg-0 text-fg-1"
                  )}
                >
                  {done[i] && !current ? (
                    <Icon name="check" size={13} sw={3} />
                  ) : (
                    i + 1
                  )}
                </span>
                {current ? <span aria-hidden="true">{s}</span> : null}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
