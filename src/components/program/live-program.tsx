"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { DefList, h4 } from "@/components/program/program-blocks"
import { useLiveSaved } from "@/components/search/use-live-saved"
import { CheckList } from "@/components/shared/check-list"
import { ClubCrest } from "@/components/shared/club-crest"
import { Kv, KvLines } from "@/components/shared/key-value"
import { SafeImage } from "@/components/shared/safe-image"
import { VerifyBadge } from "@/components/shared/verify-badge"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES, GENDERS, LEVELS, TYPES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import { PROGRAM } from "@/data/search-copy"
import type { ApiPublicListing } from "@/features/academies/api"
import { apiDurationLabel, valueLabel } from "@/features/academies/card-view"
import { crestFor, placesLabel } from "@/features/academies/search"
import { apiFeeUnit } from "@/features/club/view-models"
import { documentLabel } from "@/features/club/live-draft"
import { formatMoney } from "@/lib/money"
import { inView } from "@/lib/motion"
import { routes } from "@/routes"

/*
 * The public listing page in api mode: GET /academy/listings/{slug}
 * (week 1 part 2, section 15). The prototype's program page sections and
 * styles (listing.html); only what the public listing shape carries.
 */

const dsec =
  "grid scroll-mt-[calc(var(--amk-nav-h)+64px)] gap-4 border-b border-border-1 py-[34px]"
const dsecH = "font-display text-fs-24 font-bold tracking-[-0.015em] uppercase"
const twocol =
  "grid grid-cols-[1fr_1fr] gap-6 le-720:grid-cols-[1fr] [&>div]:grid [&>div]:content-start [&>div]:gap-2"
const body = "text-fs-16 leading-lh-relaxed text-fg-2"
const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

export function LiveProgram({
  l,
  intake,
}: {
  l: ApiPublicListing
  intake: string | null
}) {
  const t = PROGRAM
  const saved = useLiveSaved()
  // listing.html sets the title the same way: "<program> · <academy>"
  useEffect(() => {
    document.title = `${l.title || t.untitled} · ${l.academy.name} · Golafly Academy`
  }, [l.title, l.academy.name, t.untitled])
  const L = LIVE.program
  const [photo, setPhoto] = useState(0)
  const images = l.images.length
    ? [...l.images].sort(
        (a, b) =>
          Number(b.is_primary) - Number(a.is_primary) ||
          a.sort_order - b.sort_order
      )
    : []
  const unit = apiFeeUnit(l.payment_frequency)
  const firstIntake = l.intakes[0] ?? null
  const chosen = l.intakes.find((i) => String(i.id) === intake) ?? firstIntake
  const applyHref = chosen ? routes.apply(l.slug, String(chosen.id)) : null
  const schedule = DAY_ORDER.filter((d) => l.weekly_schedule[d])
  const verification =
    l.academy.verification_status === "club_academy" ? "club" : "verified"

  return (
    <div className="am-container pt-6 pb-16">
      <header className="grid gap-3">
        <p className="flex flex-wrap items-center gap-2 text-fs-14 text-fg-3">
          <ClubCrest
            crest={crestFor({ id: String(l.academy.id), name: l.academy.name })}
            size={28}
          />
          <Link
            href={routes.academyProfile(l.academy.slug)}
            className="font-bold text-fg-1 underline-offset-3 hover:underline"
          >
            {l.academy.name}
          </Link>
          <span>
            {l.academy.city}, {l.academy.country_name}
          </span>
          <VerifyBadge v={verification} />
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="min-w-0 font-display text-[clamp(32px,4.6vw,56px)] leading-none font-bold [overflow-wrap:anywhere] uppercase">
            {l.title || t.untitled}
          </h1>
          {/* POST / DELETE /academy/me/saved (section 16); guests sign in first */}
          <Button
            variant="secondary"
            size="sm"
            aria-pressed={saved.isSaved(l)}
            onClick={() => saved.toggle(l)}
          >
            <Icon
              name="heart"
              size={16}
              className={saved.isSaved(l) ? "fill-current text-gf-danger" : ""}
            />
            {saved.isSaved(l) ? t.saved : t.save}
          </Button>
        </div>
        {l.academy.club_name ? (
          <p className="text-fs-14 text-fg-2">
            {t.officialAcademyOf} {l.academy.club_name}
          </p>
        ) : null}
      </header>

      {images.length ? (
        <div className="mt-6 grid gap-2">
          <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-bg-3 le-720:aspect-[4/3]">
            <SafeImage
              src={images[photo].url}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover [filter:var(--filter-media)]"
            />
          </div>
          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  aria-label={`${t.openPhoto} ${i + 1} ${t.of} ${images.length}`}
                  aria-pressed={i === photo}
                  onClick={() => setPhoto(i)}
                  className="relative h-16 w-24 flex-none overflow-hidden rounded-sm border-2 border-transparent bg-bg-3 aria-pressed:border-gf-neon"
                >
                  <SafeImage
                    src={img.url}
                    alt=""
                    fill
                    unoptimized
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-[26px] grid grid-cols-[minmax(0,1fr)_380px] items-start gap-[clamp(28px,4vw,64px)] le-1024:grid-cols-[1fr]">
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
            {l.description ? (
              <p className="max-w-[58ch] text-fs-18 leading-lh-relaxed text-fg-2">
                {l.description}
              </p>
            ) : null}
            <DefList
              rows={(
                [
                  [
                    L.ages,
                    l.age_min !== null && l.age_max !== null
                      ? `${l.age_min}–${l.age_max}`
                      : null,
                  ],
                  [
                    L.duration,
                    apiDurationLabel(l.duration.value, l.duration.unit),
                  ],
                  [
                    L.type,
                    l.academy_type ? valueLabel(TYPES, l.academy_type) : null,
                  ],
                  [
                    L.level,
                    l.playing_level
                      ? valueLabel(LEVELS, l.playing_level)
                      : null,
                  ],
                  [L.gender, l.gender ? valueLabel(GENDERS, l.gender) : null],
                  [L.training, l.training_frequency],
                ] as [string, string | null][]
              ).filter((r): r is [string, string] => Boolean(r[1]))}
            />
          </motion.section>

          {l.methodology || l.competition || schedule.length ? (
            <motion.section
              {...inView(0)}
              aria-labelledby="h-program"
              className={dsec}
            >
              <h2 id="h-program" className={dsecH}>
                {t.theProgram}
              </h2>
              <div className={twocol}>
                {l.methodology ? (
                  <div>
                    <h3 className={h4}>{t.methodology}</h3>
                    <p className={body}>{l.methodology}</p>
                  </div>
                ) : null}
                {l.competition ? (
                  <div>
                    <h3 className={h4}>{t.competition}</h3>
                    <p className={body}>{l.competition}</p>
                  </div>
                ) : null}
              </div>
              {schedule.length ? (
                <>
                  <h3 className={h4}>{t.week}</h3>
                  <KvLines>
                    {schedule.map((d) => (
                      <Kv
                        key={d}
                        label={
                          LIVE.editorUi.days[
                            d as keyof typeof LIVE.editorUi.days
                          ]
                        }
                      >
                        {l.weekly_schedule[d]}
                      </Kv>
                    ))}
                  </KvLines>
                </>
              ) : null}
            </motion.section>
          ) : null}

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
            {l.intakes.length ? (
              <ul className="grid gap-2">
                {l.intakes.map((i) => (
                  <li
                    key={i.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border-1 bg-surface-elevated p-[14px]"
                  >
                    <span className="grid gap-0.5">
                      <b className="text-fs-16">
                        {i.label || DATES.fmt(i.start_date)}
                      </b>
                      <small className="text-fs-13 text-fg-3">
                        {L.startsOn} {DATES.fmt(i.start_date)}
                        {i.application_deadline
                          ? ` · ${L.applyBy} ${DATES.fmt(i.application_deadline)}`
                          : ""}
                        {` · ${i.places_left === null ? L.unlimited : placesLabel(i.places_left)}`}
                      </small>
                    </span>
                    {i.status === "open" && i.places_left !== 0 ? (
                      <ButtonLink
                        href={routes.apply(l.slug, String(i.id))}
                        size="sm"
                      >
                        {t.apply}
                      </ButtonLink>
                    ) : (
                      <span className="text-fs-13 font-semibold text-fg-3">
                        {t.closed}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={body}>{L.noDates}</p>
            )}
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
            {l.included.length ? (
              <CheckList items={l.included.map((text) => ({ text }))} />
            ) : null}
            <DefList
              rows={[
                [
                  L.accommodation,
                  l.has_accommodation ? L.included : L.notOffered,
                ],
                [L.education, l.has_education ? L.included : L.notOffered],
              ]}
            />
            {l.optional_services.length ? (
              <>
                <h3 className={h4}>{L.optional}</h3>
                <CheckList
                  items={l.optional_services.map((text) => ({
                    text,
                    icon: "plus" as const,
                  }))}
                />
              </>
            ) : null}
          </motion.section>

          {l.requirements || l.required_documents.length ? (
            <motion.section
              {...inView(0)}
              aria-labelledby="h-req"
              className={dsec}
            >
              <h2 id="h-req" className={dsecH}>
                {t.requirements}
              </h2>
              <div className={twocol}>
                {l.requirements ? (
                  <div>
                    <h3 className={h4}>{t.entry}</h3>
                    <CheckList
                      items={l.requirements
                        .split("\n")
                        .filter(Boolean)
                        .map((text) => ({ text }))}
                    />
                  </div>
                ) : null}
                {l.required_documents.length ? (
                  <div>
                    <h3 className={h4}>{t.documents}</h3>
                    <CheckList
                      items={l.required_documents.map((d) => ({
                        text: documentLabel(d),
                        icon: "doc" as const,
                      }))}
                    />
                  </div>
                ) : null}
              </div>
            </motion.section>
          ) : null}

          <motion.section
            {...inView(0)}
            id="fees"
            aria-labelledby="h-fees"
            className={dsec}
          >
            <h2 id="h-fees" className={dsecH}>
              {t.fees}
            </h2>
            <KvLines>
              {l.price ? (
                <Kv
                  label={L.price}
                >{`${formatMoney(l.price)}${unit ? ` / ${unit}` : ""}`}</Kv>
              ) : null}
              {l.registration_fee ? (
                <Kv label={L.registration}>
                  {formatMoney(l.registration_fee)}
                </Kv>
              ) : null}
              {l.deposit ? (
                <Kv label={L.deposit}>{formatMoney(l.deposit)}</Kv>
              ) : null}
            </KvLines>
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
            <p className={body}>
              {l.reviews_count
                ? `${l.rating_avg} · ${l.reviews_count} ${t.verifiedReviews}`
                : L.noReviews}
            </p>
            <p className="text-fs-14 text-fg-3">{t.reviewsIntro}</p>
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
            <p className={body}>
              <Link
                href={routes.academyProfile(l.academy.slug)}
                className="font-bold text-fg-1 underline-offset-3 hover:underline"
              >
                {l.academy.name}
              </Link>
              {l.academy.address ? ` · ${l.academy.address}` : ""}
            </p>
            {l.facilities.length ? (
              <>
                <h3 className={h4}>{L.facilities}</h3>
                <CheckList items={l.facilities.map((text) => ({ text }))} />
              </>
            ) : null}
            {l.policies ? (
              <>
                <h3 className={h4}>{t.policies}</h3>
                <p className={body}>{l.policies}</p>
              </>
            ) : null}
            <p className="text-fs-14 text-fg-3">{t.policiesNote}</p>
          </motion.section>
        </div>

        <aside
          aria-label={t.sideLabel}
          className="sticky top-[calc(var(--amk-nav-h)+24px)] grid gap-4 rounded-lg border border-border-1 bg-surface-elevated p-[clamp(18px,2.2vw,24px)] le-1024:static"
        >
          {l.price ? (
            <p className="flex items-baseline gap-1.5">
              <span className="font-display text-fs-32 font-bold tabular-nums">
                {formatMoney(l.price)}
              </span>
              {unit ? (
                <span className="text-fs-14 font-medium text-fg-2">
                  / {unit}
                </span>
              ) : null}
            </p>
          ) : null}
          {chosen ? (
            <p className="flex items-center gap-2 text-fs-14 text-fg-2">
              <Icon name="calendar" size={16} /> {L.startsOn}{" "}
              <b className="text-fg-1">{DATES.fmt(chosen.start_date)}</b>
              {chosen.places_left !== null
                ? ` · ${placesLabel(chosen.places_left)}`
                : ""}
            </p>
          ) : (
            <p className="text-fs-14 text-fg-3">{L.noDates}</p>
          )}
          {applyHref ? (
            <ButtonLink href={applyHref} size="lg" block>
              {t.apply}
            </ButtonLink>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
