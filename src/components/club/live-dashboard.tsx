"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { CardBlock } from "@/components/shared/card-block"
import { ErrorState } from "@/components/shared/error-state"
import { Grid2, Stack } from "@/components/shared/page-grid"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { Meter } from "@/components/shared/meter"
import { NativeSelect } from "@/components/shared/native-select"
import { SectionHead } from "@/components/shared/section-head"
import { StatusBadge } from "@/components/shared/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { CLUB } from "@/data/club-copy"
import { LIVE } from "@/data/live-copy"
import { listAcademies, listAllListings } from "@/features/club/api"
import { listInbox } from "@/features/club/applications-api"
import { clubKeys } from "@/features/club/query-keys"
import { stampOf } from "@/features/messages/conversations"
import {
  listNotifications,
  notificationKeys,
} from "@/features/notifications/api"
import {
  getAcademyDashboard,
  listPortalReviews,
  reviewKeys,
} from "@/features/reviews/api"
import { addDays, todayISO } from "@/lib/date"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

const t = CLUB.dashboard
const L = LIVE.dashboard
const feedLink =
  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[10px] rounded-[8px] p-[10px] hover:bg-tint-neon-1 le-480:grid-cols-[auto_minmax(0,1fr)] le-480:[&>*:nth-child(3)]:col-start-2"
const money = (minor: number, currency: string) =>
  formatMoney({
    amount_minor: minor,
    amount: (minor / 100).toFixed(2),
    currency,
  })

/*
 * The academy dashboard (week 3 part 2, section 13), in the prototype's
 * layout. The numbers come from GET /academy/portal/dashboard (period figures
 * follow the chosen range; the snapshot is as of now); the other cards use the
 * endpoints the contract names: applications waiting for a decision, the
 * listings' intakes for capacity, the notifications for recent activity, the
 * academy's verification, and the reviews waiting for a reply.
 */
export function LiveDashboardClient() {
  const [days, setDays] = useState(30)
  const range = days === 30 ? {} : { from: addDays(todayISO(), -(days - 1)) }
  const dash = useQuery({
    queryKey: reviewKeys.dashboard(range),
    queryFn: () => getAcademyDashboard(range),
  })
  const todo = useQuery({
    queryKey: [...clubKeys.all, "inbox", "todo"],
    queryFn: () =>
      listInbox({
        status: ["submitted", "under_review", "accepted"],
        per_page: 5,
      }),
  })
  const listings = useQuery({
    queryKey: clubKeys.listings(),
    queryFn: listAllListings,
  })
  const academies = useQuery({
    queryKey: clubKeys.academies(),
    queryFn: listAcademies,
  })
  const feed = useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => listNotifications(20),
  })
  const toAnswer = useQuery({
    queryKey: reviewKeys.portal({ needs_reply: true, per_page: 3 }),
    queryFn: () => listPortalReviews({ needs_reply: true, per_page: 3 }),
  })
  const d = dash.data
  const p = d?.period
  const eurRevenue = p?.revenue.find((r) => r.currency === "EUR")
  const academy = academies.data?.[0]
  const capacity = (listings.data ?? [])
    .filter((l) => l.status === "published")
    .flatMap((l) =>
      l.intakes
        .filter((i) => i.capacity !== null && i.status !== "closed")
        .map((i) => ({ listing: l, intake: i }))
    )
    .slice(0, 5)
  const maxWeek = Math.max(1, ...(d?.views_by_week ?? []).map((w) => w.views))

  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={
          d
            ? `${academy?.name ?? ""}${academy ? " · " : ""}${DATES.fmt(d.range.from)} – ${DATES.fmt(d.range.to)}`
            : undefined
        }
        actions={
          <ButtonLink href={routes.club.newListing} variant="primary" size="sm">
            <Icon name="plus" size={16} />
            <span className="le-600:hidden">{t.create}</span>
          </ButtonLink>
        }
      />
      <label className="flex items-center gap-2 justify-self-start text-fs-13 font-semibold text-fg-2">
        {L.rangeLabel}
        <NativeSelect
          size="sm"
          value={String(days)}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          {L.ranges.map((r) => (
            <option key={r.days} value={r.days}>
              {r.label}
            </option>
          ))}
        </NativeSelect>
      </label>

      {dash.isError && !d ? (
        <ErrorState
          message={LIVE.requestFailed}
          onRetry={() => void dash.refetch()}
        />
      ) : (
        <KpiGrid label={t.kpiLabel}>
          <KpiCard
            label={t.kpi.applications[0]}
            value={p ? p.applications_received : "…"}
            sub={L.received}
            icon="inbox"
          />
          <KpiCard
            label={t.kpi.pending[0]}
            value={d ? d.snapshot.pending_applications : "…"}
            sub={t.kpi.pending[1]}
            icon="clock"
            tone={d?.snapshot.pending_applications ? "neon" : undefined}
          />
          <KpiCard
            label={t.kpi.accepted[0]}
            value={p ? p.accepted_applications : "…"}
            sub={t.kpi.accepted[1]}
            icon="trophy"
          />
          <KpiCard
            label={t.kpi.enrolled[0]}
            value={p ? p.enrolled_players : "…"}
            sub={
              p
                ? L.enrollRate(p.application_to_enrollment.rate) ||
                  L.enrolledSub
                : L.enrolledSub
            }
            icon="checkcircle"
            tone="ink"
          />
          <KpiCard
            label={t.kpi.active[0]}
            value={d ? d.snapshot.active_listings : "…"}
            sub={
              d
                ? `${d.snapshot.not_published_listings} ${t.notPublished}`
                : undefined
            }
            icon="layers"
          />
          <KpiCard
            label={t.kpi.views[0]}
            value={p ? p.listing_views.toLocaleString("en-US") : "…"}
            sub={
              d
                ? days === 30
                  ? t.kpi.views[1]
                  : (L.ranges.find((r) => r.days === days)?.label ?? "")
                : undefined
            }
            icon="eye"
          />
          <KpiCard
            label={t.kpi.conversion[0]}
            value={
              p
                ? p.view_to_application.rate === null
                  ? "—"
                  : `${p.view_to_application.rate}%`
                : "…"
            }
            sub={
              p
                ? p.view_to_application.rate === null
                  ? L.noViews
                  : L.conversionSub(
                      p.view_to_application.applications,
                      p.view_to_application.views
                    )
                : undefined
            }
            icon="trend"
          />
          <KpiCard
            label={t.kpi.revenue[0]}
            value={
              // euros only on the academy's dashboard
              p
                ? eurRevenue
                  ? money(eurRevenue.net_minor, "EUR")
                  : L.revenueNone
                : "…"
            }
            sub={p ? (eurRevenue ? L.revenueSub : L.revenueSoon) : undefined}
            icon="euro"
          />
        </KpiGrid>
      )}

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
            {!todo.data ? (
              <p className="text-fs-14 text-fg-3" aria-busy="true">
                …
              </p>
            ) : todo.data.data.length === 0 ? (
              <p className="text-fs-14 text-fg-3">{t.upToDate}</p>
            ) : (
              <ul className="grid gap-0.5">
                {todo.data.data.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={routes.club.applicant(String(a.id))}
                      className={feedLink}
                    >
                      <AvatarInitials
                        initials={`${a.player.first_name.charAt(0)}${a.player.last_name.charAt(0)}`.toUpperCase()}
                        size={36}
                        tone="soft"
                      />
                      <span className="grid min-w-0">
                        <b className="text-fs-13">
                          {a.player.first_name} {a.player.last_name}
                        </b>
                        <small className="truncate text-fs-12 text-fg-3">
                          {a.listing.title}
                        </small>
                      </span>
                      <span className="flex flex-wrap items-center gap-[10px]">
                        <StatusBadge status={a.status} />
                        <span
                          className={cn(
                            buttonVariants({
                              variant:
                                a.status === "accepted"
                                  ? "primary"
                                  : "secondary",
                              size: "sm",
                            }),
                            "pointer-events-none whitespace-nowrap"
                          )}
                        >
                          {t.cta[a.status as keyof typeof t.cta] ?? ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBlock>

          <CardBlock aria-labelledby="h-views">
            <SectionHead id="h-views" title={t.views} sub={L.viewsSub} />
            {d ? (
              <ol
                aria-label={t.views}
                className="grid grid-cols-[repeat(8,minmax(0,1fr))] items-end gap-2"
              >
                {d.views_by_week.map((w, i) => (
                  <li
                    key={w.week_start}
                    className="grid justify-items-center gap-1"
                  >
                    <span className="font-mono text-[11px] text-fg-3 tabular-nums">
                      {w.views}
                    </span>
                    {/* a fixed-height track, so the bar's percentage height resolves */}
                    <span className="flex h-28 w-full items-end justify-center">
                      <span
                        aria-label={`${L.weekOf(DATES.fmtShort(w.week_start))}: ${w.views}`}
                        className={cn(
                          "block w-full max-w-10 rounded-t-[6px] bg-bg-4",
                          i === d.views_by_week.length - 1 && "bg-gf-neon"
                        )}
                        style={{
                          height: `${Math.max(4, (w.views / maxWeek) * 100)}%`,
                        }}
                      />
                    </span>
                    {/* small phones: no date labels (the numbers and "the last 8 weeks" say it) */}
                    <span className="text-[10px] whitespace-nowrap text-fg-4 le-480:hidden">
                      {DATES.fmtShort(w.week_start)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="h-40 animate-pulse rounded-md bg-bg-2" />
            )}
          </CardBlock>

          <CardBlock aria-labelledby="h-reviews">
            <SectionHead
              id="h-reviews"
              title={L.reviewsToAnswer}
              sub={L.reviewsToAnswerSub}
              action={
                <Link
                  href={`${routes.club.profile}#reviews`}
                  className="am-link"
                >
                  {L.allReviews}
                </Link>
              }
            />
            {toAnswer.data && toAnswer.data.data.length === 0 ? (
              <p className="text-fs-14 text-fg-3">{L.noReviewsToAnswer}</p>
            ) : (
              <ul className="grid gap-2">
                {(toAnswer.data?.data ?? []).map((r) => (
                  <li
                    key={r.id}
                    className="grid gap-1 rounded-md border border-border-1 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <b className="text-fs-14">
                        {r.author} · {r.overall}/5
                      </b>
                      <ButtonLink
                        href={`${routes.club.profile}#review-${r.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        {L.answer}
                      </ButtonLink>
                    </div>
                    <small className="text-fs-12 text-fg-3">
                      {r.listing.title}
                    </small>
                    <p className="line-clamp-2 text-fs-13 text-fg-2">
                      {r.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
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
            {listings.data && capacity.length === 0 ? (
              <p className="text-fs-14 text-fg-3">{L.capacityNone}</p>
            ) : (
              <ul className="grid gap-[14px]">
                {capacity.map(({ listing, intake }) => {
                  const cap = intake.capacity ?? 0
                  const taken = cap - (intake.places_left ?? cap)
                  return (
                    <li key={intake.id} className="grid gap-1.5">
                      <div className="flex justify-between gap-2 text-fs-13">
                        <span>
                          <b className="text-fs-14">{listing.title}</b>
                          <br />
                          <small className="text-fg-3">
                            {t.starts} {DATES.fmt(intake.start_date)}
                            {intake.application_deadline
                              ? ` · ${t.applyBy} ${DATES.fmtShort(intake.application_deadline)}`
                              : ""}
                          </small>
                        </span>
                        <b className="text-fs-14">
                          {taken}/{cap}
                        </b>
                      </div>
                      <Meter value={taken} max={Math.max(1, cap)} />
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBlock>

          <CardBlock aria-labelledby="h-feed">
            <SectionHead id="h-feed" title={t.activity} />
            {feed.data && feed.data.data.length === 0 ? (
              <p className="text-fs-14 text-fg-3">{t.noActivity}</p>
            ) : (
              <ul className="grid gap-0.5">
                {(feed.data?.data ?? []).slice(0, 6).map((n) => (
                  <li key={n.id}>
                    <Link
                      href={
                        n.target?.type === "application"
                          ? routes.club.applicant(String(n.target.id))
                          : n.target?.type === "listing"
                            ? routes.club.editListing(String(n.target.id))
                            : routes.club.profile
                      }
                      className={feedLink}
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-8 place-items-center rounded-full bg-bg-3"
                      >
                        <Icon
                          name={n.type === "new_message" ? "chat" : "bell"}
                          size={15}
                        />
                      </span>
                      <span className="grid min-w-0">
                        <b className="text-fs-13">{n.title}</b>
                        <small className="truncate text-fs-12 text-fg-3">
                          {n.text}
                        </small>
                      </span>
                      <small className="text-fs-12 text-fg-3">
                        {DATES.fmtShort(stampOf(n.created_at).slice(0, 10))}
                      </small>
                    </Link>
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
              {academy
                ? `${academy.name} ${L.verification[academy.verification_status] ?? ""}`
                : "…"}
            </p>
          </CardBlock>
        </Stack>
      </Grid2>
    </>
  )
}
