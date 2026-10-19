"use client"

import { LiveDashboardClient } from "@/components/family/live-applications"
import { isLive } from "@/lib/data-source"

import { motion } from "framer-motion"
import Link from "next/link"

import { TravelHandoff } from "@/components/family/travel-handoff"
import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { AppRow } from "@/components/shared/app-row"
import { CardBlock } from "@/components/shared/card-block"
import { ClubCrest } from "@/components/shared/club-crest"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { ListingCard } from "@/components/shared/listing-card"
import { Grid2, Stack } from "@/components/shared/page-grid"
import { Pitch } from "@/components/shared/pitch"
import { SectionHead } from "@/components/shared/section-head"
import { useSaveToggle } from "@/components/shared/use-save-toggle"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { FAMILY } from "@/data/family-copy"
import { fmtEuro, placesLabel } from "@/features/academies/search"
import { useFamilyDashboard } from "@/features/family/hooks"
import { enter, inView, nudge, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

const MotionLink = motion.create(Link)

/* Family dashboard (account/dashboard.html) */
/* api mode: GET /academy/me/dashboard (week 2 part 1) */
export function FamilyDashboardClient() {
  return isLive("applications") ? <LiveDashboardClient /> : <DemoDashboard />
}

function DemoDashboard() {
  const d = useFamilyDashboard()
  const onSave = useSaveToggle()
  const t = FAMILY.dashboard
  /* The visitor's local hour: the shell renders pages only after hydration. */
  const greeting = t.greeting(new Date().getHours())

  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={`${d.playerNames.join(" & ")} · ${d.counts.sent} ${t.sent}`}
        actions={
          <ButtonLink href={routes.academies()} size="sm">
            <Icon name="search" size={16} />
            <span className="le-600:hidden">{t.find}</span>
          </ButtonLink>
        }
      />
      <motion.section
        {...enter(0, 16)}
        aria-label={t.welcome}
        className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-lg bg-gf-black p-[clamp(20px,3vw,32px)] text-gf-white"
      >
        <div aria-hidden="true" className="absolute inset-0 am-stripes" />
        <Pitch
          variant="center"
          className="top-[-20%] right-[-5%] h-[140%] w-[55%] text-gf-steel"
        />
        <div className="relative grid gap-1.5">
          <p className="font-mono text-fs-12 tracking-gf-wide text-gf-mist uppercase">
            {DATES.fmt(d.today)}
          </p>
          <h2 className="font-display text-[clamp(26px,3vw,36px)] leading-none font-bold tracking-[-0.02em] uppercase">
            {greeting}, {d.parentFirst}.
          </h2>
          <p className="text-gf-chalk">{t.attention(d.action.length)}</p>
        </div>
        <ButtonLink
          href={routes.family.applications}
          variant="white"
          className="relative"
        >
          {t.allApplications} <Icon name="arrow" size={16} />
        </ButtonLink>
      </motion.section>

      {d.todos.length > 0 ? (
        <section aria-labelledby="h-todo">
          <SectionHead id="h-todo" title={t.needsAttention} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3">
            {d.todos.map((x, i) => {
              const href =
                x.kind === "draft"
                  ? routes.apply(x.app.listingId, undefined, x.app.id)
                  : `${routes.family.application(x.app.id)}${x.kind === "pay" ? "#payment" : "#respond"}`
              return (
                <motion.div
                  {...inView(i)}
                  key={x.app.id}
                  className={cn(
                    "grid gap-2 rounded-md border border-t-4 border-border-2 border-t-gf-warning bg-surface-elevated p-4",
                    x.kind === "draft" && "border-t-border-3"
                  )}
                >
                  <b className="text-fs-14">
                    {x.kind === "pay"
                      ? t.payTitle(fmtEuro(x.amount), x.first)
                      : x.kind === "info"
                        ? t.infoTitle(x.academy)
                        : t.finishTitle(x.first)}
                  </b>
                  {x.kind === "pay" ? (
                    <p className="text-fs-13 text-fg-3">
                      {x.academy} · {t.due} {DATES.fmt(x.due)}
                    </p>
                  ) : x.kind === "info" ? (
                    x.note ? (
                      <p className="text-fs-13 text-fg-3">{x.note}</p>
                    ) : null
                  ) : (
                    <p className="text-fs-13 text-fg-3">
                      {x.title} · {x.academy}
                    </p>
                  )}
                  <ButtonLink
                    href={href}
                    size="sm"
                    variant={x.kind === "draft" ? "secondary" : "primary"}
                    className="justify-self-start"
                  >
                    {x.kind === "pay"
                      ? t.payCta
                      : x.kind === "info"
                        ? t.infoCta
                        : t.finishCta}
                  </ButtonLink>
                </motion.div>
              )
            })}
          </div>
        </section>
      ) : null}

      <KpiGrid label={t.glance}>
        <KpiCard
          label={t.kpi.sent[0]}
          value={d.counts.sent}
          sub={t.kpi.sent[1]}
          icon="send"
        />
        <KpiCard
          label={t.kpi.waiting[0]}
          value={d.counts.waiting}
          sub={t.kpi.waiting[1]}
          icon="clock"
        />
        <KpiCard
          label={t.kpi.offers[0]}
          value={d.counts.offers}
          sub={t.kpi.offers[1]}
          icon="trophy"
          tone="neon"
        />
        <KpiCard
          label={t.kpi.enrolled[0]}
          value={d.counts.enrolled}
          sub={t.kpi.enrolled[1]}
          icon="checkcircle"
          tone="ink"
        />
      </KpiGrid>

      <Grid2>
        <Stack>
          <CardBlock aria-labelledby="h-recent">
            <SectionHead
              id="h-recent"
              title={t.latest}
              action={
                <Link className="am-link" href={routes.family.applications}>
                  {t.viewAll}
                </Link>
              }
            />
            <ul className="grid gap-[10px]">
              {d.recent.map((r, i) => (
                <AppRow key={r.app.id} row={r} index={i} />
              ))}
            </ul>
          </CardBlock>
          {d.recs.length > 0 ? (
            <section aria-labelledby="h-recs">
              <SectionHead
                id="h-recs"
                title={t.recs}
                sub={t.recsSub}
                action={
                  <Link className="am-link" href={routes.academies()}>
                    {t.browseAll}
                  </Link>
                }
              />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(20px,2.5vw,32px)]">
                {d.recs.map((l, i) => (
                  <ListingCard
                    key={l.id}
                    index={i}
                    listing={l}
                    saved={d.saved.includes(l.id)}
                    onSave={onSave}
                    headingLevel={3}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </Stack>
        <Stack>
          {d.handoff.map((r) => (
            <TravelHandoff
              key={r.app.id}
              city={r.listing.city}
              start={r.intakeStart}
            />
          ))}
          <CardBlock aria-labelledby="h-deadlines">
            <SectionHead
              id="h-deadlines"
              title={t.deadlines}
              action={
                <Link className="am-link" href={routes.family.saved}>
                  {t.savedLink(d.saved.length)}
                </Link>
              }
            />
            {d.deadlines.length === 0 ? (
              <p className="text-fs-14 text-fg-3">{t.noDeadlines}</p>
            ) : (
              <ul className="grid gap-2">
                {d.deadlines.map(({ l, i }) => {
                  const day = DATES.parse(i.deadline)
                  return (
                    <li key={l.id}>
                      <MotionLink
                        {...nudge(3)}
                        whileTap={{ scale: 0.99, transition: spring }}
                        href={routes.academy(l.id, i.id)}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-sm border border-border-1 px-3 py-[10px] hover:border-border-3"
                      >
                        <span
                          aria-hidden="true"
                          className="grid size-12 place-content-center rounded-[10px] bg-fg-1 text-center text-bg-0"
                        >
                          <b className="font-display text-[18px] leading-none">
                            {day?.getDate()}
                          </b>
                          <small className="font-mono text-[10px] uppercase">
                            {day ? DATES.MON[day.getMonth()] : ""}
                          </small>
                        </span>
                        <span className="grid min-w-0">
                          <b className="truncate text-fs-14">{l.title}</b>
                          <small className="text-fs-12 text-fg-3">
                            {t.applyBy} {DATES.fmt(i.deadline)} ·{" "}
                            {placesLabel(i.placesLeft)}
                          </small>
                        </span>
                        <Icon name="chevr" size={16} />
                      </MotionLink>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBlock>
          <CardBlock aria-labelledby="h-msgs">
            <SectionHead
              id="h-msgs"
              title={t.messages}
              action={
                <Link className="am-link" href={routes.family.messages()}>
                  {t.openInbox}
                </Link>
              }
            />
            <ul className="grid gap-0.5">
              {d.threads.map(({ app, listing: l, last }) => (
                <li key={app.id}>
                  <MotionLink
                    whileTap={{ scale: 0.99, transition: spring }}
                    href={routes.family.messages(app.id)}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[10px] rounded-[8px] p-[10px] hover:bg-tint-neon-1"
                  >
                    <ClubCrest
                      crest={l.crest}
                      size={30}
                      club={l.verification === "club"}
                    />
                    <span className="grid min-w-0">
                      <b className="text-fs-13">{l.academy.name}</b>
                      <small className="truncate text-fs-12 text-fg-3">
                        {last.from === "family" ? t.you : ""}
                        {last.text}
                      </small>
                    </span>
                    <small className="truncate text-fs-12 text-fg-3">
                      {DATES.fmtShort(last.at.split(" ")[0])}
                    </small>
                  </MotionLink>
                </li>
              ))}
            </ul>
          </CardBlock>
        </Stack>
      </Grid2>
    </>
  )
}
