"use client"

import { useState, type CSSProperties, type ReactNode } from "react"

import { Icon } from "@/components/icons/icon"
import { NativeSelect } from "@/components/shared/native-select"
import { COUNTRIES, LEVELS } from "@/data/catalog"
import { SEARCH } from "@/data/search-copy"
import {
  PRICE,
  cityOptions,
  facetCounts,
  fmtEuro,
} from "@/features/academies/search"
import type { EnrichedListing, SearchState } from "@/features/academies/types"
import { cn } from "@/lib/utils"

type Patch = Partial<SearchState>

/* Collapsible filter section: .amk-fsec*, css/amk-pages.css:43-49 */
export function FilterSection({
  id,
  title,
  badge,
  children,
}: {
  id: string
  title: string
  badge?: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-border-1">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between border-0 bg-transparent px-0.5 py-4 text-left font-display text-fs-16 font-bold text-fg-1"
        >
          <span>
            {title}
            {badge ? (
              <em className="ml-2 inline-grid h-5 min-w-5 place-items-center rounded-[99px] bg-gf-neon px-1.5 align-[2px] font-mono text-[11px] text-text-on-neon not-italic">
                {badge}
              </em>
            ) : null}
          </span>
          <Icon name={open ? "chevu" : "chev"} size={16} />
        </button>
      </h3>
      <div id={id} hidden={!open} className="grid gap-[10px] px-0.5 pb-[18px]">
        {children}
      </div>
    </div>
  )
}

/* Custom radios with facet counts: .amk-radio*, css/amk-pages.css:51-62 */
export function Radios({
  name,
  value,
  options,
  onChange,
  counts,
}: {
  name: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  counts?: Record<string, number>
}) {
  return (
    <div role="radiogroup" className="grid gap-0.5">
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "relative flex min-h-[38px] cursor-pointer items-center gap-[10px] rounded-[6px] px-2 py-1.5 text-fs-14 text-fg-2 hover:bg-tint-neon-1 hover:text-fg-1",
            counts && counts[o.value] === 0 && value !== o.value && "opacity-55"
          )}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="peer absolute size-px opacity-0"
          />
          <span
            aria-hidden="true"
            className="grid size-[18px] flex-none place-items-center rounded-full border-[1.5px] border-border-3 [transition:border-color_var(--dur-base)] peer-checked:border-fg-1 peer-checked:bg-fg-1 peer-checked:shadow-[inset_0_0_0_4px_var(--surface-elevated)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amk-accent-ink"
          />
          <span className="flex-1 peer-checked:font-semibold peer-checked:text-fg-1">
            {o.label}
          </span>
          {counts && o.value !== "" ? (
            <span className="font-mono text-fs-12 text-fg-3">
              {counts[o.value]}
            </span>
          ) : null}
        </label>
      ))}
    </div>
  )
}

/* Two native range inputs on one track: keyboard and screen-reader friendly. */
function PriceRange({
  min,
  max,
  onChange,
  idPrefix,
}: {
  min: number
  max: number
  onChange: (r: { min: number; max: number }) => void
  idPrefix: string
}) {
  const pct = (v: number) => ((v - PRICE.min) / (PRICE.max - PRICE.min)) * 100
  const set =
    (which: "min" | "max") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10)
      if (which === "min")
        onChange({ min: Math.min(v, max - PRICE.step * 4), max })
      else onChange({ min, max: Math.max(v, min + PRICE.step * 4) })
    }
  return (
    <div className="grid gap-[10px]">
      <div className="flex items-baseline gap-1.5 font-display text-fs-20 font-bold">
        <output htmlFor={`${idPrefix}-min`}>{fmtEuro(min)}</output>
        <span aria-hidden="true">–</span>
        <output htmlFor={`${idPrefix}-max`}>
          {fmtEuro(max)}
          {max === PRICE.max ? "+" : ""}
        </output>
        <small className="font-body text-fs-13 font-medium text-fg-3">
          {SEARCH.perMonth}
        </small>
      </div>
      <div
        style={
          {
            "--amk-lo": `${pct(min)}%`,
            "--amk-hi": `${pct(max)}%`,
          } as CSSProperties
        }
        className="relative h-7 before:absolute before:inset-x-0 before:top-3 before:h-1 before:rounded-[4px] before:bg-bg-4 before:content-[''] after:absolute after:top-3 after:right-[calc(100%-var(--amk-hi))] after:left-(--amk-lo) after:h-1 after:rounded-[4px] after:bg-fg-1 after:content-['']"
      >
        <input
          id={`${idPrefix}-min`}
          type="range"
          min={PRICE.min}
          max={PRICE.max}
          step={PRICE.step}
          value={min}
          onChange={set("min")}
          aria-label={SEARCH.minPrice}
          aria-valuetext={`${fmtEuro(min)} ${SEARCH.perMonthText}`}
          className={cn("am-range-input", min > PRICE.max * 0.6 && "z-[3]")}
        />
        <input
          id={`${idPrefix}-max`}
          type="range"
          min={PRICE.min}
          max={PRICE.max}
          step={PRICE.step}
          value={max}
          onChange={set("max")}
          aria-label={SEARCH.maxPrice}
          aria-valuetext={`${fmtEuro(max)} ${SEARCH.perMonthText}`}
          className="am-range-input"
        />
      </div>
      <p className="text-fs-13 text-fg-3">{SEARCH.priceHint}</p>
    </div>
  )
}

type Props = {
  state: SearchState
  set: (patch: Patch) => void
  listings: EnrichedListing[]
  today: string
  idPrefix?: string
}

/* AmFilters (js/amk-search.jsx): the sidebar on desktop, the full-screen sheet below 1025px */
export function FilterPanel({
  state,
  set,
  listings,
  today,
  idPrefix = "amk-f",
}: Props) {
  const t = SEARCH
  const fc = (key: keyof SearchState, values: string[]) =>
    facetCounts(listings, state, key, values, today)
  const cc = fc(
    "country",
    COUNTRIES.map((c) => c.code)
  )
  const cities = cityOptions(listings, state.country)
  const gc = fc("gender", ["boys", "girls"])
  const lc = fc(
    "level",
    LEVELS.map((l) => l.id)
  )
  const ac = fc("acc", ["included", "available", "none"])
  const ec = fc("edu", ["included", "available", "none"])
  const vc = fc("ver", ["verified", "club"])
  const provision = (noun: string) => [
    { value: "", label: t.any },
    { value: "included", label: `${noun} ${t.included}` },
    { value: "available", label: t.includedOrOptional },
    { value: "none", label: t.notNeeded },
  ]
  return (
    <div className="grid">
      <FilterSection id={`${idPrefix}-price`} title={t.price}>
        <PriceRange
          min={state.min}
          max={state.max}
          idPrefix={`${idPrefix}-p`}
          onChange={(r) => set(r)}
        />
      </FilterSection>
      <FilterSection
        id={`${idPrefix}-where`}
        title={t.countryCity}
        badge={state.country ? 1 : 0}
      >
        <Radios
          name={`${idPrefix}-country`}
          value={state.country}
          counts={cc}
          options={[
            { value: "", label: t.allCountries },
            ...COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
          ]}
          onChange={(v) => set({ country: v, city: "" })}
        />
        <label
          htmlFor={`${idPrefix}-city`}
          className="mt-1.5 text-fs-14 font-semibold text-fg-1"
        >
          {t.city}
        </label>
        <NativeSelect
          id={`${idPrefix}-city`}
          value={state.city}
          onChange={(e) => set({ city: e.target.value })}
        >
          <option value="">{t.allCities}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </NativeSelect>
      </FilterSection>
      <FilterSection id={`${idPrefix}-gender`} title={t.openTo}>
        <Radios
          name={`${idPrefix}-gender`}
          value={state.gender}
          counts={gc}
          options={[
            { value: "", label: t.anyone },
            { value: "boys", label: t.boys },
            { value: "girls", label: t.girls },
          ]}
          onChange={(v) => set({ gender: v })}
        />
      </FilterSection>
      <FilterSection id={`${idPrefix}-level`} title={t.level}>
        <Radios
          name={`${idPrefix}-level`}
          value={state.level}
          counts={lc}
          options={[
            { value: "", label: t.anyLevel },
            ...LEVELS.map((l) => ({ value: l.id, label: l.label })),
          ]}
          onChange={(v) => set({ level: v })}
        />
      </FilterSection>
      <FilterSection id={`${idPrefix}-acc`} title={t.accommodation}>
        <Radios
          name={`${idPrefix}-acc`}
          value={state.acc}
          counts={ac}
          options={provision(t.accommodation)}
          onChange={(v) => set({ acc: v })}
        />
      </FilterSection>
      <FilterSection id={`${idPrefix}-edu`} title={t.education}>
        <Radios
          name={`${idPrefix}-edu`}
          value={state.edu}
          counts={ec}
          options={provision(t.schooling)}
          onChange={(v) => set({ edu: v })}
        />
      </FilterSection>
      <FilterSection id={`${idPrefix}-ver`} title={t.verification}>
        <Radios
          name={`${idPrefix}-ver`}
          value={state.ver}
          counts={vc}
          options={[
            { value: "", label: t.showAll },
            { value: "verified", label: t.verifiedOnly },
            { value: "club", label: t.clubOnly },
          ]}
          onChange={(v) => set({ ver: v })}
        />
      </FilterSection>
    </div>
  )
}
