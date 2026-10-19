"use client"

import { useEffect, useState } from "react"

import { CheckField } from "@/components/shared/check-field"
import { NativeSelect } from "@/components/shared/native-select"
import { Input } from "@/components/ui/input"
import { LIVE } from "@/data/live-copy"
import { SEARCH } from "@/data/search-copy"
import type { ApiSearchFilters } from "@/features/academies/api"
import { levelWord, type LiveSearch } from "@/features/academies/live-search"
import { formatMoney } from "@/lib/money"

import { FilterSection, Radios } from "./filter-panel"

type Patch = Partial<LiveSearch>

/** The prototype's "Open to" wording for the backend's genders */
const genderLabel = (g: string) =>
  g === "male"
    ? SEARCH.boys
    : g === "female"
      ? SEARCH.girls
      : g.charAt(0).toUpperCase() + g.slice(1)

/*
 * Search filters in api mode. Every list comes from GET /academy/search/filters
 * (countries and cities that have visible listings, types, levels, genders,
 * currencies and the price bounds per currency); nothing is hard-coded. The
 * prototype's facet counts and monthly price slider have no API equivalent,
 * so the price is a min / max in the chosen currency (the API compares prices
 * within one currency).
 */
export function LiveFilterPanel({
  state,
  set,
  filters,
  idPrefix = "amk-lf",
}: {
  state: LiveSearch
  set: (patch: Patch) => void
  filters: ApiSearchFilters
  idPrefix?: string
}) {
  const t = SEARCH
  const L = LIVE.search
  const cities = filters.cities.filter(
    (c) => !state.country || c.country_code === state.country
  )
  const currency = state.currency || filters.default_currency
  const bounds = filters.prices.find((p) => p.currency === currency)

  const tri = (v: string) => (v === "true" || v === "false" ? v : "")

  return (
    <div>
      <FilterSection
        id={`${idPrefix}-loc`}
        title={t.countryCity}
        badge={(state.country ? 1 : 0) + (state.city ? 1 : 0)}
      >
        <label className="am-sr" htmlFor={`${idPrefix}-country`}>
          {t.allCountries}
        </label>
        <NativeSelect
          id={`${idPrefix}-country`}
          value={state.country}
          onChange={(e) => set({ country: e.target.value, city: "" })}
        >
          <option value="">{t.allCountries}</option>
          {filters.countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
        <label className="am-sr" htmlFor={`${idPrefix}-city`}>
          {t.city}
        </label>
        <NativeSelect
          id={`${idPrefix}-city`}
          value={state.city}
          onChange={(e) => set({ city: e.target.value })}
        >
          <option value="">{t.allCities}</option>
          {cities.map((c) => (
            <option key={`${c.country_code}-${c.city}`} value={c.city}>
              {c.city}
            </option>
          ))}
        </NativeSelect>
      </FilterSection>

      <FilterSection
        id={`${idPrefix}-price`}
        title={t.price}
        badge={state.priceMin || state.priceMax ? 1 : 0}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <label className="col-span-full grid gap-1 text-fs-12 font-semibold text-fg-3">
            {L.currency}
            <NativeSelect
              size="sm"
              value={currency}
              onChange={(e) =>
                set({
                  currency: e.target.value,
                  // the bounds belong to one currency: changing it clears them
                  priceMin: "",
                  priceMax: "",
                })
              }
            >
              {filters.currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </NativeSelect>
          </label>
          <PriceFields
            key={`${state.priceMin}|${state.priceMax}|${currency}`}
            min={state.priceMin}
            max={state.priceMax}
            currency={currency}
            placeholders={
              bounds
                ? [
                    String(Math.floor(bounds.min.amount_minor / 100)),
                    String(Math.ceil(bounds.max.amount_minor / 100)),
                  ]
                : ["", ""]
            }
            set={set}
          />
        </div>
        <p className="text-fs-13 text-fg-3">
          {L.priceHint(currency)}
          {bounds
            ? ` ${formatMoney(bounds.min)} – ${formatMoney(bounds.max)}.`
            : ""}
        </p>
      </FilterSection>

      <FilterSection
        id={`${idPrefix}-gender`}
        title={t.openTo}
        badge={state.gender ? 1 : 0}
      >
        <Radios
          name={`${idPrefix}-gender`}
          value={state.gender}
          onChange={(v) => set({ gender: v })}
          options={[
            { value: "", label: t.anyone },
            ...filters.genders.map((g) => ({
              value: g,
              label: genderLabel(g),
            })),
          ]}
        />
      </FilterSection>

      <FilterSection
        id={`${idPrefix}-level`}
        title={t.level}
        badge={state.level ? 1 : 0}
      >
        <Radios
          name={`${idPrefix}-level`}
          value={state.level}
          onChange={(v) => set({ level: v })}
          options={[
            { value: "", label: t.anyLevel },
            ...filters.playing_levels.map((l) => ({
              value: l,
              label: levelWord(l),
            })),
          ]}
        />
      </FilterSection>

      <FilterSection
        id={`${idPrefix}-acc`}
        title={t.accommodation}
        badge={state.acc ? 1 : 0}
      >
        <Radios
          name={`${idPrefix}-acc`}
          value={state.acc}
          onChange={(v) => set({ acc: tri(v) })}
          options={[
            { value: "", label: L.any },
            { value: "true", label: L.withIt },
            { value: "false", label: L.without },
          ]}
        />
      </FilterSection>

      <FilterSection
        id={`${idPrefix}-edu`}
        title={t.education}
        badge={state.edu ? 1 : 0}
      >
        <Radios
          name={`${idPrefix}-edu`}
          value={state.edu}
          onChange={(v) => set({ edu: tri(v) })}
          options={[
            { value: "", label: L.any },
            { value: "true", label: L.withIt },
            { value: "false", label: L.without },
          ]}
        />
      </FilterSection>

      <FilterSection
        id={`${idPrefix}-ver`}
        title={t.verification}
        badge={state.club ? 1 : 0}
      >
        <Radios
          name={`${idPrefix}-ver`}
          value={state.club ? "club" : ""}
          onChange={(v) => set({ club: v === "club" })}
          options={[
            { value: "", label: t.showAll },
            { value: "club", label: t.clubOnly },
          ]}
        />
      </FilterSection>

      <FilterSection
        id={`${idPrefix}-places`}
        title={L.places}
        badge={state.places ? 1 : 0}
      >
        <CheckField
          checked={state.places}
          onChange={(e) => set({ places: e.target.checked })}
        >
          {L.placesHint}
        </CheckField>
      </FilterSection>
    </div>
  )
}

/** Min / max in major units; applied after a short pause, not on every key */
function PriceFields({
  min,
  max,
  currency,
  placeholders,
  set,
}: {
  min: string
  max: string
  currency: string
  placeholders: [string, string] | string[]
  set: (patch: Patch) => void
}) {
  const L = LIVE.search
  const [lo, setLo] = useState(min)
  const [hi, setHi] = useState(max)
  useEffect(() => {
    if (lo === min && hi === max) return
    const ok = (v: string) => v === "" || /^\d{1,7}(\.\d{1,2})?$/.test(v)
    if (!ok(lo) || !ok(hi)) return
    const id = setTimeout(
      () =>
        set({ priceMin: lo, priceMax: hi, currency: lo || hi ? currency : "" }),
      500
    )
    return () => clearTimeout(id)
  }, [lo, hi, min, max, currency, set])
  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string
  ) => (
    <label className="grid gap-1 text-fs-12 font-semibold text-fg-3">
      {label}
      <Input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(",", "."))}
        placeholder={placeholder}
        className="min-h-9 px-3 py-1.5 text-fs-14"
      />
    </label>
  )
  return (
    <>
      {field(L.min, lo, setLo, placeholders[0] ?? "")}
      {field(L.max, hi, setHi, placeholders[1] ?? "")}
    </>
  )
}
