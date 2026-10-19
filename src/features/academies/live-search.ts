import { DURATIONS, GENDERS, LEVELS, TYPES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import { addDays, monthLabel } from "@/lib/date"

import type { SearchParams, SearchSort } from "./api"
import { valueLabel } from "./card-view"

/*
 * The search screen in api mode (week 1 part 2, section 14). The URL keeps
 * the contract's own parameter names, so a shared link reads like the API
 * call. Money in the URL is in major units (price_max=9000); the API gets
 * minor units. Everything is validated here, before sending, so the screen
 * never sends a value the backend refuses with 422 (q of 1 character, an age
 * outside 3-99, a price_max below price_min, a start_to before start_from).
 */
export type LiveSearch = {
  q: string
  country: string
  city: string
  /** "" or 3..99 */
  age: string
  gender: string
  type: string
  level: string
  /** major units, "" = no bound */
  priceMin: string
  priceMax: string
  currency: string
  /** a prototype duration bucket (short | half | season), "" = any */
  dur: string
  /** "" | "soon" (next 3 months) | "YYYY-MM" */
  start: string
  places: boolean
  /** "" = any, "true" = with it, "false" = without it */
  acc: "" | "true" | "false"
  edu: "" | "true" | "false"
  club: boolean
  sort: SearchSort
  page: number
}

export const LIVE_DEFAULT: LiveSearch = {
  q: "",
  country: "",
  city: "",
  age: "",
  gender: "",
  type: "",
  level: "",
  priceMin: "",
  priceMax: "",
  currency: "",
  dur: "",
  start: "",
  places: false,
  acc: "",
  edu: "",
  club: false,
  sort: "relevance",
  page: 1,
}

export const PER_PAGE = 20

/** The prototype's sort labels for the backend's sorts ("Top rated" waits for reviews, week 3) */
export const LIVE_SORTS: { id: SearchSort; label: string }[] = [
  { id: "relevance", label: "Recommended" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
  { id: "start_date", label: "Soonest start" },
]

/** The prototype's duration buckets, in weeks ("Rolling monthly" has no search filter) */
export const LIVE_DURATIONS = DURATIONS.filter(
  (d): d is (typeof DURATIONS)[number] & { min: number; max: number } =>
    d.min !== null && d.max !== null
)

const SORT_IDS = new Set<SearchSort>(LIVE_SORTS.map((s) => s.id))
const tri = (v: string | null): "" | "true" | "false" =>
  v === "true" || v === "false" ? v : ""
const money = (v: string | null) =>
  v && /^\d{1,7}(\.\d{1,2})?$/.test(v) ? v : ""

/** URL -> state (anything invalid is dropped, never sent) */
export function parseLive(query: string): LiveSearch {
  const p = new URLSearchParams(query)
  const get = (k: string) => (p.get(k) ?? "").trim()
  const age = get("age")
  const sort = get("sort") as SearchSort
  const page = Number(get("page"))
  const start = get("start")
  return {
    q: get("q").slice(0, 100),
    country: /^[A-Za-z]{2}$/.test(get("country"))
      ? get("country").toUpperCase()
      : "",
    city: get("city").slice(0, 120),
    age: /^\d+$/.test(age) && +age >= 3 && +age <= 99 ? age : "",
    gender: get("gender"),
    type: get("academy_type"),
    level: get("playing_level"),
    priceMin: money(get("price_min")),
    priceMax: money(get("price_max")),
    currency: /^[A-Za-z]{3}$/.test(get("currency"))
      ? get("currency").toUpperCase()
      : "",
    dur: LIVE_DURATIONS.some((d) => d.id === get("duration"))
      ? get("duration")
      : "",
    start: start === "soon" || /^\d{4}-\d{2}$/.test(start) ? start : "",
    places: get("has_places") === "true",
    acc: tri(p.get("has_accommodation")),
    edu: tri(p.get("has_education")),
    club: get("club_academy") === "true",
    sort: SORT_IDS.has(sort) ? sort : "relevance",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

/** state -> URL query ("" when nothing is set) */
export function toLiveQuery(s: LiveSearch): string {
  const p = new URLSearchParams()
  const put = (k: string, v: string | boolean | number) => {
    if (v === "" || v === false) return
    p.set(k, String(v))
  }
  put("q", s.q)
  put("country", s.country)
  put("city", s.city)
  put("age", s.age)
  put("gender", s.gender)
  put("academy_type", s.type)
  put("playing_level", s.level)
  put("price_min", s.priceMin)
  put("price_max", s.priceMax)
  if (s.priceMin || s.priceMax) put("currency", s.currency)
  put("duration", s.dur)
  put("start", s.start)
  put("has_places", s.places)
  put("has_accommodation", s.acc)
  put("has_education", s.edu)
  put("club_academy", s.club)
  if (s.sort !== "relevance") put("sort", s.sort)
  if (s.page > 1) put("page", s.page)
  const out = p.toString()
  return out ? `?${out}` : ""
}

const minor = (major: string) => Math.round(Number(major) * 100)
const lastDay = (ym: string) => {
  const [y, m] = ym.split("-").map(Number)
  const d = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${ym}-${String(d).padStart(2, "0")}`
}

/** state -> GET /academy/search parameters (contract names, units and rules) */
export function toSearchParams(
  s: LiveSearch,
  today: string,
  defaultCurrency = "EUR"
): SearchParams {
  const p: SearchParams = { sort: s.sort, per_page: PER_PAGE, page: s.page }
  // q: 2 to 100 characters, else not sent
  const q = s.q.trim()
  if (q.length >= 2) p.q = q.slice(0, 100)
  if (s.country) p.country = s.country
  if (s.city) p.city = s.city
  if (s.age) p.age = Number(s.age)
  if (s.gender) p.gender = s.gender
  if (s.type) p.academy_type = s.type
  if (s.level) p.playing_level = s.level
  // a price range compares within one currency (default EUR)
  let lo = s.priceMin ? minor(s.priceMin) : null
  let hi = s.priceMax ? minor(s.priceMax) : null
  if (lo !== null && hi !== null && hi < lo) [lo, hi] = [hi, lo]
  if (lo !== null) p.price_min = lo
  if (hi !== null) p.price_max = hi
  if (lo !== null || hi !== null) p.currency = s.currency || defaultCurrency
  const dur = LIVE_DURATIONS.find((d) => d.id === s.dur)
  if (dur) {
    p.duration_min = dur.min
    p.duration_max = dur.max
  }
  if (s.start === "soon") {
    p.start_from = today
    p.start_to = addDays(today, 90)
  } else if (s.start) {
    // a month: from its first day (never before today) to its last day
    const first = `${s.start}-01`
    p.start_from = first < today ? today : first
    p.start_to = lastDay(s.start)
    if (p.start_to < p.start_from) p.start_to = p.start_from
  }
  if (s.places) p.has_places = true
  if (s.acc) p.has_accommodation = s.acc === "true"
  if (s.edu) p.has_education = s.edu === "true"
  if (s.club) p.club_academy = true
  return p
}

/** "Any time", "Next 3 months", then the next 12 months */
export function liveStartOptions(today: string) {
  const opts = [
    { value: "", label: "Any time" },
    { value: "soon", label: "Next 3 months" },
  ]
  const [y, m] = today.split("-").map(Number)
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(y, m - 1 + i, 1))
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    opts.push({ value: ym, label: monthLabel(`${ym}-01`) })
  }
  return opts
}

/** A backend value as words: the prototype's label when it matches, else written out */
export const typeWord = (v: string) => valueLabel(TYPES, v)
export const levelWord = (v: string) => valueLabel(LEVELS, v)
export const genderWord = (v: string) => valueLabel(GENDERS, v)

/** The active filters as removable chips (sort and page are not filters) */
export function liveChips(
  s: LiveSearch,
  names: { country: (code: string) => string }
): { key: keyof LiveSearch; label: string }[] {
  const chips: { key: keyof LiveSearch; label: string }[] = []
  if (s.q.trim()) chips.push({ key: "q", label: `“${s.q.trim()}”` })
  if (s.country) chips.push({ key: "country", label: names.country(s.country) })
  if (s.city) chips.push({ key: "city", label: s.city })
  if (s.age) chips.push({ key: "age", label: `Age ${s.age}` })
  if (s.type) chips.push({ key: "type", label: typeWord(s.type) })
  if (s.level) chips.push({ key: "level", label: levelWord(s.level) })
  if (s.gender) chips.push({ key: "gender", label: genderWord(s.gender) })
  if (s.priceMin || s.priceMax)
    chips.push({
      key: "priceMin",
      label: LIVE.search.priceRange(
        `${s.currency || "EUR"} ${s.priceMin || "0"}`,
        s.priceMax || "…"
      ),
    })
  const dur = LIVE_DURATIONS.find((d) => d.id === s.dur)
  if (dur) chips.push({ key: "dur", label: dur.label })
  if (s.start)
    chips.push({
      key: "start",
      label:
        s.start === "soon"
          ? "Starts in the next 3 months"
          : "Starts " + monthLabel(`${s.start}-01`),
    })
  if (s.places) chips.push({ key: "places", label: LIVE.search.places })
  if (s.acc)
    chips.push({
      key: "acc",
      label: s.acc === "true" ? "Accommodation included" : "No accommodation",
    })
  if (s.edu)
    chips.push({
      key: "edu",
      label: s.edu === "true" ? "Schooling included" : "No schooling",
    })
  if (s.club) chips.push({ key: "club", label: LIVE.search.clubOnly })
  return chips
}

/** Removes one chip's filter (the price chip clears both bounds); back to page 1 */
export function removeLive(s: LiveSearch, key: keyof LiveSearch): LiveSearch {
  if (key === "priceMin" || key === "priceMax")
    return { ...s, priceMin: "", priceMax: "", currency: "", page: 1 }
  if (key === "country") return { ...s, country: "", city: "", page: 1 }
  return { ...s, [key]: LIVE_DEFAULT[key], page: 1 }
}

/** Clears every filter, keeps the sort */
export const clearLive = (s: LiveSearch): LiveSearch => ({
  ...LIVE_DEFAULT,
  sort: s.sort,
})
