"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { CardBlock } from "@/components/shared/card-block"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { Meter } from "@/components/shared/meter"
import { Grid2, Stack } from "@/components/shared/page-grid"
import { SectionHead } from "@/components/shared/section-head"
import { StatusBadge } from "@/components/shared/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { CLUB } from "@/data/club-copy"
import { fmtEuro } from "@/features/academies/search"
import { useClubDashboard } from "@/features/club/hooks"
import { spring } from "@/lib/motion"
import { routes } from "@/routes"

const MotionLink = motion.create(Link)
const rowTap = { whileTap: { scale: 0.99, transition: spring } } as const

import { ViewsChart } from "@/components/club/views-chart"

/* .amk-feed (css/amk-app.css:312-317): a list of linked rows */
// small phones (<=480px): the trailing pill/button/date move under the name
const feedLink =
  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[10px] rounded-[8px] p-[10px] hover:bg-tint-neon-1 le-480:grid-cols-[auto_minmax(0,1fr)] le-480:[&>*:nth-child(3)]:col-start-2"
const feedSmall = "truncate text-fs-12 text-fg-3"

/* Academy dashboard (host/dashboard.html) */
export function ClubDashboardClient() {
  const {
    academy,
    org,
    listingCount,
    kpis: k,
    todo,
    capacity,
    feed,
  } = useClubDashboard()
  const t = CLUB.dashboard

  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={`${academy.name} · ${t.subtitleSuffix}`}
        actions={
          <ButtonLink href={routes.club.newListing} variant="primary" size="sm">
            <Icon name="plus" size={16} />
            <span className="le-600:hidden">{t.create}</span>
          </ButtonLink>
        }
      />
      <KpiGrid label={t.kpiLabel}>
        <KpiCard
          label={t.kpi.applications[0]}
          value={k.received}
          sub={t.kpi.applications[1]}
          icon="inbox"
        />
        <KpiCard
          label={t.kpi.pending[0]}
          value={k.pending}
          sub={t.kpi.pending[1]}
          icon="clock"
          tone={k.pending ? "neon" : undefined}
        />
        <KpiCard
          label={t.kpi.accepted[0]}
          value={k.accepted}
          sub={t.kpi.accepted[1]}
          icon="trophy"
        />
        <KpiCard
          label={t.kpi.enrolled[0]}
          value={k.enrolled}
          sub={t.kpi.enrolled[1]}
          icon="checkcircle"
          tone="ink"
        />
        <KpiCard
          label={t.kpi.active[0]}
          value={k.activeListings}
          sub={`${listingCount - k.activeListings} ${t.notPublished}`}
          icon="layers"
        />
        <KpiCard
          label={t.kpi.views[0]}
          value={k.views.toLocaleString("en-US")}
          sub={t.kpi.views[1]}
          icon="eye"
        />
        <KpiCard
          label={t.kpi.conversion[0]}
          value={`${k.conversion}%`}
          sub={t.kpi.conversion[1]}
          icon="trend"
        />
        <KpiCard
          label={t.kpi.revenue[0]}
          value={fmtEuro(k.revenue)}
          sub={`${t.collected} · ${fmtEuro(k.commission)} ${t.golaflyFee}`}
          icon="euro"
        />
      </KpiGrid>

      <Grid2>
        <Stack>
          <CardBlock aria-labelledby="h-todo">
            <SectionHead
              id="h-todo"
              title={t.needsDecision}
              sub={t.needsDecisionSub}
              action={
                <Link href={routes.club.applications} className="am-link">
                  {t.openPipeline}
                </Link>
              }
            />
            {todo.length === 0 ? (
              <p className="text-fs-14 text-fg-3">{t.upToDate}</p>
            ) : (
              <ul className="grid gap-0.5">
                {todo.map(({ app, who, listing, age }) => (
                  <li key={app.id}>
                    <MotionLink
                      {...rowTap}
                      href={routes.club.applicant(app.id)}
                      className={feedLink}
                    >
                      <AvatarInitials
                        initials={who.initials}
                        size={36}
                        tone="soft"
                      />
                      <span className="grid min-w-0">
                        <b className="text-fs-13">
                          {who.name} · {age}
                        </b>
                        <small className={feedSmall}>
                          {listing.title} · {who.position}
                        </small>
                      </span>
                      <span className="flex flex-wrap gap-[10px]">
                        <StatusBadge status={app.status} />
                        <span
                          className={buttonVariants({
                            variant: "secondary",
                            size: "sm",
                          })}
                        >
                          {t.cta[app.status as keyof typeof t.cta]}
                        </span>
                      </span>
                    </MotionLink>
                  </li>
                ))}
              </ul>
            )}
          </CardBlock>
          <CardBlock aria-labelledby="h-views">
            <SectionHead id="h-views" title={t.views} />
            <ViewsChart total={k.views} />
          </CardBlock>
        </Stack>
        <Stack>
          <CardBlock aria-labelledby="h-cap">
            <SectionHead
              id="h-cap"
              title={t.capacity}
              action={
                <Link href={routes.club.listings} className="am-link">
                  {t.listings}
                </Link>
              }
            />
            <ul className="grid gap-[14px]">
              {capacity.map(({ listing, intake }) => (
                <li key={intake.id} className="grid gap-1.5">
                  <div className="flex justify-between gap-2 text-fs-13">
                    <span>
                      <b className="text-fs-14">{listing.title}</b>
                      <br />
                      <small className="text-fg-3">
                        {t.starts} {DATES.fmt(intake.start)} · {t.applyBy}{" "}
                        {DATES.fmtShort(intake.deadline)}
                      </small>
                    </span>
                    <b className="text-fs-14">
                      {intake.capacity - intake.placesLeft}/{intake.capacity}
                    </b>
                  </div>
                  <Meter
                    value={intake.capacity - intake.placesLeft}
                    max={intake.capacity}
                  />
                </li>
              ))}
            </ul>
          </CardBlock>
          <CardBlock aria-labelledby="h-feed">
            <SectionHead id="h-feed" title={t.activity} />
            {feed.length === 0 ? (
              <p className="text-fs-14 text-fg-3">{t.noActivity}</p>
            ) : (
              <ul className="grid gap-0.5">
                {feed.map(({ notification: n, app, who, listingTitle }) => (
                  <li key={n.id}>
                    <MotionLink
                      {...rowTap}
                      href={routes.club.applicant(app.id)}
                      className={feedLink}
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-8 place-items-center rounded-full bg-bg-3"
                      >
                        <Icon
                          name={n.type === "message" ? "chat" : "bell"}
                          size={15}
                        />
                      </span>
                      <span className="grid min-w-0">
                        <b className="text-fs-13">{n.title}</b>
                        <small className={feedSmall}>
                          {who.name} · {n.note || listingTitle}
                        </small>
                      </span>
                      <small className={feedSmall}>
                        {DATES.fmtShort(n.at.split(" ")[0])}
                      </small>
                    </MotionLink>
                  </li>
                ))}
              </ul>
            )}
          </CardBlock>
          <CardBlock aria-labelledby="h-verify">
            <SectionHead
              id="h-verify"
              title={t.verification}
              action={
                <Link href={routes.club.profile} className="am-link">
                  {t.academyProfile}
                </Link>
              }
            />
            <p className="text-fs-14 text-fg-3">
              {org.name} {t.verificationText}
            </p>
          </CardBlock>
        </Stack>
      </Grid2>
    </>
  )
}
