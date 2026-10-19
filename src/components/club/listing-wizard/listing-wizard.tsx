"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import {
  ErrorSummary,
  type ErrorSummaryHandle,
} from "@/components/shared/error-summary"
import { Kv, KvLines } from "@/components/shared/key-value"
import { ListingCard } from "@/components/shared/listing-card"
import { Meter } from "@/components/shared/meter"
import { notify } from "@/components/shared/notify"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { EDITOR } from "@/data/editor-copy"
import type { Fees, FeeUnit } from "@/data/types"
import { fmtEuro } from "@/features/academies/search"
import { programTotal } from "@/features/applications/flow"
import {
  loadListing,
  saveListing,
  setListingStatus,
} from "@/features/club/actions"
import { useListingEditor } from "@/features/club/hooks"
import {
  FALLBACK_COVER,
  makeIntake,
  newListing,
  preview,
  validateWizard,
  WIZ_STEPS,
  type WizardListing,
} from "@/features/club/wizard"
import { getAppStore } from "@/stores/instance"
import { easeOut, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

import {
  StepAbout,
  StepAges,
  StepAvailability,
  StepDetails,
  StepImages,
  StepIncluded,
  StepPreview,
  StepPricing,
  StepRequirements,
  StepSubmit,
} from "./wizard-steps"

const meta =
  "flex items-center gap-1.5 font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase"

/*
 * Create / edit listing (host/listing-edit.html): ten guided steps with a live
 * preview that uses the same card and fee maths families see. Every "Save and
 * continue" keeps a draft; step 10 submits for Golafly verification.
 */
export function ListingWizard({ id }: { id: string | null }) {
  const [l, setL] = useState<WizardListing>(
    () => (id ? loadListing(id) : null) ?? newListing(getAppStore().get())
  )
  const [step, setStep] = useState(() => Math.min(l.wizardStep ?? 0, 9))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const headRef = useRef<HTMLHeadingElement>(null)
  const sumRef = useRef<ErrorSummaryHandle>(null)
  const first = useRef(true)
  const { view, today, storedStatus, academyOf } = useListingEditor(l.id)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    headRef.current?.focus()
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [step])

  const set = (patch: Partial<WizardListing>) =>
    setL((x) => ({ ...x, ...patch }))
  const setFees = (patch: Partial<Fees>) =>
    setL((x) => ({ ...x, fees: { ...x.fees, ...patch } }))
  const { academy, org } = academyOf(l.academyId)
  const pv = preview(l, view)
  const status = storedStatus ?? l.status
  const total = programTotal(pv)

  const save = (nextStep: number, silent = false) => {
    const savedId = saveListing({
      ...l,
      wizardStep: nextStep,
      image: l.gallery[0] || FALLBACK_COVER,
      status,
    })
    if (!l.id) set({ id: savedId })
    window.history.replaceState(null, "", routes.club.editListing(savedId))
    if (!silent) notify(EDITOR.draftSaved)
    return savedId
  }
  const next = () => {
    const e = validateWizard(step, l)
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => sumRef.current?.focus())
      return
    }
    save(Math.min(step + 1, 9), true)
    setStep(Math.min(step + 1, 9))
  }
  const goTo = (i: number) => {
    setErrors({})
    setStep(i)
  }
  const monthOpts = Array.from({ length: 14 }, (_, k) =>
    DATES.monthKey(DATES.monthStart(today, k + 1))
  )
  const setPer = (per: FeeUnit) =>
    setL((x) =>
      per === "month"
        ? {
            ...x,
            rolling: true,
            durationWeeks: null,
            fees: {
              ...x.fees,
              per,
              deposit: null,
              schedule: "monthly",
              balanceDueDays: 0,
            },
          }
        : {
            ...x,
            rolling: false,
            durationWeeks: x.durationWeeks || 12,
            fees: {
              ...x.fees,
              per,
              deposit: x.fees.deposit || { kind: "percent", value: 25 },
              schedule: "deposit_balance",
              balanceDueDays: x.fees.balanceDueDays || 21,
            },
          }
    )
  const rebuildIntakes = (patch: Partial<WizardListing>) =>
    setL((x) => {
      const n = { ...x, ...patch }
      n.intakes = n.intakes.map((i, k) =>
        makeIntake(n, DATES.monthKey(i.start), i.capacity, k)
      )
      return n
    })

  const stepProps = { l, set, setFees, errors }

  return (
    <>
      <PageHeading
        title={l.id ? EDITOR.editTitle : EDITOR.createTitle}
        subtitle={`${l.title || EDITOR.untitled} · ${EDITOR.statusLabel[status] ?? status}`}
        actions={
          <ButtonLink
            href={routes.club.listings}
            variant="ghost"
            size="sm"
            onClick={() => save(step, true)}
          >
            <span className="le-600:hidden">{EDITOR.saveAndExit}</span>
            <Icon name="x" size={16} />
          </ButtonLink>
        }
        wide
      />
      <div className="grid grid-cols-[220px_minmax(0,1fr)_340px] items-start gap-[clamp(16px,2vw,28px)] le-1200:grid-cols-[200px_minmax(0,1fr)] le-900:grid-cols-[1fr]">
        <nav
          aria-label={EDITOR.stepsLabel}
          className="sticky top-24 grid gap-0.5 le-900:hidden"
        >
          {WIZ_STEPS.map((s, i) => (
            <motion.button
              key={s}
              type="button"
              whileTap={{ scale: 0.98, transition: spring }}
              aria-current={i === step ? "step" : undefined}
              onClick={() => goTo(i)}
              className={cn(
                "group relative grid grid-cols-[28px_minmax(0,1fr)] items-center gap-[10px] rounded-sm border-0 bg-transparent px-[10px] py-2 text-left text-fs-13 font-semibold text-fg-3 hover:bg-tint-neon-1 hover:text-fg-1 aria-[current=step]:text-bg-0 aria-[current=step]:hover:bg-transparent aria-[current=step]:hover:text-bg-0 [&>*:not([data-pill])]:relative"
              )}
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
                  i < step && "border-gf-neon bg-gf-neon text-text-on-neon",
                  i === step && "border-bg-0 text-bg-0"
                )}
              >
                {i < step ? <Icon name="check" size={12} sw={3} /> : i + 1}
              </span>
              <span>{s}</span>
            </motion.button>
          ))}
        </nav>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            next()
          }}
          className="grid min-w-0 gap-[18px] rounded-lg border border-border-1 bg-surface-elevated p-[clamp(18px,2.4vw,28px)]"
        >
          <div className="hidden le-900:grid le-900:gap-1.5">
            <Meter
              value={step + 1}
              max={10}
              label={EDITOR.stepOf(step + 1)}
              right={WIZ_STEPS[step]}
            />
          </div>
          <p className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
            {EDITOR.stepOf(step + 1)}
          </p>
          <h2
            ref={headRef}
            tabIndex={-1}
            className="font-display text-fs-24 font-bold uppercase focus:outline-none"
          >
            {WIZ_STEPS[step]}
          </h2>
          <ErrorSummary errors={errors} labels={EDITOR.labels} ref={sumRef} />

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
                <StepAbout {...stepProps} academy={academy} org={org} />
              ) : null}
              {step === 1 ? <StepImages {...stepProps} /> : null}
              {step === 2 ? <StepDetails {...stepProps} /> : null}
              {step === 3 ? <StepAges {...stepProps} /> : null}
              {step === 4 ? (
                <StepPricing {...stepProps} pv={pv} setPer={setPer} />
              ) : null}
              {step === 5 ? (
                <StepAvailability
                  {...stepProps}
                  monthOpts={monthOpts}
                  rebuildIntakes={rebuildIntakes}
                />
              ) : null}
              {step === 6 ? <StepIncluded {...stepProps} /> : null}
              {step === 7 ? <StepRequirements {...stepProps} /> : null}
              {step === 8 ? <StepPreview pv={pv} today={today} /> : null}
              {step === 9 ? (
                <StepSubmit
                  l={l}
                  status={status}
                  onSubmit={() => {
                    const savedId = save(9, true)
                    setListingStatus(savedId, "in_review")
                    notify(EDITOR.submit.submitted)
                  }}
                  onApprove={() => {
                    if (l.id) setListingStatus(l.id, "published")
                    notify(EDITOR.submit.approved)
                  }}
                  onSaveChanges={() => {
                    save(9, true)
                    notify(EDITOR.submit.saved)
                  }}
                  onSaveDraft={() => save(9)}
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
              <Button type="submit">
                {EDITOR.saveContinue} <Icon name="arrow" size={16} />
              </Button>
            ) : null}
          </div>
        </form>

        <aside
          aria-label={EDITOR.aside.label}
          className="sticky top-24 grid gap-3 le-1200:static le-1200:col-start-2 le-1200:grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] le-900:col-start-1"
        >
          <div className="grid content-start gap-[10px] rounded-lg border border-dashed border-border-3 bg-bg-2 p-[14px]">
            <p className={meta}>
              <Icon name="eye" size={14} /> {EDITOR.aside.card}
            </p>
            <ListingCard listing={pv} saved={false} headingLevel={3} linkless />
          </div>
          <div className="grid content-start gap-[10px] rounded-lg border border-dashed border-border-3 bg-bg-2 p-[14px]">
            <p className={meta}>
              <Icon name="receipt" size={14} /> {EDITOR.aside.confirm}
            </p>
            <KvLines>
              <Kv label={EDITOR.aside.registration}>
                {fmtEuro(l.fees.registrationFee)}
              </Kv>
              {l.rolling ? (
                <Kv label={EDITOR.aside.firstMonth}>
                  {fmtEuro(l.fees.amount)}
                </Kv>
              ) : pv.deposit > 0 ? (
                <Kv label={EDITOR.aside.deposit}>{fmtEuro(pv.deposit)}</Kv>
              ) : (
                <Kv label={EDITOR.aside.programFee}>{fmtEuro(total ?? 0)}</Kv>
              )}
            </KvLines>
          </div>
        </aside>
      </div>
    </>
  )
}
