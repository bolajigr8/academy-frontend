"use client"

import { Icon } from "@/components/icons/icon"
import { Kv, KvLines } from "@/components/shared/key-value"
import { Meter } from "@/components/shared/meter"
import { NativeSelect } from "@/components/shared/native-select"
import { Button, buttonVariants } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES, FEE_UNITS } from "@/data/catalog"
import { PROGRAM } from "@/data/search-copy"
import {
  durationLabel,
  fmtEuro,
  placesLabel,
} from "@/features/academies/search"
import type { EnrichedListing } from "@/features/academies/types"
import { paymentPlan } from "@/features/applications/flow"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

type Props = {
  listing: EnrichedListing
  intakeId: string
  onIntake: (id: string) => void
  today: string
  saved?: boolean
  onSave?: (id: string) => void
  /** the editor preview: no live Apply button, no save */
  preview?: boolean
}

/* AmFeeCard + .amk-feecard*: js/amk-listing.jsx, css/amk-pages.css:300-308 */
export function FeeCard({
  listing: l,
  intakeId,
  onIntake,
  today,
  saved = false,
  onSave,
  preview = false,
}: Props) {
  const t = PROGRAM.feeCard
  const intake =
    l.intakes.find((i) => i.id === intakeId) ?? l.nextIntake ?? l.intakes[0]
  const items = intake ? paymentPlan(l, intake, today, []) : []
  const confirm = items
    .filter((i) => i.required)
    .reduce((s, i) => s + i.amount, 0)
  const closed = !intake || !intake.open || intake.placesLeft === 0
  const days = intake ? DATES.diffDays(today, intake.deadline) : 0

  return (
    <div className="grid gap-4 rounded-lg border border-border-2 bg-surface-elevated p-6 shadow-(--shadow-lg)">
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-[34px] font-bold tracking-[-0.03em]">
          {fmtEuro(l.fees.amount)}
        </span>
        <span className="font-semibold text-fg-2">
          / {FEE_UNITS[l.fees.per].label}
        </span>
      </div>
      {l.fees.per !== "month" ? (
        <p className="-mt-[10px] text-fs-14 text-fg-3">
          {t.about} {fmtEuro(l.monthly)} {t.aMonth} · {durationLabel(l)}
        </p>
      ) : null}
      <div className="grid min-w-0 gap-1.5">
        <label
          htmlFor="amk-fee-intake"
          className="text-fs-14 font-semibold text-fg-1"
        >
          {t.startDate}
        </label>
        <NativeSelect
          id="amk-fee-intake"
          value={intake ? intake.id : ""}
          onChange={(e) => onIntake(e.target.value)}
          disabled={preview}
        >
          {l.intakes.map((i) => (
            <option
              key={i.id}
              value={i.id}
              disabled={!i.open || i.placesLeft === 0}
            >
              {DATES.fmt(i.start)}
              {!i.open
                ? ` · ${t.closed}`
                : i.placesLeft === 0
                  ? ` · ${t.full}`
                  : ` · ${placesLabel(i.placesLeft)}`}
            </option>
          ))}
        </NativeSelect>
      </div>
      {intake ? (
        <Meter
          value={intake.capacity - intake.placesLeft}
          max={intake.capacity}
          label={t.placesTaken}
          right={placesLabel(intake.placesLeft)}
        />
      ) : null}
      <KvLines>
        <Kv label={t.registration}>{fmtEuro(l.fees.registrationFee)}</Kv>
        {l.rolling ? (
          <Kv label={t.monthly}>{fmtEuro(l.fees.amount)}</Kv>
        ) : (
          <>
            <Kv label={t.programFee}>{fmtEuro(l.total)}</Kv>
            {l.deposit > 0 ? (
              <Kv label={t.deposit}>{fmtEuro(l.deposit)}</Kv>
            ) : null}
          </>
        )}
        <Kv label={t.toConfirm} total>
          {fmtEuro(confirm)}
        </Kv>
      </KvLines>
      {preview ? (
        <span
          aria-disabled="true"
          className={buttonVariants({
            variant: "primary",
            size: "lg",
            block: true,
          })}
        >
          {PROGRAM.apply}
        </span>
      ) : closed ? (
        <Button size="lg" block disabled>
          {t.closedButton}
        </Button>
      ) : (
        <ButtonLink
          href={routes.apply(l.id, intake.id)}
          variant="primary"
          size="lg"
          block
        >
          {PROGRAM.apply} <Icon name="arrow" size={18} />
        </ButtonLink>
      )}
      <ul className="grid gap-2 text-fs-13 text-fg-2">
        <li className="flex items-start gap-2">
          <Icon
            name="check"
            size={15}
            sw={2.2}
            className="mt-px flex-none text-fg-1"
          />
          {t.freeToApply}
        </li>
        {intake && intake.open ? (
          <li className="flex items-start gap-2">
            <Icon
              name="clock"
              size={15}
              className="mt-px flex-none text-fg-1"
            />
            {t.applyBy} {DATES.fmt(intake.deadline)}
            {days <= 30 ? ` · ${days} ${t.daysLeft}` : ""}
          </li>
        ) : null}
        <li className="flex items-start gap-2">
          <Icon name="chat" size={15} className="mt-px flex-none text-fg-1" />
          {t.message}
        </li>
      </ul>
      {!preview && onSave ? (
        <Button
          variant="secondary"
          block
          aria-pressed={saved}
          onClick={() => onSave(l.id)}
        >
          <Icon
            name="heart"
            size={16}
            className={cn(saved && "fill-gf-neon stroke-fg-1")}
          />{" "}
          {saved ? t.savedList : t.saveLater}
        </Button>
      ) : null}
    </div>
  )
}
