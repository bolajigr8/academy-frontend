"use client"

import { LiveApply } from "@/components/apply/live-apply"
import { LiveListingGate } from "@/components/program/live-listing-gate"
import { PROGRAM } from "@/data/search-copy"
import { isLive } from "@/lib/data-source"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

import { ApplySummary } from "@/components/apply/apply-summary"
import {
  StepDocs,
  StepPlayer,
  StepProfile,
  StepQuestions,
  StepReview,
} from "@/components/apply/apply-steps"
import { FlowBar } from "@/components/apply/flow-bar"
import { Icon } from "@/components/icons/icon"
import { DisplayHeading } from "@/components/shared/display-heading"
import { EmptyState } from "@/components/shared/empty-state"
import {
  ErrorSummary,
  type ErrorSummaryHandle,
} from "@/components/shared/error-summary"
import { notify } from "@/components/shared/notify"
import { Stepper } from "@/components/shared/stepper"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { APPLY } from "@/data/apply-copy"
import { DATES } from "@/data/catalog"
import {
  continueAsFamily,
  saveApplicationDraft,
  submitApplication,
  updatePlayer,
  uploadDocument,
} from "@/features/applications/actions"
import {
  errorLabels,
  profileFrom,
  STEPS,
  validate,
  type ApplyDraft,
} from "@/features/applications/apply"
import { STATUS } from "@/features/applications/flow"
import { useApply } from "@/features/applications/hooks"
import type { EnrichedListing } from "@/features/academies/types"
import type { AppDoc } from "@/features/applications/types"
import { easeOut, enter, inView } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

type Data = ReturnType<typeof useApply>

/* .amk-gate / .amk-done: css/amk-pages.css:451-460 */
const card =
  "mx-auto my-[clamp(24px,6vh,64px)] grid max-w-[680px] justify-items-start gap-4 rounded-lg border border-border-2 bg-surface-elevated p-[clamp(24px,4vw,40px)] shadow-(--shadow-md)"
const lead = "max-w-[58ch] text-fs-18 leading-lh-relaxed text-fg-2"

/*
 * Apply to Join (apply.html). Five steps; every "Save and continue" validates,
 * keeps a draft and moves focus to the new step heading. A draft is resumed
 * with ?app=. Waits for the saved session before choosing what to show, so a
 * resumed draft is never missed.
 */
/* api mode: step 1 (player + start date), then the application page */
export function ApplyClient(props: {
  slug: string
  intake: string | null
  app: string | null
  /** api mode: preselected from the dashboard's "Start application" */
  player?: string | null
}) {
  if (!isLive("listingPage")) return <DemoApply {...props} />
  return (
    <LiveListingGate
      slug={props.slug}
      live={(l) => (
        <LiveApply l={l} intake={props.intake} player={props.player ?? null} />
      )}
      notFound={
        <div className="am-container py-16">
          <EmptyState
            icon="search"
            title={PROGRAM.notFoundTitle}
            text={PROGRAM.notFoundText}
          />
        </div>
      }
    />
  )
}

function DemoApply({
  slug,
  intake,
  app,
}: {
  slug: string
  intake: string | null
  app: string | null
}) {
  const data = useApply(slug, app)
  if (!data.hydrated)
    return (
      <>
        <FlowBar exitHref={routes.academy(slug)} />
        <main id="main" className="min-h-screen" />
      </>
    )
  if (!data.l)
    return (
      <>
        <FlowBar exitHref={routes.academies()} />
        <main id="main" className="am-container py-[clamp(56px,7vw,104px)]">
          <EmptyState
            icon="search"
            title={APPLY.noProgram.title}
            text={APPLY.noProgram.text}
            cta={
              <ButtonLink href={routes.academies()}>
                {APPLY.noProgram.cta}
              </ButtonLink>
            }
          />
        </main>
      </>
    )
  const exitHref = routes.academy(data.l.id)
  if (data.role !== "family") {
    const host = data.role === "host"
    const g = APPLY.gate
    return (
      <>
        <FlowBar exitHref={exitHref} />
        <main id="main" className="am-container pt-6 pb-20">
          <motion.div {...enter(0, 16)} className={card}>
            <span
              aria-hidden="true"
              className="grid size-16 place-items-center rounded-full bg-fg-1 text-bg-0"
            >
              <Icon name="lock" size={26} />
            </span>
            <DisplayHeading as="h1">
              {host ? g.hostTitle : g.guestTitle}
            </DisplayHeading>
            <p className="text-fs-16 leading-lh-relaxed text-fg-2">
              {host ? g.hostText : g.guestText}
            </p>
            <div className="flex flex-wrap gap-[10px]">
              <Button size="lg" onClick={continueAsFamily}>
                {g.continueAs}
              </Button>
              {data.role === "guest" ? (
                <ButtonLink href={routes.login()} variant="secondary" size="lg">
                  {g.signIn}
                </ButtonLink>
              ) : null}
            </div>
          </motion.div>
        </main>
      </>
    )
  }
  return (
    <ApplyForm
      data={data}
      l={data.l}
      intakeParam={intake}
      exitHref={exitHref}
    />
  )
}

function ApplyForm({
  data,
  l,
  intakeParam,
  exitHref,
}: {
  data: Data
  l: EnrichedListing
  intakeParam: string | null
  exitHref: string
}) {
  const { existing, today, players, playerById, apps, vaultFor, activeAppFor } =
    data
  const [draft, setDraft] = useState<ApplyDraft>(() => {
    if (existing && existing.status === "draft") {
      const player = existing.playerId
        ? playerById[existing.playerId]
        : undefined
      const docs: ApplyDraft["docs"] = {}
      existing.documents.forEach((d) => {
        const v = data.documents.find((x) => x.id === d.docId)
        if (v) docs[d.type] = { id: v.id, name: v.name, fromVault: true }
      })
      return {
        appId: existing.id,
        playerId: existing.playerId,
        intakeId: existing.intakeId,
        optional: existing.optional ?? [],
        answers: existing.answers ?? {},
        docs,
        profile: player ? profileFrom(player) : null,
      }
    }
    const fromUrl = l.intakes.find(
      (i) => i.id === intakeParam && i.open && i.placesLeft > 0
    )
    return {
      appId: null,
      playerId: null,
      intakeId: fromUrl ? fromUrl.id : (l.nextIntake?.id ?? ""),
      optional: [],
      answers: {},
      docs: {},
      profile: null,
    }
  })
  const [step, setStep] = useState(() =>
    existing && existing.lastStep ? Math.min(existing.lastStep, 4) : 0
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState<{ ref: string | null; id: string } | null>(
    null
  )
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
  }, [step, done])

  const player = draft.playerId ? playerById[draft.playerId] : undefined
  const intake = l.intakes.find((i) => i.id === draft.intakeId)
  const activeApp = player ? activeAppFor(player.id, draft.appId) : null

  const set = (patch: Partial<ApplyDraft>) =>
    setDraft((d) => {
      const n = { ...d, ...patch }
      if (patch.playerId && patch.playerId !== d.playerId) {
        n.profile = profileFrom(playerById[patch.playerId])
        n.docs = {}
      }
      return n
    })

  const persist = (nextStep: number) => {
    const documents: AppDoc[] = l.documents.map((type) => {
      const chosen = draft.docs[type]
      return chosen
        ? { docId: chosen.id, type, status: "uploaded" }
        : { docId: null, type, status: "missing" }
    })
    const id = saveApplicationDraft({
      id: draft.appId ?? undefined,
      listingId: l.id,
      intakeId: draft.intakeId,
      playerId: draft.playerId,
      answers: draft.answers,
      documents,
      optional: draft.optional,
      lastStep: nextStep,
    })
    if (!draft.appId) setDraft((d) => ({ ...d, appId: id }))
    window.history.replaceState(null, "", routes.apply(l.id, undefined, id))
    return id
  }

  const next = () => {
    const e = validate(step, draft, { l, player, intake, today, apps })
    if (step === 0 && activeApp && player)
      e["amk-a-player"] = APPLY.already(
        player.firstName,
        STATUS[activeApp.status].label
      )
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => sumRef.current?.focus())
      return
    }
    if (step === 1 && player && draft.profile) {
      const p = draft.profile
      const videos = (player.videos ?? []).slice()
      if (p.video && !videos.some((v) => v.url === p.video))
        videos.unshift({
          id: `v${Date.now()}`,
          title: "Highlights",
          url: p.video,
          duration: "",
        })
      updatePlayer(player.id, {
        position: p.position,
        foot: p.foot,
        currentClub: p.currentClub,
        level: p.level || player.level,
        heightCm: p.heightCm ? +p.heightCm : player.heightCm,
        bio: p.bio,
        videos,
      })
    }
    if (step === 2 && player) {
      /* Attach vault files automatically before the documents step. */
      const vault = vaultFor(player.id)
      const docs = { ...draft.docs }
      l.documents.forEach((type) => {
        if (!docs[type]) {
          const v = vault.find((x) => x.type === type)
          if (v) docs[type] = { id: v.id, name: v.name, fromVault: true }
        }
      })
      setDraft((d) => ({ ...d, docs }))
    }
    if (step < 4) {
      persist(step + 1)
      setStep(step + 1)
      if (step === 0 && !draft.appId) notify(APPLY.draftSaved)
      return
    }
    const id = persist(4)
    const ref = submitApplication(id)
    setDone({ ref, id })
  }
  const back = () => {
    setErrors({})
    setStep(Math.max(0, step - 1))
  }
  const goTo = (i: number) => {
    setErrors({})
    setStep(i)
  }

  if (done && player) {
    const d = APPLY.done
    return (
      <>
        <FlowBar exitHref={exitHref} />
        <main id="main" className="am-container pt-6 pb-20">
          <motion.div {...enter(0, 16)} className={card}>
            <motion.span
              initial={{ scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 16,
                delay: 0.1,
              }}
              aria-hidden="true"
              className="grid size-16 place-items-center rounded-full bg-gf-neon text-text-on-neon shadow-(--glow-neon-md)"
            >
              <Icon name="check" size={34} sw={2.6} />
            </motion.span>
            <p className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
              {d.meta}
            </p>
            <DisplayHeading as="h1">
              <span ref={headRef} tabIndex={-1} className="focus:outline-none">
                {d.title(player.firstName, l.academy.name)}
              </span>
            </DisplayHeading>
            <p className={lead}>
              {d.refA} <b className="font-mono">{done.ref}</b>
              {d.refB(l.academy.responseHours)}
            </p>
            <ol className="grid w-full grid-cols-[repeat(4,minmax(0,1fr))] gap-[10px] le-720:grid-cols-[1fr_1fr]">
              {d.next.map(([b, small], i) => (
                <motion.li
                  {...inView(i)}
                  key={b}
                  className={cn(
                    "grid gap-0.5 rounded-sm border border-border-1 bg-bg-2 p-3 text-fs-13",
                    i === 0 && "border-fg-1"
                  )}
                >
                  <b className="text-fs-14">{b}</b>
                  <small className="text-fg-3">
                    {i === 0 ? DATES.fmt(today) : small}
                  </small>
                </motion.li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-[10px]">
              <ButtonLink href={routes.family.application(done.id)} size="lg">
                {d.view} <Icon name="arrow" size={18} />
              </ButtonLink>
              <ButtonLink
                href={routes.academies()}
                variant="secondary"
                size="lg"
              >
                {d.browse}
              </ButtonLink>
            </div>
          </motion.div>
        </main>
      </>
    )
  }

  return (
    <>
      <FlowBar exitHref={exitHref} />
      <main id="main" className="am-container pt-6 pb-20">
        <div className="mb-7 border-b border-border-1 pt-[14px] pb-[22px]">
          <Stepper
            steps={STEPS}
            current={step}
            onStep={goTo}
            label={APPLY.progress}
          />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-[clamp(28px,4vw,56px)] le-1024:grid-cols-[1fr]">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              next()
            }}
            className="grid max-w-[720px] min-w-0 grid-cols-[minmax(0,1fr)] gap-5"
          >
            <p className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
              {APPLY.stepOf(step + 1, STEPS.length)}
            </p>
            <DisplayHeading as="h1" className="-mt-[10px]">
              <span ref={headRef} tabIndex={-1} className="focus:outline-none">
                {STEPS[step]}
              </span>
            </DisplayHeading>
            <ErrorSummary
              errors={errors}
              labels={errorLabels(l)}
              ref={sumRef}
            />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: easeOut }}
                className="grid gap-5"
              >
                {step === 0 ? (
                  <StepPlayer
                    l={l}
                    draft={draft}
                    set={set}
                    players={players}
                    today={today}
                    apps={apps}
                    errors={errors}
                  />
                ) : null}
                {step === 1 && player ? (
                  <StepProfile
                    draft={draft}
                    set={set}
                    player={player}
                    errors={errors}
                  />
                ) : null}
                {step === 2 ? (
                  <StepQuestions
                    l={l}
                    draft={draft}
                    set={set}
                    errors={errors}
                  />
                ) : null}
                {step === 3 && player ? (
                  <StepDocs
                    l={l}
                    draft={draft}
                    set={set}
                    playerName={player.firstName}
                    vault={vaultFor(player.id)}
                    onUpload={(type, f) => uploadDocument(player.id, type, f)}
                    errors={errors}
                  />
                ) : null}
                {step === 4 && player && intake ? (
                  <StepReview
                    l={l}
                    draft={draft}
                    set={set}
                    player={player}
                    intake={intake}
                    today={today}
                    goTo={goTo}
                    errors={errors}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-between gap-3 border-t border-border-1 pt-5">
              {step > 0 ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={back}
                  className="le-720:flex-1"
                >
                  <Icon name="arrowl" size={18} /> {APPLY.back}
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" size="lg" className="le-720:flex-1">
                {step < 4 ? (
                  <>
                    {APPLY.saveContinue} <Icon name="arrow" size={18} />
                  </>
                ) : (
                  <>
                    {APPLY.submit} <Icon name="send" size={18} />
                  </>
                )}
              </Button>
            </div>
          </form>
          <aside
            aria-label={APPLY.summaryLabel}
            className="sticky top-[88px] le-1024:static le-1024:-order-1"
          >
            <ApplySummary
              l={l}
              intake={intake}
              optional={draft.optional}
              today={today}
            />
          </aside>
        </div>
      </main>
    </>
  )
}
