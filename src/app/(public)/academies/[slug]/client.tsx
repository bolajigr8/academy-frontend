"use client"

import { LiveListingGate } from "@/components/program/live-listing-gate"
import { LiveProgram } from "@/components/program/live-program"
import { isLive } from "@/lib/data-source"

import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { CheckList } from "@/components/shared/check-list"
import { EmptyState } from "@/components/shared/empty-state"
import { ListingCard } from "@/components/shared/listing-card"
import { notify } from "@/components/shared/notify"
import { Notice } from "@/components/shared/notice"
import { useSaveToggle } from "@/components/shared/use-save-toggle"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES, DOC_TYPES, FEE_UNITS } from "@/data/catalog"
import { PROGRAM } from "@/data/search-copy"
import { useProgram } from "@/features/academies/hooks"
import { fmtEuro, placesLabel } from "@/features/academies/search"
import type { EnrichedListing } from "@/features/academies/types"
import { enter, inView } from "@/lib/motion"
import { routes } from "@/routes"

import { FeeCard } from "@/components/program/fee-card"
import { Gallery } from "@/components/program/gallery"
import { ListingHeader } from "@/components/program/listing-header"
import {
  About,
  Facts,
  FeeTable,
  h3,
  h4,
  Includes,
  IntakeTable,
  Provision,
  Reviews,
  Schedule,
} from "@/components/program/program-blocks"

/* .amk-dsec / .amk-dsec__h: css/amk-pages.css:205-209 */
const dsec =
  "grid scroll-mt-[calc(var(--amk-nav-h)+64px)] gap-4 border-b border-border-1 py-[34px]"
const dsecH = "font-display text-fs-24 font-bold tracking-[-0.015em] uppercase"
/* .amk-twocol: css/amk-pages.css:211-212. Its "> div" rule also reshapes the two
   Provision cards into a stacked grid (icon above text), exactly as in the prototype. */
const twocol =
  "grid grid-cols-[1fr_1fr] gap-6 le-720:grid-cols-[1fr] [&>div]:grid [&>div]:content-start [&>div]:gap-2"
const body = "text-fs-16 leading-lh-relaxed text-fg-2"
const grid3 =
  "grid grid-cols-[repeat(3,minmax(0,1fr))] gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(20px,2.5vw,32px)] le-1024:grid-cols-[repeat(2,minmax(0,1fr))] le-720:grid-cols-[1fr]"

/* Program detail (listing.html?id=&intake=) */
/* api mode: the backend's listing (GET /academy/listings/{slug}) */
export function ProgramClient(props: { slug: string; intake: string | null }) {
  if (!isLive("listingPage")) return <DemoProgram {...props} />
  return (
    <LiveListingGate
      slug={props.slug}
      live={(l) => <LiveProgram l={l} intake={props.intake} />}
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

function DemoProgram({
  slug,
  intake: intakeParam,
}: {
  slug: string
  intake: string | null
}) {
  const data = useProgram(slug)
  if (!data.ready) return <div className="min-h-screen" />
  if (!data.found)
    return (
      <div className="am-container py-[clamp(56px,7vw,104px)]">
        <EmptyState
          icon="search"
          title={PROGRAM.notFoundTitle}
          text={PROGRAM.notFoundText}
          cta={
            <ButtonLink href={routes.academies()} variant="primary">
              {PROGRAM.findAcademies}
            </ButtonLink>
          }
        />
      </div>
    )
  return <Program {...data} intakeParam={intakeParam} />
}

function Program({
  listing: l,
  today,
  saved,
  savedIds,
  reviews,
  sameAcademy,
  similar,
  intakeParam,
}: Extract<ReturnType<typeof useProgram>, { found: true }> & {
  intakeParam: string | null
}) {
  const t = PROGRAM
  const onSave = useSaveToggle()
  const first =
    l.intakes.find((i) => i.id === intakeParam && i.open && i.placesLeft > 0) ??
    l.nextIntake ??
    l.intakes[0]
  const [intakeId, setIntakeId] = useState(first ? first.id : "")
  const intake = l.intakes.find((i) => i.id === intakeId) ?? l.intakes[0]

  useEffect(() => {
    if (intakeId)
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?intake=${encodeURIComponent(intakeId)}`
      )
  }, [intakeId])

  const onShare = () => {
    const done = () => notify(t.linkCopied)
    try {
      navigator.clipboard.writeText(window.location.href).then(done, done)
    } catch {
      done()
    }
  }
  const closed = !intake.open || intake.placesLeft === 0
  const cards = (list: EnrichedListing[]) => (
    <div className={grid3}>
      {list.map((x, i) => (
        <ListingCard
          index={i}
          key={x.id}
          listing={x}
          saved={savedIds.includes(x.id)}
          onSave={onSave}
        />
      ))}
    </div>
  )

  return (
    <>
      <div className="am-container pt-5 pb-20 le-720:pb-10">
        <nav aria-label={t.breadcrumb}>
          <ol className="mb-[18px] flex flex-wrap gap-1.5 text-fs-13 text-fg-3 [&>li+li]:before:text-fg-4 [&>li+li]:before:content-['/']">
            <li className="flex items-center gap-1.5">
              <Link
                href={routes.academies()}
                className="text-fg-2 hover:text-fg-1 hover:underline hover:underline-offset-3"
              >
                {t.findAcademies}
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <Link
                href={routes.academies({ country: l.academy.countryCode })}
                className="text-fg-2 hover:text-fg-1 hover:underline hover:underline-offset-3"
              >
                {l.country}
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <Link
                href={routes.academies({
                  country: l.academy.countryCode,
                  city: l.city,
                })}
                className="text-fg-2 hover:text-fg-1 hover:underline hover:underline-offset-3"
              >
                {l.city}
              </Link>
            </li>
            <li
              aria-current="page"
              className="flex items-center gap-1.5 font-semibold text-fg-1"
            >
              {l.title}
            </li>
          </ol>
        </nav>
        {l.status !== "published" ? (
          <Notice tone="warning" icon="eye" className="mb-4">
            <b>{t.previewLead}</b> {t.previewText}
          </Notice>
        ) : null}
        <ListingHeader
          listing={l}
          saved={saved}
          onSave={onSave}
          onShare={onShare}
        />
        <Gallery listing={l} />

        <nav
          aria-label={t.onThisPage}
          className="sticky top-(--amk-nav-h) z-(--amk-z-sticky) mt-[26px] flex [scrollbar-width:none] gap-[22px] overflow-x-auto border-b border-border-2 bg-glass-bg-nav-scrolled px-0.5 am-glass [&::-webkit-scrollbar]:hidden"
        >
          {t.sections.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex-none border-b-2 border-transparent pt-[14px] pb-3 text-fs-14 font-semibold text-fg-2 hover:border-gf-neon hover:text-fg-1"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-[clamp(28px,4vw,64px)] le-1024:grid-cols-[1fr]">
          <div className="min-w-0">
            <motion.section
              {...inView(0)}
              id="overview"
              aria-labelledby="h-overview"
              className={dsec}
            >
              <h2 id="h-overview" className={dsecH}>
                {t.overview}
              </h2>
              <p className="max-w-[58ch] text-fs-18 leading-lh-relaxed text-fg-2">
                {l.summary}
              </p>
              <Facts listing={l} />
            </motion.section>

            <motion.section
              {...inView(0)}
              aria-labelledby="h-program"
              className={dsec}
            >
              <h2 id="h-program" className={dsecH}>
                {t.theProgram}
              </h2>
              <div className={twocol}>
                <div>
                  <h3 className={h4}>{t.methodology}</h3>
                  <p className={body}>{l.methodology}</p>
                </div>
                <div>
                  <h3 className={h4}>{t.competition}</h3>
                  <p className={body}>{l.competition}</p>
                </div>
              </div>
              <h3 className={`${h4} mt-[10px]`}>{t.week}</h3>
              <Schedule listing={l} />
            </motion.section>

            <motion.section
              {...inView(0)}
              id="dates"
              aria-labelledby="h-dates"
              className={dsec}
            >
              <h2 id="h-dates" className={dsecH}>
                {t.startDates}
              </h2>
              <p className={body}>{t.startDatesText}</p>
              <IntakeTable
                listing={l}
                value={intake.id}
                onChange={setIntakeId}
                today={today}
              />
            </motion.section>

            <motion.section
              {...inView(0)}
              id="included"
              aria-labelledby="h-included"
              className={dsec}
            >
              <h2 id="h-included" className={dsecH}>
                {t.included}
              </h2>
              <Includes listing={l} />
              <div className={`${twocol} mt-[10px]`}>
                <Provision
                  icon="bed"
                  title={t.accommodation}
                  value={l.accommodation}
                  note={l.accommodationNote}
                />
                <Provision
                  icon="book"
                  title={t.education}
                  value={l.education}
                  note={l.educationNote}
                />
              </div>
            </motion.section>

            <motion.section
              {...inView(0)}
              aria-labelledby="h-req"
              className={dsec}
            >
              <h2 id="h-req" className={dsecH}>
                {t.requirements}
              </h2>
              <div className={twocol}>
                <div>
                  <h3 className={h4}>{t.entry}</h3>
                  <CheckList items={l.requirements.map((text) => ({ text }))} />
                </div>
                <div>
                  <h3 className={h4}>{t.documents}</h3>
                  <CheckList
                    items={l.documents.map((k) => ({
                      text: DOC_TYPES[k].label,
                      icon: "doc",
                      sw: 1.8,
                    }))}
                  />
                </div>
              </div>
            </motion.section>

            <motion.section
              {...inView(0)}
              id="fees"
              aria-labelledby="h-fees"
              className={dsec}
            >
              <h2 id="h-fees" className={dsecH}>
                {t.fees}
              </h2>
              <p className={body}>
                {t.feesLeadA} <b>{DATES.fmt(intake.start)}</b>
                {t.feesLeadB}
              </p>
              <FeeTable listing={l} intake={intake} today={today} />
            </motion.section>

            <motion.section
              {...inView(0)}
              id="reviews"
              aria-labelledby="h-reviews"
              className={dsec}
            >
              <h2 id="h-reviews" className={dsecH}>
                {t.reviews}
              </h2>
              <p className="flex items-center gap-1.5 text-fs-14 text-fg-3">
                <Icon name="shieldcheck" size={14} /> {t.reviewsIntro}
              </p>
              <Reviews listing={l} reviews={reviews} />
            </motion.section>

            <motion.section
              {...inView(0)}
              id="academy"
              aria-labelledby="h-academy"
              className={dsec}
            >
              <h2 id="h-academy" className={dsecH}>
                {t.aboutAcademy}
              </h2>
              <About listing={l} />
              <div className="mt-2 flex flex-wrap items-center gap-3 rounded-md border border-border-1 bg-bg-2 p-4">
                <Icon name="pin" size={18} />
                <div className="grid min-w-[180px] flex-1">
                  <b>{l.academy.address}</b>
                  <small className="text-fs-13 text-fg-3">
                    {l.city}, {l.country}
                  </small>
                </div>
                <ButtonLink
                  href={routes.academies({
                    view: "map",
                    country: l.academy.countryCode,
                  })}
                  variant="secondary"
                  size="sm"
                >
                  {t.seeOnMap}
                </ButtonLink>
              </div>
            </motion.section>

            <motion.section
              {...inView(0)}
              aria-labelledby="h-policies"
              className={dsec}
            >
              <h2 id="h-policies" className={dsecH}>
                {t.policies}
              </h2>
              <dl className="grid gap-[14px]">
                {(
                  [
                    [t.cancellation, l.policies.cancellation],
                    [t.refunds, l.policies.refund],
                    [t.safeguarding, l.policies.safeguarding],
                  ] as const
                ).map(([k, v]) => (
                  <div
                    key={k}
                    className="grid grid-cols-[160px_minmax(0,1fr)] gap-4 border-b border-border-1 pb-[14px] le-720:grid-cols-[1fr] le-720:gap-1"
                  >
                    <dt className="font-bold">{k}</dt>
                    <dd className="text-fs-14 leading-lh-relaxed text-fg-2">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-fs-14 text-fg-3">{t.policiesNote}</p>
            </motion.section>
          </div>

          <motion.aside
            {...enter(2, 20)}
            aria-label={t.sideLabel}
            className="sticky top-[calc(var(--amk-nav-h)+72px)] pt-8 le-1024:static le-1024:-order-1 le-1024:pt-6"
          >
            <FeeCard
              listing={l}
              intakeId={intake.id}
              onIntake={setIntakeId}
              today={today}
              saved={saved}
              onSave={onSave}
            />
          </motion.aside>
        </div>

        {sameAcademy.length > 0 ? (
          <motion.section
            {...inView(0)}
            aria-labelledby="h-more"
            className="grid gap-6 pt-12"
          >
            <h2 id="h-more" className={h3}>
              {t.moreFrom} {l.academy.name}
            </h2>
            {cards(sameAcademy)}
          </motion.section>
        ) : null}
        {similar.length > 0 ? (
          <motion.section
            {...inView(0)}
            aria-labelledby="h-similar"
            className="grid gap-6 pt-12"
          >
            <h2 id="h-similar" className={h3}>
              {t.similar}
            </h2>
            {cards(similar)}
          </motion.section>
        ) : null}
      </div>

      <div
        data-applybar=""
        className="fixed inset-x-0 bottom-0 z-(--amk-z-sticky) hidden items-center justify-between gap-3 border-t border-border-2 bg-glass-bg-nav-scrolled px-(--gutter) pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] am-glass le-720:flex"
      >
        <div className="grid">
          <b className="font-display text-fs-18">
            {fmtEuro(l.fees.amount)}{" "}
            <small className="font-body text-fs-13 font-medium text-fg-2">
              / {FEE_UNITS[l.fees.per].label}
            </small>
          </b>
          <small className="text-fs-12 text-fg-3">
            {DATES.fmtShort(intake.start)} · {placesLabel(intake.placesLeft)}
          </small>
        </div>
        {closed ? (
          <Button disabled>{t.closed}</Button>
        ) : (
          <ButtonLink href={routes.apply(l.id, intake.id)} variant="primary">
            {t.apply}
          </ButtonLink>
        )}
      </div>
    </>
  )
}
