"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { DisplayHeading } from "@/components/shared/display-heading"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { ListingCard } from "@/components/shared/listing-card"
import { Modal } from "@/components/shared/modal"
import { NativeSelect } from "@/components/shared/native-select"
import { SearchBar, type SearchDraft } from "@/components/shared/search-bar"
import { Button } from "@/components/ui/button"
import { EMPTY } from "@/data/copy"
import { LIVE } from "@/data/live-copy"
import { SEARCH } from "@/data/search-copy"
import {
  getSearchFilters,
  searchListings,
  type ApiSearchCard,
} from "@/features/academies/api"
import { cardFromSearch } from "@/features/academies/card-view"
import { AGES } from "@/features/academies/search"
import {
  LIVE_DURATIONS,
  LIVE_SORTS,
  clearLive,
  liveChips,
  liveStartOptions,
  parseLive,
  removeLive,
  toLiveQuery,
  toSearchParams,
  typeWord,
  type LiveSearch,
} from "@/features/academies/live-search"
import { discoveryKeys } from "@/features/academies/query-keys"
import { useHydrated } from "@/hooks/use-hydrated"
import { useMedia } from "@/hooks/use-media"
import { todayISO } from "@/lib/date"
import { press } from "@/lib/motion"
import { cn } from "@/lib/utils"

import { LiveFilterPanel } from "./live-filter-panel"
import { useLiveSaved } from "./use-live-saved"

const draftOf = (s: LiveSearch): SearchDraft => ({
  loc: s.q,
  age: s.age,
  type: s.type,
  start: s.start,
  dur: s.dur,
})

/*
 * Search in api mode (week 1 part 2, section 14): GET /academy/search with
 * every filter the contract has, the dropdowns from GET /search/filters, the
 * backend's sorts and pages of 20. The top bar stages its values until
 * Search; sidebar filters apply live; the state mirrors to the URL. The map
 * view is not offered: search cards carry no coordinates and the map is out
 * of this release (sync guide). Sponsored stays empty (is_sponsored is always
 * false).
 */
export function LiveSearchClient({ query }: { query: string }) {
  const [state, setState] = useState<LiveSearch>(() => parseLive(query))
  const [draft, setDraft] = useState<SearchDraft>(() => draftOf(state))
  const [sheet, setSheet] = useState(false)
  const hydrated = useHydrated()
  const wide = useMedia("(min-width: 1025px)")
  const saved = useLiveSaved()
  const t = SEARCH
  // "today" is the visitor's date: only known in the browser
  const today = hydrated ? todayISO() : ""

  const filters = useQuery({
    queryKey: discoveryKeys.filters(),
    queryFn: getSearchFilters,
    staleTime: 10 * 60 * 1000,
  })
  const params = useMemo(
    () =>
      today
        ? toSearchParams(state, today, filters.data?.default_currency)
        : null,
    [state, today, filters.data?.default_currency]
  )
  const results = useQuery({
    queryKey: discoveryKeys.search(params ?? {}),
    queryFn: () => searchListings(params ?? {}),
    enabled: params !== null,
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    window.history.replaceState(
      null,
      "",
      window.location.pathname + toLiveQuery(state)
    )
  }, [state])

  // any filter change goes back to page 1; the page buttons set page themselves
  const set = useCallback(
    (patch: Partial<LiveSearch>) =>
      setState((s) => ({ ...s, page: 1, ...patch })),
    []
  )
  const countryName = (code: string) =>
    filters.data?.countries.find((c) => c.code === code)?.name ?? code
  const chips = liveChips(state, { country: countryName })
  const filterCount = chips.filter(
    (c) => !["q", "age", "type", "start", "dur"].includes(c.key)
  ).length
  const onClear = () => {
    setState((s) => clearLive(s))
    setDraft(draftOf(clearLive(state)))
  }
  const onRemove = (key: keyof LiveSearch) => {
    const next = removeLive(state, key)
    setState(next)
    setDraft(draftOf(next))
  }

  const page = results.data
  const total = page?.meta.total ?? 0
  const lastPage = page?.meta.last_page ?? 1
  const programs = (n: number) => (n === 1 ? t.program : t.programs)
  const sidebar = wide
  const sort = LIVE_SORTS.find((x) => x.id === state.sort) ?? LIVE_SORTS[0]

  const typeOptions = (filters.data?.academy_types ?? []).map((v) => ({
    value: v,
    label: typeWord(v),
  }))
  const durationOptions = LIVE_DURATIONS.map((d) => ({
    value: d.id,
    label: d.label,
  }))
  const panel = (prefix: string) =>
    filters.data ? (
      <LiveFilterPanel
        state={state}
        set={set}
        filters={filters.data}
        idPrefix={prefix}
      />
    ) : null

  const card = (c: ApiSearchCard, i: number) => (
    <ListingCard
      index={i}
      key={c.id}
      card={cardFromSearch(c)}
      saved={saved.isSaved(c)}
      onSave={() => void saved.toggle(c)}
    />
  )

  return (
    <>
      <div className="sticky top-(--amk-nav-h) z-(--amk-z-sticky) border-b border-border-1 bg-glass-bg-nav-scrolled py-3 am-glass le-1024:static">
        <div className="am-container">
          <SearchBar
            variant="compact"
            idPrefix="amk-top"
            value={draft}
            onChange={setDraft}
            onSubmit={(v) =>
              set({
                q: v.loc,
                age: AGES.includes(Number(v.age)) ? v.age : "",
                type: v.type,
                start: v.start,
                dur: v.dur,
              })
            }
            startOptions={
              today
                ? liveStartOptions(today)
                : [{ value: "", label: "Any time" }]
            }
            typeOptions={typeOptions}
            durationOptions={durationOptions}
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
            {panel("amk-lf")}
          </aside>
        ) : null}
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <DisplayHeading as="h1" className="text-[clamp(26px,3vw,36px)]">
                <span aria-live="polite">{page ? total : ""}</span>{" "}
                {programs(total)}
                {state.country ? ` ${t.in} ${countryName(state.country)}` : ""}
              </DisplayHeading>
              <p className="text-fs-14 text-fg-3">
                {t.sortedBy} {sort.label.toLowerCase()}
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
                  onChange={(e) =>
                    set({ sort: e.target.value as LiveSearch["sort"] })
                  }
                  className="le-720:w-full"
                >
                  {LIVE_SORTS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </NativeSelect>
              </label>
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
                  className="inline-flex min-h-[34px] max-w-full items-center gap-[7px] rounded-pill border border-border-3 bg-surface-elevated px-3 py-[5px] text-fs-13 font-semibold text-fg-1 [transition:background_var(--dur-base),color_var(--dur-base),border-color_var(--dur-base)] hover:border-fg-1 hover:bg-fg-1 hover:text-bg-0"
                >
                  <>
                    <span className="truncate">{c.label}</span>
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

          {results.isError && !page ? (
            <ErrorState
              message={LIVE.requestFailed}
              onRetry={() => void results.refetch()}
            />
          ) : !page ? (
            <div
              aria-hidden="true"
              className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-6"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="h-[380px] animate-pulse rounded-lg bg-bg-2"
                />
              ))}
            </div>
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
          ) : (
            <>
              <div
                aria-busy={results.isFetching || undefined}
                className={cn(
                  "grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(20px,2.5vw,32px)] [transition:opacity_var(--dur-base)]",
                  results.isFetching && "opacity-60"
                )}
              >
                {page.data.map(card)}
              </div>
              {lastPage > 1 ? (
                <nav
                  aria-label={LIVE.search.page(state.page, lastPage)}
                  className="flex flex-wrap items-center justify-center gap-3 pt-2"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={state.page <= 1}
                    onClick={() => {
                      setState((s) => ({ ...s, page: s.page - 1 }))
                      window.scrollTo({ top: 0 })
                    }}
                  >
                    <Icon name="arrowl" size={16} /> {LIVE.search.previous}
                  </Button>
                  <span className="text-fs-14 text-fg-2">
                    {LIVE.search.page(state.page, lastPage)}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={state.page >= lastPage}
                    onClick={() => {
                      setState((s) => ({ ...s, page: s.page + 1 }))
                      window.scrollTo({ top: 0 })
                    }}
                  >
                    {LIVE.search.next} <Icon name="arrow" size={16} />
                  </Button>
                </nav>
              ) : null}
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
        {panel("amk-lfs")}
      </Modal>
    </>
  )
}
