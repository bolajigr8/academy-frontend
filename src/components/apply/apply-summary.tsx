"use client"

import { motion } from "framer-motion"

import { Icon } from "@/components/icons/icon"
import { Kv } from "@/components/shared/key-value"
import { SafeImage } from "@/components/shared/safe-image"
import { VerifyBadge } from "@/components/shared/verify-badge"
import { DATES } from "@/data/catalog"
import { APPLY } from "@/data/apply-copy"
import type { Intake } from "@/data/types"
import { feeLabel, fmtEuro } from "@/features/academies/search"
import type { EnrichedListing } from "@/features/academies/types"
import { extrasTotal, paymentPlan } from "@/features/applications/flow"
import { enter } from "@/lib/motion"

/* Summary + .amk-asum*: js/amk-apply.jsx, css/amk-pages.css:445-450 */
export function ApplySummary({
  l,
  intake,
  optional,
  today,
}: {
  l: EnrichedListing
  intake: Intake | undefined
  optional: string[]
  today: string
}) {
  const t = APPLY.summary
  const extras = extrasTotal(l, optional)
  const items = intake ? paymentPlan(l, intake, today, optional) : []
  const confirm = items
    .filter((i) => i.required)
    .reduce((s, i) => s + i.amount, 0)
  return (
    <motion.div
      {...enter(1, 16)}
      className="grid gap-4 rounded-lg border border-border-2 bg-surface-elevated p-5 shadow-(--shadow-md)"
    >
      <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3">
        <span className="relative block h-[66px] w-[88px] overflow-hidden rounded-sm">
          <SafeImage
            src={l.image}
            alt=""
            fill
            sizes="88px"
            className="object-cover"
          />
        </span>
        <div className="grid justify-items-start gap-[3px]">
          <b>{l.title}</b>
          <small className="text-fs-13 text-fg-3">{l.academy.name}</small>
          <VerifyBadge v={l.verification} compact />
        </div>
      </div>
      <div className="grid gap-[10px] rounded-sm bg-bg-2 p-[14px]">
        <Kv label={t.startDate}>
          {intake ? DATES.fmt(intake.start) : t.notChosen}
        </Kv>
        <Kv label={t.fee}>{feeLabel(l)}</Kv>
        <Kv label={t.registration}>{fmtEuro(l.fees.registrationFee)}</Kv>
        {extras > 0 ? <Kv label={t.optional}>{fmtEuro(extras)}</Kv> : null}
        {intake ? (
          <Kv label={t.confirm} total>
            {fmtEuro(confirm)}
          </Kv>
        ) : null}
      </div>
      <ul className="grid gap-2 text-fs-13 text-fg-2">
        <li className="flex items-start gap-2">
          <Icon
            name="check"
            size={15}
            sw={2.2}
            className="mt-px flex-none text-fg-1"
          />
          {t.free}
        </li>
        <li className="flex items-start gap-2">
          <Icon name="lock" size={15} className="mt-px flex-none text-fg-1" />
          {t.payAfter}
        </li>
        <li className="flex items-start gap-2">
          <Icon name="clock" size={15} className="mt-px flex-none text-fg-1" />
          {t.reply(l.academy.responseHours)}
        </li>
      </ul>
    </motion.div>
  )
}
