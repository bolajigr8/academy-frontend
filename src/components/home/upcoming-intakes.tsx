"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { Icon } from "@/components/icons/icon"
import { DisplayHeading } from "@/components/shared/display-heading"
import { Eyebrow } from "@/components/shared/eyebrow"
import { Reveal } from "@/components/shared/reveal"
import { Section } from "@/components/shared/section"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { HOME } from "@/data/home-copy"
import { placesLabel } from "@/features/academies/search"
import { useHome } from "@/features/home/hooks"
import { useLiveHome } from "@/features/home/live-hooks"
import { isLive } from "@/lib/data-source"
import { cn } from "@/lib/utils"
import { inView, nudge } from "@/lib/motion"
import { routes } from "@/routes"

const MotionLink = motion.create(Link)

/* AmIntakes + .amk-intakes/.amk-intake*: js/amk-ui.jsx:328, css/amk.css:157-180 and 720 rules */
export function UpcomingIntakes() {
  return isLive("discovery") ? <LiveUpcoming /> : <DemoUpcoming />
}

function DemoUpcoming() {
  const { ready, rows } = useHome()
  const t = HOME.intakes
  return (
    <Section aria-labelledby="amk-intakes-title">
      <Reveal className="am-container grid grid-cols-[minmax(0,4fr)_minmax(0,7fr)] items-start gap-[clamp(28px,5vw,72px)] le-1024:grid-cols-[1fr]">
        <div className="sticky top-(--amk-sticky-top) grid justify-items-start gap-4 le-1024:static">
          <Eyebrow className="mb-0">{t.eyebrow}</Eyebrow>
          <DisplayHeading id="amk-intakes-title">{t.title}</DisplayHeading>
          <p className="max-w-[58ch] text-fs-18 leading-lh-relaxed text-fg-2">
            {t.lead}
          </p>
          <ButtonLink
            href={routes.academies({ start: "soon", sort: "start" })}
            variant="primary"
          >
            {t.cta}
          </ButtonLink>
        </div>
        <ol className="grid min-h-[200px] gap-[10px]">
          {ready
            ? rows.map(({ l, i }, n) => {
                const d = DATES.parse(i.start)
                return (
                  <motion.li {...inView(n)} key={i.id}>
                    <MotionLink
                      {...nudge(4)}
                      href={routes.academy(l.id, i.id)}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-[18px] rounded-md border border-border-1 bg-surface-elevated py-[14px] pr-[18px] pl-[14px] [transition:border-color_var(--dur-base)_var(--ease-out)] hover:border-border-accent le-720:grid-cols-[auto_minmax(0,1fr)_auto]"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-[62px] place-content-center rounded-[12px] bg-fg-1 text-center text-bg-0"
                      >
                        <b className="font-display text-[26px] leading-none">
                          {d?.getDate()}
                        </b>
                        <small className="font-mono text-[11px] font-bold tracking-gf-wide uppercase">
                          {d ? DATES.MON[d.getMonth()] : ""}
                        </small>
                      </span>
                      <span className="grid min-w-0 gap-0.5">
                        <b className="font-display text-fs-16">{l.title}</b>
                        <small className="text-fs-13 text-fg-3">
                          {l.academy.name} · {l.city}
                        </small>
                      </span>
                      <span className="grid gap-0.5 text-right le-720:col-start-2 le-720:row-start-2 le-720:text-left">
                        <small className="text-fs-12 text-fg-3">
                          {t.applyBy} {DATES.fmtShort(i.deadline)}
                        </small>
                        <b
                          className={cn(
                            "text-fs-13",
                            i.placesLeft <= 5 &&
                              "inline-flex items-center justify-end gap-1.5 before:size-[7px] before:rounded-full before:bg-gf-warning before:content-['']"
                          )}
                        >
                          {placesLabel(i.placesLeft)}
                        </b>
                      </span>
                      <Icon
                        name="chevr"
                        size={18}
                        className="le-720:col-start-3 le-720:row-[1/3]"
                      />
                    </MotionLink>
                  </motion.li>
                )
              })
            : null}
        </ol>
      </Reveal>
    </Section>
  )
}

/*
 * api mode: GET /academy/search?sort=start_date (5 cards with an upcoming
 * start). The card has no application deadline, so "Apply by" is not shown.
 */
function LiveUpcoming() {
  const { upcoming } = useLiveHome()
  const t = HOME.intakes
  if (upcoming && upcoming.length === 0) return null
  return (
    <Section aria-labelledby="amk-intakes-title">
      <Reveal className="am-container grid grid-cols-[minmax(0,4fr)_minmax(0,7fr)] items-start gap-[clamp(28px,5vw,72px)] le-1024:grid-cols-[1fr]">
        <div className="sticky top-(--amk-sticky-top) grid justify-items-start gap-4 le-1024:static">
          <Eyebrow className="mb-0">{t.eyebrow}</Eyebrow>
          <DisplayHeading id="amk-intakes-title">{t.title}</DisplayHeading>
          <p className="max-w-[58ch] text-fs-18 leading-lh-relaxed text-fg-2">
            {t.lead}
          </p>
          <ButtonLink
            href={`${routes.academies()}?start=soon&sort=start_date`}
            variant="primary"
          >
            {t.cta}
          </ButtonLink>
        </div>
        <ol className="grid min-h-[200px] gap-[10px]">
          {(upcoming ?? []).map((c, n) => {
            const d = DATES.parse(c.next_start_date ?? "")
            return (
              <motion.li {...inView(n)} key={c.id}>
                <MotionLink
                  {...nudge(4)}
                  href={routes.academy(c.slug)}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-[18px] rounded-md border border-border-1 bg-surface-elevated py-[14px] pr-[18px] pl-[14px] [transition:border-color_var(--dur-base)_var(--ease-out)] hover:border-border-accent le-720:grid-cols-[auto_minmax(0,1fr)_auto]"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-[62px] place-content-center rounded-[12px] bg-fg-1 text-center text-bg-0"
                  >
                    <b className="font-display text-[26px] leading-none">
                      {d?.getDate()}
                    </b>
                    <small className="font-mono text-[11px] font-bold tracking-gf-wide uppercase">
                      {d ? DATES.MON[d.getMonth()] : ""}
                    </small>
                  </span>
                  <span className="grid min-w-0 gap-0.5">
                    <b className="font-display text-fs-16">{c.title}</b>
                    <small className="text-fs-13 text-fg-3">
                      {c.academy.name} · {c.academy.city}
                    </small>
                  </span>
                  <span className="grid gap-0.5 text-right le-720:col-start-2 le-720:row-start-2 le-720:text-left">
                    {c.places_left !== null ? (
                      <b
                        className={cn(
                          "text-fs-13",
                          c.places_left <= 5 &&
                            "inline-flex items-center justify-end gap-1.5 before:size-[7px] before:rounded-full before:bg-gf-warning before:content-['']"
                        )}
                      >
                        {placesLabel(c.places_left)}
                      </b>
                    ) : null}
                  </span>
                  <Icon name="arrow" size={18} className="text-fg-3" />
                </MotionLink>
              </motion.li>
            )
          })}
        </ol>
      </Reveal>
    </Section>
  )
}
