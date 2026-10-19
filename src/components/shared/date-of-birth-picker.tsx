"use client"

import { useId, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { fieldControl } from "@/components/ui/input"
import { MON } from "@/lib/date"
import { cn } from "@/lib/utils"

type Props = {
  /** ISO 'YYYY-MM-DD' or '' */
  value: string
  onChange: (iso: string) => void
  /** earliest allowed date of birth (ISO, inclusive) */
  min?: string
  /** latest allowed date of birth (ISO, inclusive), usually today */
  max?: string
  disabled?: boolean
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

type Part = number | ""

function split(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null
}

const daysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate()

const toISO = (y: number, m: number, d: number) =>
  `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`

const label =
  "font-mono text-[9px] font-bold tracking-[1.5px] text-fg-3 uppercase"

/**
 * Three independent Day / Month / Year selects (ported from matchday). Each
 * select keeps its own state, so picking only the day does not snap back;
 * onChange fires with a new ISO value only once all three are set.
 */
export function DateOfBirthPicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: Props) {
  const uid = useId()
  const base = id ?? `dob-${uid}`
  const maxYear = split(max ?? "")?.y ?? new Date().getFullYear()
  const minYear = split(min ?? "")?.y ?? maxYear - 120

  const parsed = split(value)
  const [day, setDay] = useState<Part>(parsed?.d ?? "")
  const [month, setMonth] = useState<Part>(parsed?.m ?? "")
  const [year, setYear] = useState<Part>(parsed?.y ?? "")
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    // the value changed from outside (a reset or a prefill): follow it
    setSynced(value)
    setDay(parsed?.d ?? "")
    setMonth(parsed?.m ?? "")
    setYear(parsed?.y ?? "")
  }

  const dayCount = year && month ? daysInMonth(Number(year), Number(month)) : 31
  const days = Array.from({ length: dayCount }, (_, i) => i + 1)
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  )

  function commit(d: Part, m: Part, y: Part) {
    setDay(d)
    setMonth(m)
    setYear(y)
    if (d === "" || m === "" || y === "") return
    // clamp the day when moving to a shorter month, so an invalid date is never emitted
    onChange(toISO(y, m, Math.min(d, daysInMonth(y, m))))
  }

  const toPart = (v: string): Part => (v ? Number(v) : "")
  const select = (
    part: "day" | "month" | "year",
    text: string,
    current: Part,
    options: { value: number; label: string }[]
  ) => {
    const sid = `${base}-${part}`
    return (
      <div className="grid min-w-0 gap-1">
        <label htmlFor={sid} className={label}>
          {text}
        </label>
        <div className="relative">
          <select
            id={part === "day" ? base : sid}
            value={current}
            disabled={disabled}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => {
              const v = toPart(e.target.value)
              if (part === "day") commit(v, month, year)
              else if (part === "month") commit(day, v, year)
              else commit(day, month, v)
            }}
            className={cn(
              fieldControl,
              // tight padding so "Day", "Month" and "2011" fit on a phone
              "cursor-pointer appearance-none pr-7 pl-3 disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <option value="">{text}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon
            name="chev"
            size={14}
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-fg-3"
          />
        </div>
      </div>
    )
  }

  return (
    // the month gets the most room; the day the least
    <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)_minmax(0,6fr)] gap-2">
      {select(
        "day",
        "Day",
        day,
        days.map((d) => ({ value: d, label: String(d) }))
      )}
      {select(
        "month",
        "Month",
        month,
        MON.map((m, i) => ({ value: i + 1, label: m }))
      )}
      {select(
        "year",
        "Year",
        year,
        years.map((y) => ({ value: y, label: String(y) }))
      )}
    </div>
  )
}
