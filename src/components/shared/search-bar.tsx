"use client"

import type { ChangeEvent, FormEvent } from "react"

import { Icon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { DURATIONS, TYPES } from "@/data/catalog"
import { HOME } from "@/data/home-copy"
import { AGES } from "@/features/academies/search"
import { cn } from "@/lib/utils"

export type SearchDraft = {
  loc: string
  age: string
  type: string
  start: string
  dur: string
}

type Props = {
  value: SearchDraft
  onChange: (value: SearchDraft) => void
  onSubmit: (value: SearchDraft) => void
  startOptions: { value: string; label: string }[]
  idPrefix?: string
  /** hero (home) or compact (the bar above search results) */
  variant?: "hero" | "compact"
  /** api mode: the backend's academy types (default: the prototype's list) */
  typeOptions?: { value: string; label: string }[]
  /** api mode: the durations the search can filter by (default: the prototype's list) */
  durationOptions?: { value: string; label: string }[]
}

/*
 * One segment of .amk-search (css/amk.css:74-95 and the 1180/720 rules at 304-318).
 * Borders depend on the position, exactly as the source's nth-child rules resolve.
 */
const segBase =
  "relative flex min-w-0 flex-col justify-center gap-0.5 border-r border-border-1 hover:bg-tint-neon-1 focus-within:bg-tint-neon-2 le-1180:border-b"
const segAt: Record<number, string> = {
  1: "le-720:col-[1/-1]",
  2: "",
  3: "le-1180:border-r-0",
  4: "",
  5: "le-720:border-r-0",
}
const control =
  "min-h-[26px] w-full min-w-0 border-0 bg-transparent p-0 text-fs-14 text-fg-2 outline-none placeholder:text-fg-4"
const select = cn(
  control,
  "cursor-pointer appearance-none [&_option]:bg-surface-elevated [&_option]:text-fg-1"
)

/* AmSearchBar: Location · Age · Type · Start · Duration. --compact: css/amk.css:93-95, 300 and 316 */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  startOptions,
  idPrefix = "amk-s",
  variant = "hero",
  typeOptions = TYPES.map((x) => ({ value: x.id, label: x.label })),
  durationOptions = DURATIONS.map((d) => ({ value: d.id, label: d.label })),
}: Props) {
  const compact = variant === "compact"
  const set =
    (k: keyof SearchDraft) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...value, [k]: e.target.value })
  const t = HOME.search
  const seg = (n: number, id: string, label: string, el: React.ReactNode) => (
    <div
      className={cn(
        segBase,
        compact ? "px-[14px] py-2" : "px-[18px] py-3",
        segAt[n]
      )}
    >
      <label
        htmlFor={`${idPrefix}-${id}`}
        className="font-mono text-[11px] font-bold tracking-gf-wide text-fg-1 uppercase"
      >
        {label}
      </label>
      {el}
    </div>
  )
  return (
    <form
      role="search"
      aria-label={t.label}
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        onSubmit(value)
      }}
      className={cn(
        "grid grid-cols-[1.5fr_1fr_1.25fr_1.1fr_1fr_auto] items-stretch rounded-md border border-glass-border bg-glass-bg-strong am-glass [transition:box-shadow_var(--dur-base)_var(--ease-out),border-color_var(--dur-base)_var(--ease-out)] focus-within:border-border-accent focus-within:shadow-[var(--shadow-md),var(--glow-neon-sm)] le-1180:grid-cols-[repeat(3,minmax(0,1fr))] le-720:grid-cols-[1fr_1fr]",
        compact ? "shadow-(--shadow-sm)" : "shadow-(--shadow-md)"
      )}
    >
      {seg(
        1,
        "loc",
        t.location,
        <input
          id={`${idPrefix}-loc`}
          type="search"
          placeholder={t.locationPlaceholder}
          value={value.loc}
          onChange={set("loc")}
          autoComplete="off"
          maxLength={60}
          enterKeyHint="search"
          className={control}
        />
      )}
      {seg(
        2,
        "age",
        t.age,
        <select
          id={`${idPrefix}-age`}
          value={value.age}
          onChange={set("age")}
          className={select}
        >
          <option value="">{t.anyAge}</option>
          {AGES.map((a) => (
            <option key={a} value={String(a)}>
              {a} {t.years}
            </option>
          ))}
        </select>
      )}
      {seg(
        3,
        "type",
        t.type,
        <select
          id={`${idPrefix}-type`}
          value={value.type}
          onChange={set("type")}
          className={select}
        >
          <option value="">{t.allTypes}</option>
          {typeOptions.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
      )}
      {seg(
        4,
        "start",
        t.start,
        <select
          id={`${idPrefix}-start`}
          value={value.start}
          onChange={set("start")}
          className={select}
        >
          {startOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      {seg(
        5,
        "dur",
        t.duration,
        <select
          id={`${idPrefix}-dur`}
          value={value.dur}
          onChange={set("dur")}
          className={select}
        >
          <option value="">{t.anyLength}</option>
          {durationOptions.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      )}
      <Button
        type="submit"
        className={cn(
          "text-fs-16 le-720:col-[1/-1]",
          compact
            ? "m-1.5 min-h-11 min-w-[104px]"
            : "m-2 min-h-[52px] min-w-[128px] le-1180:col-start-3 le-720:m-[10px]"
        )}
      >
        <Icon name="search" size={18} sw={2.4} />
        <span>{t.submit}</span>
      </Button>
    </form>
  )
}
