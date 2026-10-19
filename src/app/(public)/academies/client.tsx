"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { DisplayHeading } from "@/components/shared/display-heading"
import { EmptyState } from "@/components/shared/empty-state"
import { ListingCard } from "@/components/shared/listing-card"
import { Modal } from "@/components/shared/modal"
import { NativeSelect } from "@/components/shared/native-select"
import { SearchBar, type SearchDraft } from "@/components/shared/search-bar"
import { SegmentedControl } from "@/components/shared/segmented-control"
import { useSaveToggle } from "@/components/shared/use-save-toggle"
import { Button } from "@/components/ui/button"
import { EMPTY } from "@/data/copy"
import { SEARCH } from "@/data/search-copy"
import { useAcademySearch } from "@/features/academies/hooks"
import {
  DEFAULT_STATE,
  SORTS,
  activeChips,
  clearFilters,
  countryName,
  parseQuery,
  removeFilter,
  toQuery,
} from "@/features/academies/search"
import type { EnrichedListing, SearchState } from "@/features/academies/types"
import { useMedia } from "@/hooks/use-media"
import { press } from "@/lib/motion"
import { cn } from "@/lib/utils"

import { FilterPanel } from "@/components/search/filter-panel"
import { ResultsMap } from "@/components/search/results-map"
import { SponsoredSlot } from "@/components/search/sponsored-slot"

const TOP = ["loc", "age", "type", "start", "dur"] as const
const pickTop = (s: SearchState): SearchDraft => ({
  loc: s.loc,
  age: s.age,
  type: s.type,
  start: s.start,
  dur: s.dur,
})

/*
 * Search results (search.html). The top bar stages its values until Search;
 * the sidebar filters apply live. State mirrors to the URL with replaceState
 * so a search can be shared.
 */
export function AcademiesClient({ query }: { query: string }) {
  const [state, setState] = useState<SearchState>(() => parseQuery(query))
  const [draft, setDraft] = useState<SearchDraft>(() => pickTop(state))
  const [sheet, setSheet] = useState(false)
  const [hoverAcademy, setHoverAcademy] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const wide = useMedia("(min-width: 1025px)")
  const {
    ready,
    today,
    saved,
    listings,
    result: res,
    startOptions,
  } = useAcademySearch(state)
  const onSave = useSaveToggle()
  const t = SEARCH

  useEffect(() => {
    window.history.replaceState(
      null,
      "",
      window.location.pathname + toQuery(state)
    )
  }, [state])

  const set = (patch: Partial<SearchState>) =>
    setState((s) => ({ ...s, ...patch }))
  const chips = activeChips(state)
  const map = state.view === "map"
  const sidebar = wide && !map
  const filterCount = chips.filter(
    (c) => !(TOP as readonly string[]).includes(c.key)
  ).length

  const onRemove = (key: string) => {
    setState((s) => removeFilter(s, key))
    if ((TOP as readonly string[]).includes(key))
      setDraft((d) => ({
        ...d,
        [key]: DEFAULT_STATE[key as keyof SearchDraft],
      }))
  }
  const onClear = () => {
    setState((s) => clearFilters(s))
    setDraft(pickTop(DEFAULT_STATE))
  }
  const hoverCard = (id: string | null) =>
    setHoverAcademy(
      id ? (listings.find((l) => l.id === id)?.academyId ?? null) : null
    )
  const total = res.total
  const programs = (n: number) => (n === 1 ? t.program : t.programs)

  const cards = (list: EnrichedListing[], one = false) => (
    <div
      className={cn(
        "grid gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(20px,2.5vw,32px)]",
        one
          ? "grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))]"
          : "grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))]"
      )}
    >
      {list.map((l, i) => (
        <ListingCard
          index={i}
          key={l.id}
          listing={l}
          saved={saved.includes(l.id)}
          onSave={onSave}
          onHover={hoverCard}
        />
      ))}
    </div>
  )
  const sponsoredSlot = res.sponsored ? (
    <SponsoredSlot
      listing={res.sponsored}
      saved={saved.includes(res.sponsored.id)}
      onSave={onSave}
      map={map}
    />
  ) : null
  const sort = SORTS.find((x) => x.id === state.sort) ?? SORTS[0]

  return (
    <>
      <div className="sticky top-(--amk-nav-h) z-(--amk-z-sticky) border-b border-border-1 bg-glass-bg-nav-scrolled py-3 am-glass le-1024:static">
        <div className="am-container">
          <SearchBar
            variant="compact"
            idPrefix="amk-top"
            value={draft}
            onChange={setDraft}
            onSubmit={(v) => set(v)}
            startOptions={ready ? startOptions : startOptions.slice(0, 2)}
          />
        </div>
      </div>
      <div
        className={cn(
          "am-container grid grid-cols-[minmax(0,1fr)] gap-[clamp(24px,3vw,40px)] pt-7 pb-20",
          sidebar &&
            "grid-cols-[272px_minmax(0,1fr)] le-1180:grid-cols-[240px_minmax(0,1fr)]"
        )}
      >
        {sidebar ? (
          <aside
            aria-label={t.filters}
            className="sticky top-[calc(var(--amk-nav-h)+96px)] max-h-[calc(100vh-var(--amk-nav-h)-112px)] [scrollbar-width:thin] self-start overflow-auto overscroll-contain pr-1.5"
          >
            <div className="flex items-center justify-between gap-2 pb-2">
              <h2 className="font-display text-fs-18 leading-lh-snug font-bold text-fg-1">
                {t.filters}
              </h2>
              {filterCount > 0 ? (
                <Button variant="ghost" size="sm" onClick={onClear}>
                  {t.clearAll}
                </Button>
              ) : null}
            </div>
            {ready ? (
              <FilterPanel
                state={state}
                set={set}
                listings={listings}
                today={today}
              />
            ) : null}
          </aside>
        ) : null}
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <DisplayHeading as="h1" className="text-[clamp(26px,3vw,36px)]">
                <span aria-live="polite">{ready ? total : ""}</span>{" "}
                {programs(total)}
                {state.country ? ` ${t.in} ${countryName(state.country)}` : ""}
              </DisplayHeading>
              <p className="text-fs-14 text-fg-3">
                {t.sortedBy} {sort.label.toLowerCase()} · {t.feesInEur}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-[10px] le-720:w-full">
              {!sidebar ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSheet(true)}
                  aria-haspopup="dialog"
                >
                  <Icon name="sliders" size={16} /> {t.filters}
                  {filterCount ? ` (${filterCount})` : ""}
                </Button>
              ) : null}
              <label className="inline-flex le-720:flex-1">
                <span className="am-sr">{t.sortBy}</span>
                <NativeSelect
                  size="sm"
                  value={state.sort}
                  onChange={(e) => set({ sort: e.target.value })}
                  className="le-720:w-full"
                >
                  {SORTS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </NativeSelect>
              </label>
              <SegmentedControl<"list" | "map">
                label={t.resultsView}
                value={map ? "map" : "list"}
                onChange={(v) => set({ view: v })}
                tabs={[
                  { value: "list", label: t.list, icon: "grid" },
                  { value: "map", label: t.map, icon: "map" },
                ]}
              />
            </div>
          </div>

          {chips.length > 0 ? (
            <div
              aria-label={t.activeFilters}
              className="flex flex-wrap items-center gap-2"
            >
              {chips.map((c) => (
                <motion.button
                  {...press}
                  key={c.key}
                  type="button"
                  onClick={() => onRemove(c.key)}
                  aria-label={`${t.removeFilter} ${c.label}`}
                  className="inline-flex min-h-[34px] items-center gap-[7px] rounded-pill border border-border-3 bg-surface-elevated px-3 py-[5px] text-fs-13 font-semibold text-fg-1 [transition:background_var(--dur-base),color_var(--dur-base),border-color_var(--dur-base)] hover:border-fg-1 hover:bg-fg-1 hover:text-bg-0"
                >
                  <>
                    {c.label}
                    <Icon name="x" size={12} sw={2.4} />
                  </>
                </motion.button>
              ))}
              {chips.length > 1 ? (
                <button
                  type="button"
                  onClick={onClear}
                  className="min-h-[34px] border-0 bg-transparent px-2 py-[5px] text-fs-13 font-semibold text-fg-2 underline underline-offset-3 hover:text-fg-1"
                >
                  {t.clearAll}
                </button>
              ) : null}
            </div>
          ) : null}

          {!ready ? (
            <div className="min-h-[480px]" />
          ) : total === 0 ? (
            <EmptyState
              icon="search"
              title={EMPTY.search.title}
              text={EMPTY.search.text}
              cta={
                <Button variant="secondary" onClick={onClear}>
                  {EMPTY.search.cta}
                </Button>
              }
            />
          ) : map ? (
            <div className="grid grid-cols-[minmax(0,6fr)_minmax(0,5fr)] items-start gap-6 le-1024:grid-cols-[1fr]">
              <div className="order-none grid min-w-0 gap-5 le-1024:order-1">
                {sponsoredSlot}
                {cards(res.organic, true)}
              </div>
              <div className="sticky top-[calc(var(--amk-nav-h)+96px)] le-1024:static le-1024:-order-1">
                <ResultsMap
                  listings={
                    res.sponsored
                      ? [res.sponsored, ...res.organic]
                      : res.organic
                  }
                  activeAcademy={hoverAcademy}
                  selected={selected}
                  onSelect={setSelected}
                />
              </div>
            </div>
          ) : (
            <>
              {sponsoredSlot}
              {cards(res.organic)}
            </>
          )}
        </div>
      </div>

      <Modal
        open={sheet}
        onClose={() => setSheet(false)}
        title={t.filters}
        size="full"
        footer={
          <>
            <Button variant="ghost" onClick={onClear}>
              {t.clearAll}
            </Button>
            <Button onClick={() => setSheet(false)} data-autofocus>
              {t.show} {total} {programs(total)}
            </Button>
          </>
        }
      >
        <FilterPanel
          state={state}
          set={set}
          listings={listings}
          today={today}
          idPrefix="amk-fs"
        />
      </Modal>
    </>
  )
}
