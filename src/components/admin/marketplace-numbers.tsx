"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { CardBlock } from "@/components/shared/card-block"
import { ErrorState } from "@/components/shared/error-state"
import { KpiCard } from "@/components/shared/kpi-card"
import { NativeSelect } from "@/components/shared/native-select"
import { Notice } from "@/components/shared/notice"
import { SectionHead } from "@/components/shared/section-head"
import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import { ADMIN3, DASH } from "@/data/week3-copy"
import {
  dashboardKeys,
  getAdminOverview,
  type DateRange,
} from "@/features/dashboard/api"
import { todayISO } from "@/lib/date"

const A = ADMIN3
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const euro = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(
    minor / 100
  )

/*
 * The eleven marketplace numbers (week 3 part 2, section 16): period figures
 * follow the range, the snapshot is as of now. Sales and commission are in
 * euros; paid rows in another currency without a rate are listed apart.
 */
export function MarketplaceNumbers() {
  const [days, setDays] = useState("30")
  const today = todayISO()
  const range: DateRange = {
    from: addDays(today, -(Number(days) - 1)),
    to: today,
  }
  const q = useQuery({
    queryKey: dashboardKeys.overview(range),
    queryFn: () => getAdminOverview(range),
  })
  const d = q.data
  const v = (x: string | number | undefined) => (d ? x : "…")
  return (
    <section aria-labelledby="h-market" className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="h-market"
          className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase"
        >
          {A.overviewRange}
          {d ? ` · ${DATES.fmt(d.range.from)} – ${DATES.fmt(d.range.to)}` : ""}
        </h2>
        <NativeSelect
          aria-label={A.overviewRange}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-auto min-w-[180px]"
        >
          <option value="7">{DASH.last7}</option>
          <option value="30">{DASH.last30}</option>
          <option value="90">{DASH.last90}</option>
        </NativeSelect>
      </div>
      {q.isError && !d ? (
        <ErrorState
          message={LIVE.requestFailed}
          onRetry={() => void q.refetch()}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(210px,100%),1fr))] gap-4">
          <KpiCard
            label={A.kpi.applications[0]}
            sub={A.kpi.applications[1]}
            value={v(d?.period.applications_submitted) as number}
          />
          <KpiCard
            label={A.kpi.response[0]}
            sub={
              d
                ? A.responseOf(
                    d.period.application_response_rate.answered,
                    d.period.application_response_rate.measured
                  )
                : ""
            }
            value={
              d
                ? d.period.application_response_rate.rate === null
                  ? DASH.noRate
                  : `${d.period.application_response_rate.rate}%`
                : "…"
            }
          />
          <KpiCard
            label={A.kpi.repeat[0]}
            sub={
              d
                ? A.repeatOf(
                    d.period.repeat_applications.applications,
                    d.period.repeat_applications.applicants
                  )
                : ""
            }
            value={v(d?.period.repeat_applications.applications) as number}
          />
          <KpiCard
            label={A.kpi.searches[0]}
            sub={A.kpi.searches[1]}
            value={v(d?.period.searches) as number}
          />
          <KpiCard
            label={A.kpi.views[0]}
            sub={A.kpi.views[1]}
            value={v(d?.period.listing_views) as number}
          />
          <KpiCard
            label={A.kpi.newUsers[0]}
            sub={A.kpi.newUsers[1]}
            value={v(d?.period.new_players_and_parents) as number}
          />
          <KpiCard
            label={A.kpi.saved[0]}
            sub={A.kpi.saved[1]}
            value={v(d?.period.saved_listings_added) as number}
          />
          <KpiCard
            label={A.kpi.reviewsAdded[0]}
            sub={A.kpi.reviewsAdded[1]}
            value={v(d?.period.verified_reviews_added) as number}
          />
          <KpiCard
            label={A.kpi.gmv[0]}
            sub={A.kpi.gmv[1]}
            value={
              d
                ? euro(d.period.revenue.gmv_minor, d.period.revenue.currency)
                : "…"
            }
          />
          <KpiCard
            label={A.kpi.commission[0]}
            sub={A.kpi.commission[1]}
            value={
              d
                ? euro(
                    d.period.revenue.commission_minor,
                    d.period.revenue.currency
                  )
                : "…"
            }
          />
        </div>
      )}
      {d && d.period.revenue.unconverted.length ? (
        <Notice tone="warning" icon="info">
          <b>{A.unconvertedTitle}.</b> {A.unconvertedText}{" "}
          {d.period.revenue.unconverted
            .map((u) => A.unconvertedRow(u.currency, u.paid_rows))
            .join(" · ")}
        </Notice>
      ) : null}
      <CardBlock aria-labelledby="h-now">
        <SectionHead id="h-now" title={A.now} />
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-3">
          {Object.entries(A.nowItems).map(([k, label]) => (
            <li
              key={k}
              className="grid rounded-md border border-border-1 bg-bg-2 p-3"
            >
              <small className="text-fs-12 text-fg-3">{label}</small>
              <b className="font-display text-[26px] leading-none tabular-nums">
                {d ? d.snapshot[k as keyof typeof d.snapshot] : "…"}
              </b>
            </li>
          ))}
        </ul>
      </CardBlock>
    </section>
  )
}
