"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

import { Icon, type IconName } from "@/components/icons/icon"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { CheckList } from "@/components/shared/check-list"
import { ClubCrest } from "@/components/shared/club-crest"
import { EmptyState } from "@/components/shared/empty-state"
import { Stars } from "@/components/shared/listing-card"
import { Tag } from "@/components/shared/tag"
import { VerifyBadge } from "@/components/shared/verify-badge"
import {
  DATES,
  INCLUDES,
  PROVISION,
  VERIFICATION,
  VERIFY_CHECKS,
} from "@/data/catalog"
import { PROGRAM } from "@/data/search-copy"
import type { Provision as ProvisionValue, Review } from "@/data/types"
import {
  durationLabel,
  fmtEuro,
  genderLabel,
  levelLabel,
  placesLabel,
} from "@/features/academies/search"
import type { EnrichedListing } from "@/features/academies/types"
import { paymentPlan, planTotals } from "@/features/applications/flow"
import { easeOut, inView, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

/* .amk-h4 and .amk-h3: css/amk-core.css:90-91 */
export const h4 = "font-display text-fs-18 leading-lh-snug font-bold text-fg-1"
export const h3 =
  "font-display text-fs-24 leading-lh-snug font-bold tracking-[-0.01em] text-fg-1"

/* .amk-dl: css/amk-core.css:436-438 */
export function DefList({
  rows,
  className,
}: {
  rows: [string, ReactNode][]
  className?: string
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-x-6 gap-y-4",
        className
      )}
    >
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="mb-1 font-mono text-[11px] tracking-gf-wide text-fg-3 uppercase">
            {k}
          </dt>
          <dd className="text-fs-16 font-semibold text-fg-1">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/* AmFacts + .amk-facts: css/amk-pages.css:213 */
export function Facts({ listing: l }: { listing: EnrichedListing }) {
  const f = PROGRAM.facts
  return (
    <DefList
      className="rounded-md border border-border-1 bg-bg-2 p-5"
      rows={[
        [f.ages, `${l.ageMin}–${l.ageMax} ${f.onStart}`],
        [f.openTo, genderLabel(l)],
        [f.level, levelLabel(l)],
        [f.duration, durationLabel(l)],
        [
          f.training,
          `${l.sessionsPerWeek} ${f.sessions} · ${l.hoursPerWeek} ${f.hoursWeek}`,
        ],
        [f.languages, (l.academy.languages ?? []).join(", ")],
      ]}
    />
  )
}

/* AmSchedule + .amk-sched: css/amk-pages.css:215-220 */
export function Schedule({ listing: l }: { listing: EnrichedListing }) {
  return (
    <ol className="grid overflow-hidden rounded-md border border-border-1">
      {(l.schedule ?? []).map((d) => (
        <li
          key={d.day}
          className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 border-b border-border-1 px-4 py-3 last:border-b-0 odd:bg-bg-2"
        >
          <b className="font-mono text-fs-13 tracking-gf-wide uppercase">
            {d.day}
          </b>
          <ul className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-fs-14 text-fg-2">
            {d.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

/* AmIncludes + .amk-incl, .amk-optional: css/amk-pages.css:239-247 */
export function Includes({ listing: l }: { listing: EnrichedListing }) {
  return (
    <>
      <ul className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-6 gap-y-3 le-720:grid-cols-[1fr]">
        {l.includes.map((k) => (
          <li key={k} className="flex items-center gap-3 text-fs-16 text-fg-1">
            <span
              aria-hidden="true"
              className="grid size-[42px] flex-none place-items-center rounded-[12px] border border-border-1 bg-bg-3"
            >
              <Icon name={INCLUDES[k].icon as IconName} size={20} />
            </span>
            {INCLUDES[k].label}
          </li>
        ))}
      </ul>
      {(l.optional ?? []).length > 0 ? (
        <div className="mt-2 grid gap-[10px]">
          <h3 className={h4}>{PROGRAM.optionalServices}</h3>
          <ul className="grid rounded-md border border-border-1">
            {l.optional.map((o) => (
              <li
                key={o.id}
                className="flex justify-between gap-3 border-b border-border-1 px-4 py-3 text-fs-14 text-fg-2 last:border-b-0"
              >
                <span>{o.label}</span>
                <b className="whitespace-nowrap text-fg-1">
                  {fmtEuro(o.price)}{" "}
                  <small className="font-medium text-fg-3">
                    {o.per === "once" ? PROGRAM.oneOff : `/ ${o.per}`}
                  </small>
                </b>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  )
}

/* Provision + .amk-prov*: css/amk-pages.css:248-252 */
export function Provision({
  icon,
  title,
  value,
  note,
}: {
  icon: IconName
  title: string
  value: ProvisionValue
  note?: string
}) {
  return (
    <div className="flex items-start gap-[14px] rounded-md border border-border-1 bg-bg-2 p-[18px]">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-11 flex-none place-items-center rounded-[12px] bg-fg-1 text-bg-0",
          value === "included" && "bg-gf-neon text-text-on-neon",
          value === "none" && "bg-bg-4 text-fg-3"
        )}
      >
        <Icon name={icon} size={22} />
      </span>
      <div>
        <h3 className={h4}>{title}</h3>
        <p className="mt-0.5 mb-1 font-bold">{PROVISION[value]}</p>
        {note ? <p className="text-fs-14 text-fg-3">{note}</p> : null}
      </div>
    </div>
  )
}

/* The radio dot shared by the start-date rows (.amk-radio__dot, css/amk-pages.css:57-59) */
export const radioDot =
  "grid size-[18px] flex-none place-items-center rounded-full border-[1.5px] border-border-3 [transition:border-color_var(--dur-base)] peer-checked:border-fg-1 peer-checked:bg-fg-1 peer-checked:shadow-[inset_0_0_0_4px_var(--surface-elevated)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amk-accent-ink"

/* AmIntakeTable + .amk-itable*: css/amk-pages.css:222-237 */
export function IntakeTable({
  listing: l,
  value,
  onChange,
  today,
}: {
  listing: EnrichedListing
  value: string
  onChange: (id: string) => void
  today: string
}) {
  const t = PROGRAM.intakes
  return (
    <div role="radiogroup" aria-label={t.label} className="grid gap-2">
      {l.intakes.map((i) => {
        const closed = !i.open
        const full = i.placesLeft === 0
        const days = DATES.diffDays(today, i.deadline)
        return (
          <motion.label
            whileTap={
              closed || full ? undefined : { scale: 0.99, transition: spring }
            }
            key={i.id}
            className={cn(
              "relative grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[14px] rounded-md border border-border-2 bg-surface-elevated px-[18px] py-[14px] [transition:border-color_var(--dur-base),background_var(--dur-base)] hover:border-border-3",
              value === i.id &&
                "border-fg-1 shadow-[inset_0_0_0_1px_var(--fg-1)] hover:border-fg-1",
              (closed || full) && "cursor-not-allowed opacity-60"
            )}
          >
            <input
              type="radio"
              name="amk-intake"
              value={i.id}
              checked={value === i.id}
              disabled={closed || full}
              onChange={() => onChange(i.id)}
              className="peer absolute size-px opacity-0"
            />
            <span aria-hidden="true" className={radioDot} />
            <span className="grid gap-0.5">
              <b className="text-fs-16">
                {l.rolling
                  ? `${t.starts} ${DATES.fmt(i.start)}`
                  : DATES.fmt(i.start) +
                    (i.end ? ` – ${DATES.fmt(i.end)}` : "")}
              </b>
              <small className="text-fs-13 text-fg-3">
                {closed
                  ? t.closed
                  : `${t.applyBy} ${DATES.fmt(i.deadline)}` +
                    (days <= 21
                      ? ` · ${days} ${days === 1 ? t.dayLeft : t.daysLeft}`
                      : "")}
              </small>
            </span>
            <span className="grid text-right">
              <b
                className={cn(
                  "text-fs-14",
                  i.placesLeft <= 5 &&
                    !full &&
                    "inline-flex items-center justify-end gap-1.5 before:size-[7px] before:rounded-full before:bg-gf-warning before:content-['']"
                )}
              >
                {closed ? t.closedShort : placesLabel(i.placesLeft)}
              </b>
              <small className="text-fs-13 text-fg-3">
                {t.of} {i.capacity}
              </small>
            </span>
          </motion.label>
        )
      })}
    </div>
  )
}

/* AmFeeTable + .amk-feetable: css/amk-pages.css:254-268 and 720 rule */
export function FeeTable({
  listing: l,
  intake,
  today,
}: {
  listing: EnrichedListing
  intake: EnrichedListing["intakes"][number]
  today: string
}) {
  const t = PROGRAM.feeTable
  const items = paymentPlan(l, intake ?? l.intakes[0], today, [])
  const total = planTotals(items).total
  const cell =
    "border-b border-border-1 px-4 py-3 text-left font-medium text-fg-2"
  return (
    <div className="relative grid gap-[10px] le-720:overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-md border border-border-1 text-fs-14">
        <caption className="am-sr">{t.caption}</caption>
        <thead>
          <tr>
            {[t.payment, t.when].map((h) => (
              <th
                key={h}
                scope="col"
                className={cn(
                  cell,
                  "bg-bg-2 font-mono text-[11px] tracking-gf-wide text-fg-3 uppercase"
                )}
              >
                {h}
              </th>
            ))}
            <th
              scope="col"
              className={cn(
                cell,
                "bg-bg-2 text-right! font-mono text-[11px] tracking-gf-wide whitespace-nowrap text-fg-3 uppercase tabular-nums"
              )}
            >
              {t.amount}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <th scope="row" className={cn(cell, "font-semibold text-fg-1")}>
                {it.label}
                {it.required ? (
                  <Tag mono className="ml-2">
                    {t.toConfirm}
                  </Tag>
                ) : null}
              </th>
              <td className={cell}>
                {it.id === "balance"
                  ? `${t.by} ${DATES.fmt(it.due)}`
                  : it.id.startsWith("month-") && it.id !== "month-1"
                    ? DATES.fmt(it.due)
                    : t.withinWeek}
              </td>
              <td
                className={cn(
                  cell,
                  "text-right! whitespace-nowrap tabular-nums"
                )}
              >
                {fmtEuro(it.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th
              scope="row"
              colSpan={2}
              className="border-b-0 bg-bg-2 px-4 py-3 text-left font-bold text-fg-1"
            >
              {l.rolling
                ? `${t.firstThree} ${fmtEuro(l.fees.amount)} ${t.eachMonth}`
                : t.total}
            </th>
            <td className="border-b-0 bg-bg-2 px-4 py-3 text-right! font-bold whitespace-nowrap text-fg-1 tabular-nums">
              {fmtEuro(total)}
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="flex items-center gap-1.5 text-fs-13 text-fg-3">
        <Icon name="info" size={14} className="flex-none" /> {t.hint}
      </p>
    </div>
  )
}

/* AmReviews + .amk-reviews*, .amk-review*: css/amk-pages.css:270-288 */
export function Reviews({
  listing: l,
  reviews,
}: {
  listing: EnrichedListing
  reviews: Review[]
}) {
  const s = l.reviewSummary
  const t = PROGRAM.reviewsBlock
  if (!s.count)
    return <EmptyState icon="star" title={t.emptyTitle} text={t.emptyText} />
  return (
    <div className="grid gap-[22px]">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-8 rounded-md border border-border-1 bg-bg-2 p-[22px] le-1024:grid-cols-[1fr]">
        <div className="flex items-center gap-[14px]">
          <span className="font-display text-[clamp(56px,7vw,104px)] leading-[0.85] font-bold tracking-[-0.04em] text-fg-1 tabular-nums">
            {s.avg.toFixed(1)}
          </span>
          <div className="grid gap-1">
            <Stars listing={l} showCount={false} />
            <small className="max-w-[18ch] text-fs-13 text-fg-3">
              {s.count} {t.fromVerified}
            </small>
          </div>
        </div>
        <dl className="grid grid-cols-[1fr_1fr] gap-x-7 gap-y-3 le-720:grid-cols-[1fr]">
          {t.areas.map(([k, label]) => (
            <div key={k}>
              <dt className="mb-1 text-fs-13 text-fg-2">{label}</dt>
              <dd className="flex items-center gap-[10px]">
                <span className="h-1.5 flex-1 overflow-hidden rounded-[99px] bg-bg-4">
                  <motion.i
                    className="block h-full rounded-[inherit] bg-fg-1"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(s.areas[k] / 5) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: easeOut }}
                  />
                </span>
                <b className="text-fs-13 tabular-nums">
                  {s.areas[k].toFixed(1)}
                </b>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <ul className="grid grid-cols-[1fr_1fr] gap-4 le-720:grid-cols-[1fr]">
        {reviews.map((r, i) => (
          <motion.li
            {...inView(i)}
            key={r.id}
            className="grid gap-[10px] rounded-md border border-border-1 p-[18px]"
          >
            <div className="flex flex-wrap items-center gap-[10px]">
              <AvatarInitials
                initials={r.authorLabel
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
                size={40}
                tone="soft"
              />
              <div className="grid min-w-[120px] flex-1">
                <b>{r.authorLabel}</b>
                <small className="text-fs-12 text-fg-3">
                  {DATES.monthLabel(r.date)}
                </small>
              </div>
              <Tag mono>
                <Icon name="shieldcheck" size={12} sw={2} />
                {t.verifiedEnrollment}
              </Tag>
            </div>
            <p className="text-fs-14 leading-lh-relaxed text-fg-2">{r.text}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

/* AmAbout + .amk-about*: css/amk-pages.css:290-294 */
export function About({ listing: l }: { listing: EnrichedListing }) {
  const a = l.academy
  const o = l.org
  const t = PROGRAM.about
  const checks = VERIFY_CHECKS.filter(
    (c) => !c.clubOnly || l.verification === "club"
  )
  return (
    <div className="grid gap-[18px]">
      <div className="flex items-center gap-4">
        <ClubCrest crest={l.crest} size={64} club={l.verification === "club"} />
        <div>
          <h3 className={h3}>{a.name}</h3>
          <p className="text-fs-14 text-fg-3">
            {t.runBy} {o.name} · {t.founded} {a.founded}
          </p>
        </div>
      </div>
      <p className="text-fs-16 leading-lh-relaxed text-fg-2">{a.description}</p>
      <DefList
        rows={[
          [t.responseRate, `${a.responseRate}%`],
          [t.usuallyReplies, `${t.within} ${a.responseHours} ${t.hours}`],
          [t.languages, a.languages.join(", ")],
        ]}
      />
      <div className="grid grid-cols-[1fr_1fr] gap-6 le-720:grid-cols-[1fr]">
        <div className="grid content-start gap-[10px]">
          <h4 className={h4}>{t.facilities}</h4>
          <CheckList items={a.facilities.map((text) => ({ text }))} />
        </div>
        <div className="grid content-start gap-[10px]">
          <h4 className={h4}>{t.verification}</h4>
          <VerifyBadge v={l.verification} />
          {l.verification === "pending" ? (
            <p className="text-fs-14 text-fg-3">
              {VERIFICATION.pending.text} {t.pendingTail}
            </p>
          ) : (
            <CheckList
              items={checks.map((c) => ({
                text:
                  c.label +
                  (c.id === "affiliation" && o.affiliation
                    ? ` (${o.affiliation.docRef})`
                    : ""),
              }))}
            />
          )}
        </div>
      </div>
    </div>
  )
}
