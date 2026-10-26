"use client"

import { MyPlayers } from "@/components/family/my-players"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { CardBlock } from "@/components/shared/card-block"
import { EmptyState } from "@/components/shared/empty-state"
import { FormField } from "@/components/shared/form-field"
import { FormRow } from "@/components/shared/form-row"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { NativeSelect } from "@/components/shared/native-select"
import { QueryState } from "@/components/shared/query-state"
import { SectionHead } from "@/components/shared/section-head"
import { StatusBadge } from "@/components/shared/status-badge"
import { AcademyLogo } from "@/components/shared/academy-logo"
import { DATES } from "@/data/catalog"
import { stampOf } from "@/features/messages/conversations"
import { isLive } from "@/lib/data-source"
import { buttonVariants } from "@/components/ui/button"
import { Notice } from "@/components/shared/notice"
import { ButtonLink } from "@/components/ui/button-link"
import { cn } from "@/lib/utils"
import { FAMILY } from "@/data/family-copy"
import { STATUS, STATUS_ORDER } from "@/features/applications/flow"
import { useSession } from "@/features/auth/session"
import {
  getDashboard,
  listApplications,
  type ApiAppSummary,
  type ApiDashboard,
} from "@/features/family/api"
import { useLivePlayers } from "@/features/family/hooks"
import { familyKeys } from "@/features/family/query-keys"
import { LIVE } from "@/data/live-copy"
import { inView } from "@/lib/motion"
import { routes } from "@/routes"

/*
 * The family's applications list and dashboard in api mode
 * (GET /academy/me/applications, GET /academy/me/dashboard).
 */

/** One application row: status, program, academy, player, start date; opens the application */
export function LiveAppRow({ a, i = 0 }: { a: ApiAppSummary; i?: number }) {
  const r = FAMILY.row
  return (
    <motion.li {...inView(i)}>
      <Link
        href={routes.family.application(String(a.id))}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border-1 bg-surface-elevated p-[14px] hover:border-border-accent le-480:grid-cols-[minmax(0,1fr)]"
      >
        <span className="grid min-w-0 gap-1">
          <StatusBadge status={a.status} />
          <b className="font-display text-fs-16">{a.listing.title}</b>
          <small className="text-fs-14 text-fg-3">
            {[
              a.listing.academy.name,
              `${a.player.first_name} ${a.player.last_name}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </small>
          <small className="text-fs-13 text-fg-3">
            {r.starts} {DATES.fmt(a.intake.start_date)} · {r.updated}{" "}
            {DATES.fmt(a.updated_at.slice(0, 10))}
          </small>
        </span>
        {/* the whole card opens it; the end of the card looks like the button it is */}
        <span
          className={cn(
            buttonVariants({
              variant:
                a.status === "draft" || a.status === "enrollment_pending"
                  ? "primary"
                  : "secondary",
              size: "sm",
            }),
            "pointer-events-none whitespace-nowrap le-480:justify-self-start"
          )}
        >
          {a.status === "draft"
            ? r.continue
            : a.status === "enrollment_pending"
              ? LIVE.enrollment.viewAndPay
              : r.view}
          <Icon name="chevr" size={16} />
        </span>
      </Link>
    </motion.li>
  )
}

export function LiveApplicationsClient({
  player: initialPlayer,
}: {
  player: string
}) {
  const t = FAMILY.applications
  const { user } = useSession()
  const players = useLivePlayers()
  const [status, setStatus] = useState("")
  const [player, setPlayer] = useState(
    /^\d+$/.test(initialPlayer) ? initialPlayer : ""
  )
  const filters = {
    status: status || undefined,
    player_id: player ? Number(player) : undefined,
  }
  const query = useQuery({
    queryKey: familyKeys.applications(filters),
    queryFn: () => listApplications(filters),
    enabled: user?.role === "applicant",
  })
  return (
    <>
      <PageHeading title={t.title} subtitle={t.subtitle} />
      <FormRow>
        <FormField id="apps-status" optionalMarker={false} label={t.byStatus}>
          {(p) => (
            <NativeSelect
              {...p}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">{LIVE.applicationsList.all}</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS[s].label}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField id="apps-player" optionalMarker={false} label={t.byPlayer}>
          {(p) => (
            <NativeSelect
              {...p}
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
            >
              <option value="">{t.allPlayers}</option>
              {(players.data?.players ?? []).map((x) => (
                <option key={x.id} value={String(x.id)}>
                  {x.first_name} {x.last_name}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
      </FormRow>
      <QueryState
        query={{ ...query, data: query.data?.data }}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[320px] animate-pulse rounded-lg bg-bg-2" />
        }
        isEmpty={(rows) => rows.length === 0}
        empty={
          <EmptyState
            icon="layers"
            title={LIVE.applicationsList.emptyTitle}
            text={LIVE.applicationsList.emptyText}
          />
        }
      >
        {(rows) => (
          <ul className="grid gap-[10px]">
            {rows.map((a, i) => (
              <LiveAppRow key={a.id} a={a} i={i} />
            ))}
          </ul>
        )}
      </QueryState>
      <p className="text-fs-13 text-fg-3">{t.statusNote}</p>
    </>
  )
}

export function LiveDashboardClient() {
  const t = FAMILY.dashboard
  const { user } = useSession()
  const query = useQuery({
    queryKey: familyKeys.dashboard(),
    queryFn: getDashboard,
    enabled: user?.role === "applicant",
  })
  const first = user?.name.split(" ")[0] ?? ""
  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={
          query.data
            ? `${first} · ${query.data.applications.total - query.data.applications.by_status.draft} ${t.sent}`
            : first
        }
      />
      <QueryState
        query={query}
        errorFallback={LIVE.requestFailed}
        empty={null}
        skeleton={
          <div className="h-[420px] animate-pulse rounded-lg bg-bg-2" />
        }
      >
        {(d) => {
          const s = d.applications.by_status
          const sent = d.applications.total - s.draft
          return (
            <>
              {/* what an academy is waiting for: hard to miss, one tap away */}
              <ActionNeeded d={d} />
              <KpiGrid label={t.title}>
                <KpiCard
                  label={t.kpi.sent[0]}
                  value={sent}
                  sub={t.kpi.sent[1]}
                />
                <KpiCard
                  label={t.kpi.waiting[0]}
                  value={s.submitted + s.under_review + s.info_required}
                  sub={t.kpi.waiting[1]}
                />
                <KpiCard
                  label={t.kpi.offers[0]}
                  value={s.accepted + s.enrollment_pending}
                  sub={t.kpi.offers[1]}
                />
                <KpiCard
                  label={t.kpi.enrolled[0]}
                  value={s.enrolled}
                  sub={t.kpi.enrolled[1]}
                />
              </KpiGrid>
              <MyPlayers />
              <CardBlock aria-labelledby="h-latest">
                <SectionHead
                  id="h-latest"
                  title={t.latest}
                  action={
                    <Link href={routes.family.applications} className="am-link">
                      {t.allApplications}
                    </Link>
                  }
                />
                {d.recent_applications.length ? (
                  <ul className="grid gap-[10px]">
                    {d.recent_applications.map((a, i) => (
                      <LiveAppRow key={a.id} a={a} i={i} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon="layers"
                    title={LIVE.applicationsList.emptyTitle}
                    text={LIVE.applicationsList.emptyText}
                  />
                )}
              </CardBlock>
              {/* the prototype's Messages card: the recent applications that
                  have a conversation (last_message, unread_messages, section 14) */}
              {isLive("messages") &&
              d.recent_applications.some((a) => a.last_message) ? (
                <CardBlock aria-labelledby="h-msgs">
                  <SectionHead
                    id="h-msgs"
                    title={
                      d.unread_messages
                        ? `${t.messages} · ${d.unread_messages}`
                        : t.messages
                    }
                    action={
                      <Link className="am-link" href={routes.family.messages()}>
                        {t.openInbox}
                      </Link>
                    }
                  />
                  <ul className="grid gap-0.5">
                    {d.recent_applications
                      .filter((a) => a.last_message)
                      .map((a) => (
                        <li key={a.id}>
                          <Link
                            href={routes.family.messages(String(a.id))}
                            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[10px] rounded-[8px] p-[10px] hover:bg-tint-neon-1"
                          >
                            <AcademyLogo
                              id={
                                a.listing.academy.slug ?? a.listing.academy.name
                              }
                              name={a.listing.academy.name}
                              logoUrl={a.listing.academy.logo_url}
                              size={30}
                            />
                            <span className="grid min-w-0">
                              <b
                                className={cn(
                                  "text-fs-13",
                                  a.unread_messages > 0 && "font-bold"
                                )}
                              >
                                {a.listing.academy.name}
                              </b>
                              <small className="truncate text-fs-12 text-fg-3">
                                {a.last_message?.sender_side === "applicant"
                                  ? t.you
                                  : ""}
                                {a.last_message?.body ??
                                  LIVE.messages.attachment}
                              </small>
                            </span>
                            <small className="text-fs-12 whitespace-nowrap text-fg-3">
                              {DATES.fmtShort(
                                stampOf(
                                  a.last_message?.sent_at ?? a.updated_at
                                ).slice(0, 10)
                              )}
                            </small>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </CardBlock>
              ) : null}
            </>
          )
        }}
      </QueryState>
    </>
  )
}

/*
 * The family's to-dos from the dashboard counts (week 2 part 1): an academy
 * asked for more information (info_required), or a place is waiting for its
 * payment (enrollment_pending). The bell and the email say the same; this
 * keeps it in view on the dashboard.
 */
function ActionNeeded({ d }: { d: ApiDashboard }) {
  const A = LIVE.actionNeeded
  const info = d.applications.by_status.info_required ?? 0
  const pay = d.applications.by_status.enrollment_pending ?? 0
  if (!info && !pay) return null
  const firstOf = (status: string) =>
    d.recent_applications.find((a) => a.status === status)
  const link = (status: string) => {
    const a = firstOf(status)
    return a
      ? routes.family.application(String(a.id))
      : `${routes.family.applications}?status=${status}`
  }
  return (
    <div className="grid gap-2">
      {info ? (
        <Notice tone="warning" icon="alert">
          <span className="flex flex-wrap items-center justify-between gap-3">
            <span>{A.info(info)}</span>
            <ButtonLink href={link("info_required")} size="sm">
              {info === 1 ? A.open : A.openFirst}
            </ButtonLink>
          </span>
        </Notice>
      ) : null}
      {pay ? (
        <Notice tone="warning" icon="wallet">
          <span className="flex flex-wrap items-center justify-between gap-3">
            <span>{A.pay(pay)}</span>
            <ButtonLink href={routes.family.payments} size="sm">
              {LIVE.enrollment.goPayments}
            </ButtonLink>
          </span>
        </Notice>
      ) : null}
    </div>
  )
}
