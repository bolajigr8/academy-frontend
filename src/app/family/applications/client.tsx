"use client"

import { LiveApplicationsClient } from "@/components/family/live-applications"
import { isLive } from "@/lib/data-source"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { AppRow } from "@/components/shared/app-row"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { EmptyState } from "@/components/shared/empty-state"
import { SegmentedControl } from "@/components/shared/segmented-control"
import { ButtonLink } from "@/components/ui/button-link"
import { EMPTY } from "@/data/copy"
import { FAMILY } from "@/data/family-copy"
import { GROUPS } from "@/features/applications/flow"
import { useFamilyApplications } from "@/features/family/hooks"
import { press } from "@/lib/motion"
import { routes } from "@/routes"

/* .amk-chip (css/amk.css:139-146): pressed = ink */
const chip =
  "inline-flex min-h-[34px] items-center gap-1.5 rounded-pill border border-border-2 bg-surface-elevated px-[13px] py-[5px] text-fs-13 font-semibold text-fg-2 [transition:border-color_var(--dur-base)_var(--ease-out),color_var(--dur-base)_var(--ease-out),background_var(--dur-base)] hover:border-border-accent hover:bg-tint-neon-1 hover:text-fg-1 aria-pressed:border-fg-1 aria-pressed:bg-fg-1 aria-pressed:text-bg-0"

/* Family applications list (account/applications.html): status tabs with counts and a player filter */
/* api mode: GET /academy/me/applications (week 2 part 1) */
export function FamilyApplicationsClient(props: {
  tab: string
  player: string
}) {
  return isLive("applications") ? (
    <LiveApplicationsClient player={props.player} />
  ) : (
    <DemoApplications {...props} />
  )
}

function DemoApplications({
  tab: initialTab,
  player: initialPlayer,
}: {
  tab: string
  player: string
}) {
  const [tab, setTab] = useState(initialTab)
  const [player, setPlayer] = useState(initialPlayer)
  const { players, count, rows } = useFamilyApplications(tab, player)
  const t = FAMILY.applications

  useEffect(() => {
    const q = new URLSearchParams()
    if (tab !== "all") q.set("tab", tab)
    if (player !== "all") q.set("player", player)
    const qs = q.toString()
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "")
    )
  }, [tab, player])

  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <ButtonLink href={routes.academies()} size="sm">
            <Icon name="plus" size={16} />
            <span className="le-600:hidden">{t.newApplication}</span>
          </ButtonLink>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label={t.byStatus}
          value={tab}
          onChange={setTab}
          tabs={GROUPS.map((g) => ({
            value: g.id,
            label: g.label,
            count: count(g.id),
          }))}
        />
        <div
          role="group"
          aria-label={t.byPlayer}
          className="flex flex-wrap gap-1.5"
        >
          <motion.button
            {...press}
            type="button"
            aria-pressed={player === "all"}
            onClick={() => setPlayer("all")}
            className={chip}
          >
            {t.allPlayers}
          </motion.button>
          {players.map((p) => (
            <motion.button
              {...press}
              key={p.id}
              type="button"
              aria-pressed={player === p.id}
              onClick={() => setPlayer(p.id)}
              className={chip}
            >
              <AvatarInitials initials={p.initials} size={20} tone="soft" />
              {p.firstName}
            </motion.button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon="doc"
          title={EMPTY.applications.title}
          text={EMPTY.applications.text}
          cta={
            <ButtonLink href={routes.academies()}>
              {EMPTY.applications.cta}
            </ButtonLink>
          }
        />
      ) : (
        <ul aria-live="polite" className="grid gap-[10px]">
          {rows.map((r, i) => (
            <AppRow key={r.app.id} row={r} index={i} />
          ))}
        </ul>
      )}
      <p className="text-fs-14 text-fg-3">{t.statusNote}</p>
    </>
  )
}
