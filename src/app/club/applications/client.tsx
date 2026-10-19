"use client"

import { LiveInboxClient } from "@/components/club/live-applications"
import { isLive } from "@/lib/data-source"

import { motion } from "framer-motion"
import { useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { EmptyState } from "@/components/shared/empty-state"
import { NativeSelect } from "@/components/shared/native-select"
import { SegmentedControl } from "@/components/shared/segmented-control"
import { Input } from "@/components/ui/input"
import { CLUB } from "@/data/club-copy"
import { EMPTY } from "@/data/copy"
import type { AppStatus } from "@/features/applications/types"
import {
  useClubApplications,
  type ApplicationEntry,
} from "@/features/club/hooks"
import { useMedia } from "@/hooks/use-media"
import { inView } from "@/lib/motion"

import { ApplicationCard } from "@/components/club/application-card"

const COLUMNS = CLUB.applications.columns
type ColumnId = (typeof COLUMNS)[number]["id"]

const inColumn = (statuses: readonly AppStatus[], e: ApplicationEntry) =>
  statuses.includes(e.app.status)

/* AmBoard + .amk-board/.amk-col*: js/amk-host.jsx, css/amk-app.css:332-345 */
function Board({ entries }: { entries: ApplicationEntry[] }) {
  const t = CLUB.applications
  return (
    <div
      role="list"
      aria-label={t.pipeline}
      className="relative grid [scrollbar-width:thin] auto-cols-[minmax(250px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2"
    >
      {COLUMNS.map((c, i) => {
        const list = entries.filter((e) => inColumn(c.statuses, e))
        return (
          <motion.section
            {...inView(i)}
            key={c.id}
            role="listitem"
            aria-labelledby={`col-${c.id}`}
            className="grid min-h-[360px] min-w-0 grid-rows-[auto_1fr] content-start gap-[10px] rounded-md border border-border-1 bg-bg-2 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id={`col-${c.id}`}
                className="font-display text-fs-18 leading-lh-snug font-bold text-fg-1"
              >
                {c.label}
              </h2>
              <span className="min-w-[22px] rounded-[99px] bg-bg-4 px-[7px] py-px text-center font-mono text-[11px] font-bold text-fg-2">
                {list.length}
              </span>
            </div>
            {list.length ? (
              <ul className="grid content-start gap-2">
                {list.map((e) => (
                  <ApplicationCard key={e.app.id} entry={e} />
                ))}
              </ul>
            ) : (
              <p className="p-2 text-fs-13 text-fg-4">{t.none}</p>
            )}
          </motion.section>
        )
      })}
    </div>
  )
}

/* Application pipeline (host/applications.html): a board from 1025px, stage tabs and rows below. */
/* api mode: GET /academy/portal/applications (week 2 part 2) */
export function ClubApplicationsClient() {
  return isLive("academyInbox") ? <LiveInboxClient /> : <DemoApplications />
}

function DemoApplications() {
  const { entries: all, listings, publishedCount } = useClubApplications()
  const wide = useMedia("(min-width: 1025px)")
  const [listing, setListing] = useState("all")
  const [q, setQ] = useState("")
  const [col, setCol] = useState<ColumnId>("submitted")
  const t = CLUB.applications

  const norm = (s: string) => s.toLowerCase()
  const entries = all.filter(
    (e) =>
      (listing === "all" || e.app.listingId === listing) &&
      (!q || norm(e.who.name).includes(norm(q)))
  )
  const current = COLUMNS.find((c) => c.id === col) ?? COLUMNS[0]
  const colEntries = entries.filter((e) => inColumn(current.statuses, e))

  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={`${all.length} applications across ${publishedCount} published listings`}
        wide
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <label className="am-sr" htmlFor="amk-h-listing">
            {t.listing}
          </label>
          <NativeSelect
            id="amk-h-listing"
            size="sm"
            value={listing}
            onChange={(e) => setListing(e.target.value)}
          >
            <option value="all">{t.allListings}</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </NativeSelect>
          <label className="am-sr" htmlFor="amk-h-q">
            {t.searchLabel}
          </label>
          <Input
            id="amk-h-q"
            type="search"
            placeholder={t.searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-h-10 w-auto py-2 text-fs-14 font-semibold"
          />
        </div>
        <p className="text-fs-14 text-fg-3">
          <Icon name="info" size={14} className="inline" /> {t.note}
        </p>
      </div>
      {wide ? (
        <Board entries={entries} />
      ) : (
        <>
          <SegmentedControl<ColumnId>
            label={t.stage}
            value={col}
            onChange={setCol}
            tabs={COLUMNS.map((c) => ({
              value: c.id,
              label: c.label,
              count: entries.filter((e) => inColumn(c.statuses, e)).length,
            }))}
          />
          {colEntries.length ? (
            <ul className="grid gap-[10px]">
              {colEntries.map((e) => (
                <ApplicationCard key={e.app.id} entry={e} />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="columns"
              title={EMPTY.hostApps.title}
              text={EMPTY.hostApps.text}
            />
          )}
        </>
      )}
    </>
  )
}
