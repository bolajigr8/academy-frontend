"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Icon, type IconName } from "@/components/icons/icon"
import { ClubCrest } from "@/components/shared/club-crest"
import { Crest } from "@/components/shared/crest"
import { Eyebrow } from "@/components/shared/eyebrow"
import { Pitch } from "@/components/shared/pitch"
import { SafeImage } from "@/components/shared/safe-image"
import { StatusPill } from "@/components/shared/status-pill"
import { HERO, TRUST } from "@/data/copy"
import { HOME } from "@/data/home-copy"
import { SEARCH } from "@/data/search-copy"
import {
  LIVE_DEFAULT,
  LIVE_DURATIONS,
  liveStartOptions,
  toLiveQuery,
  typeWord,
} from "@/features/academies/live-search"
import { DEFAULT_STATE, toQuery } from "@/features/academies/search"
import { useHome } from "@/features/home/hooks"
import { useLiveHome } from "@/features/home/live-hooks"
import { isLive } from "@/lib/data-source"
import { todayISO } from "@/lib/date"
import { easeOut, enter, inView, press } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

import { SearchBar, type SearchDraft } from "@/components/shared/search-bar"

const MotionLink = motion.create(Link)

const statNumber =
  "font-display text-[clamp(36px,4vw,52px)] leading-[0.85] font-bold tracking-[-0.04em] text-fg-1 tabular-nums"
const statLabel = "font-mono text-[11px] tracking-gf-wide text-fg-3 uppercase"

/* AmHero + .amk-hero*, .amk-trust*: js/amk-ui.jsx:220, css/amk.css:97-139 and responsive rules */
export function HomeHero() {
  const router = useRouter()
  const home = useHome()
  // api mode: the numbers, the glimpse card, the chips and the search come from the backend
  const live = isLive("discovery")
  const api = useLiveHome(live)
  // the floating card pairs a program with an "Accepted" status: decoration in
  // the prototype, an invented claim with real listings, so api mode leaves it out
  const glimpse = live ? null : home.glimpse
  const today = home.ready ? todayISO() : ""
  const [draft, setDraft] = useState<SearchDraft>({
    loc: "",
    age: "",
    type: "",
    start: "",
    dur: "",
  })
  /* Before hydration only the date-free start options are known. */
  const startOptions = live
    ? today
      ? liveStartOptions(today)
      : liveStartOptions("2000-01-01").slice(0, 2)
    : home.ready
      ? home.startOptions
      : home.startOptions.slice(0, 2)
  const liveTypes = (api.filters?.academy_types ?? []).map((v) => ({
    value: v,
    label: typeWord(v),
  }))

  return (
    <section
      aria-labelledby="amk-hero-title"
      className="relative overflow-hidden pt-[clamp(40px,5vw,72px)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 am-stripes opacity-70"
      />
      <Pitch
        variant="full"
        className="top-9 right-[-6%] h-[78%] w-[62%] opacity-90 le-1024:h-1/2 le-1024:w-[90%]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-20%] right-[30%] bottom-[30%] left-[-20%] bg-(image:--grad-radial-soft)"
      />
      <div className="relative am-container grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-center gap-[clamp(28px,5vw,72px)] le-1024:grid-cols-[1fr]">
        <div>
          <motion.div {...enter(0)}>
            <Eyebrow>{HERO.eyebrow}</Eyebrow>
          </motion.div>
          <motion.h1
            {...enter(1)}
            id="amk-hero-title"
            className="mb-5 font-display text-[clamp(40px,5.6vw,72px)] leading-[0.98] font-bold tracking-[-0.03em] text-fg-1 uppercase"
          >
            {HERO.titleA}{" "}
            <span className="text-amk-accent-ink [text-shadow:var(--glow-neon-text)]">
              {HERO.titleB}
            </span>
          </motion.h1>
          <motion.p
            {...enter(2)}
            className="max-w-[58ch] text-fs-18 leading-lh-relaxed text-fg-2"
          >
            {HERO.lead}
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.16, ease: easeOut }}
          className="relative le-1024:max-w-[640px]"
        >
          <div className="relative aspect-[5/4] overflow-hidden rounded-[28px_28px_28px_80px] border border-border-2 bg-bg-3 shadow-(--shadow-lg) le-720:aspect-[4/3] le-720:rounded-[18px_18px_18px_48px]">
            <SafeImage
              src={HERO.photo}
              alt={HERO.photoAlt}
              fill
              preload
              sizes="(max-width: 1024px) min(640px, 100vw), 42vw"
              className="object-cover [filter:var(--filter-media)]"
            />
            <span aria-hidden="true" className="absolute top-4 right-4">
              <Crest size={64} />
            </span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={
              home.ready && (!live || api.total !== null)
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 16 }
            }
            transition={{ duration: 0.45, delay: 0.35, ease: easeOut }}
            className={cn(
              "absolute -bottom-7 -left-6 flex gap-[22px] rounded-md border border-glass-border bg-glass-bg-strong px-[22px] py-4 shadow-(--shadow-md) am-glass le-1024:left-3 le-720:relative le-720:bottom-0 le-720:left-0 le-720:mt-3 le-720:justify-between le-480:gap-3 le-480:px-[14px] le-480:py-3",
              (!home.ready || (live && api.total === null)) && "invisible"
            )}
          >
            {live ? (
              <>
                {/* only what the API gives: public programs and their countries */}
                <div className="grid gap-0.5">
                  <b className={statNumber}>{api.total ?? 0}</b>
                  <span className={statLabel}>{SEARCH.programs}</span>
                </div>
                <div className="grid gap-0.5">
                  <b className={statNumber}>
                    {api.filters?.countries.length ?? 0}
                  </b>
                  <span className={statLabel}>{HOME.stats.countries}</span>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-0.5">
                  <b className={statNumber}>
                    {home.ready ? home.stats.academies : 0}
                  </b>
                  <span className={statLabel}>{HOME.stats.academies}</span>
                </div>
                <div className="grid gap-0.5">
                  <b className={statNumber}>
                    {home.ready ? home.stats.countries : 0}
                  </b>
                  <span className={statLabel}>{HOME.stats.countries}</span>
                </div>
                <div className="grid gap-0.5">
                  <b className={statNumber}>
                    {home.ready ? home.stats.intakes : 0}
                  </b>
                  <span className={statLabel}>{HOME.stats.intakes}</span>
                </div>
              </>
            )}
          </motion.div>
          {glimpse ? (
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
              transition={{
                opacity: { duration: 0.45, delay: 0.5 },
                x: { duration: 0.45, delay: 0.5, ease: easeOut },
                y: {
                  duration: 4,
                  delay: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className="absolute top-[40%] -right-4 flex max-w-[290px] items-center gap-[10px] rounded-md border border-border-2 bg-surface-elevated px-3 py-[10px] shadow-(--shadow-lg) le-1024:right-3 le-720:hidden"
            >
              <ClubCrest crest={glimpse.crest} size={34} />
              <div className="grid min-w-0">
                <b className="truncate text-fs-13">{glimpse.title}</b>
                <small className="truncate text-fs-12 text-fg-3">
                  {glimpse.academy}
                </small>
              </div>
              <StatusPill tone="success">{HOME.glimpseStatus}</StatusPill>
            </motion.div>
          ) : null}
        </motion.div>
      </div>
      <motion.div
        {...enter(4)}
        className="relative am-container mt-[clamp(48px,5vw,64px)] le-720:mt-7"
      >
        <SearchBar
          value={draft}
          onChange={setDraft}
          onSubmit={(v) =>
            router.push(
              routes.academies() +
                (live
                  ? toLiveQuery({
                      ...LIVE_DEFAULT,
                      q: v.loc,
                      age: v.age,
                      type: v.type,
                      start: v.start,
                      dur: v.dur,
                    })
                  : toQuery({ ...DEFAULT_STATE, ...v }))
            )
          }
          startOptions={startOptions}
          {...(live
            ? {
                typeOptions: liveTypes,
                durationOptions: LIVE_DURATIONS.map((d) => ({
                  value: d.id,
                  label: d.label,
                })),
              }
            : {})}
          idPrefix="amk-hero"
        />
        <div className="mt-[14px] flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="flex items-center gap-2 text-fs-13 text-fg-3">
            <Icon name="info" size={14} />
            {HERO.searchHint}
          </p>
          <div
            role="group"
            aria-label={HOME.popularGroup}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
              {HERO.popularLabel}
            </span>
            {(live
              ? (api.filters?.countries ?? []).slice(0, 4).map((c) => ({
                  country: c.code,
                  label: c.name,
                }))
              : HERO.popular
            ).map((p) => (
              <MotionLink
                {...press}
                key={p.country}
                href={
                  live
                    ? `${routes.academies()}?country=${p.country}`
                    : routes.academies({ country: p.country })
                }
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-pill border border-border-2 bg-surface-elevated px-[13px] py-[5px] text-fs-13 font-semibold text-fg-2 [transition:border-color_var(--dur-base)_var(--ease-out),color_var(--dur-base)_var(--ease-out),background_var(--dur-base)] hover:border-border-accent hover:bg-tint-neon-1 hover:text-fg-1"
              >
                <>
                  <Icon name="pin" size={13} /> {p.label}
                </>
              </MotionLink>
            ))}
          </div>
        </div>
      </motion.div>
      <div className="am-container">
        <ul
          aria-label={HOME.trustLabel}
          className="relative mt-[clamp(36px,4vw,56px)] grid grid-cols-[repeat(4,1fr)] gap-6 border-t border-border-1 py-8 le-1024:grid-cols-[repeat(2,1fr)] le-480:grid-cols-[1fr]"
        >
          {TRUST.map((x, i) => (
            <motion.li
              {...inView(i)}
              key={x.title}
              className="flex items-start gap-3"
            >
              <>
                <span
                  aria-hidden="true"
                  className="grid size-10 flex-none place-items-center rounded-full bg-gf-neon text-text-on-neon"
                >
                  <Icon name={x.icon as IconName} size={20} />
                </span>
                <span>
                  <strong className="block text-fs-14 text-fg-1">
                    {x.title}
                  </strong>
                  <small className="mt-0.5 block text-fs-13 text-fg-3">
                    {x.sub}
                  </small>
                </span>
              </>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
