import * as CAT from "@/data/catalog"
import type {
  Academy,
  Catalog,
  Listing,
  Organization,
  Verification,
} from "@/data/types"
import * as FLOW from "@/features/applications/flow"
import type { AppStatus } from "@/features/applications/types"
import type {
  CrestData,
  EnrichedIntake,
  EnrichedListing,
  SearchState,
} from "@/features/academies/types"

const D = CAT.DATES

/* Price filter works on the monthly equivalent so season, term, weekly
   and monthly fees compare fairly (label: "≈ €X / month"). */
export const PRICE = { min: 100, max: 2500, step: 50 }
export const AGES: number[] = []
for (let a = 8; a <= 23; a++) AGES.push(a)
export const SORTS: { id: string; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Top rated" },
  { id: "start", label: "Soonest start" },
]

export const DEFAULT_STATE: SearchState = {
  loc: "",
  age: "",
  type: "",
  start: "",
  dur: "",
  country: "",
  city: "",
  gender: "",
  level: "",
  min: PRICE.min,
  max: PRICE.max,
  acc: "",
  edu: "",
  ver: "",
  sort: "recommended",
  view: "list",
}

const ALIASES: Record<string, string> = {
  valencia: "valència",
  barcelona: "barca catalonia catalunya",
  madrid: "",
  lisbon: "lisboa",
  porto: "oporto",
  munich: "münchen munchen bavaria",
  milan: "milano lombardy",
  lyon: "lyons",
  manchester: "england uk",
  london: "england uk",
  malaga: "andalusia costa del sol",
}

const MONOGRAMS: Record<string, string> = {
  valencia: "VI",
  barcelona: "BE",
  madrid: "MP",
  lisbon: "LD",
  porto: "PA",
  munich: "MU",
  milan: "MY",
  lyon: "LR",
  manchester: "MF",
  london: "LG",
  malaga: "CA",
}

export function norm(s: unknown): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
/* Deterministic crest for academies without a logo: 4 shield shapes ×
   4 stripe patterns + monogram. Rendered by AmClubCrest. */
export function crestFor(academy: Pick<Academy, "id" | "name">): CrestData {
  const h = hash(academy.id)
  return {
    shape: (h % 4) as CrestData["shape"],
    pattern: ((h >>> 3) % 4) as CrestData["pattern"],
    initials: MONOGRAMS[academy.id] || academy.name.slice(0, 2).toUpperCase(),
  }
}

function byId<T extends { id: string }>(list: T[]): Record<string, T> {
  const m: Record<string, T> = {}
  list.forEach(function (x) {
    m[x.id] = x
  })
  return m
}
export function countryName(code: string): string {
  const c = CAT.COUNTRIES.filter(function (x) {
    return x.code === code
  })[0]
  return c ? c.name : code
}

/* Bayesian rating so 3 perfect reviews don't outrank 200 great ones. */
function bayes(l: Pick<Listing, "reviewSummary">): number {
  const C = 20,
    m = 4.5,
    s = l.reviewSummary
  return (C * m + s.count * s.avg) / (C + s.count)
}

const COMPLETENESS_FIELDS: (keyof Listing)[] = [
  "summary",
  "methodology",
  "competition",
  "includes",
  "requirements",
  "documents",
  "gallery",
  "accommodationNote",
]
export function completeness(l: Listing): number {
  const have = COMPLETENESS_FIELDS.filter(function (f) {
    const v = l[f]
    return Array.isArray(v) ? v.length > 0 : !!v
  }).length
  const base = have / COMPLETENESS_FIELDS.length
  const photos = Math.min(1, (l.gallery || []).length / 5)
  return Math.round((base * 0.8 + photos * 0.2) * 100)
}

/* Adds everything a card / map pin / detail page needs. */
export function enrich(
  catalog: Pick<Catalog, "academies" | "orgs" | "listings">,
  apps: { intakeId: string; status: AppStatus }[],
  today: string
): EnrichedListing[] {
  const acad: Record<string, Academy> = byId(catalog.academies)
  const orgs: Record<string, Organization> = byId(catalog.orgs)
  return catalog.listings.map(function (l): EnrichedListing {
    const a = acad[l.academyId]
    const o = orgs[a.orgId]
    const open = FLOW.openIntakes(l, today)
    const intakes = l.intakes.map(function (i): EnrichedIntake {
      return {
        ...i,
        placesLeft: FLOW.placesLeft(i, apps),
        open: FLOW.isOpen(i, today),
      }
    })
    const next =
      intakes.filter(function (i) {
        return i.open
      })[0] || null
    const country = countryName(a.countryCode)
    return {
      ...l,
      intakes: intakes,
      academy: a,
      org: o,
      verification: o.verification as Verification,
      country: country,
      city: a.city,
      crest: crestFor(a),
      monthly: FLOW.monthlyEquivalent(l),
      total: FLOW.programTotal(l),
      deposit: FLOW.depositOf(l),
      nextIntake: next,
      openCount: open.length,
      bayes: bayes(l),
      completeness: completeness(l),
      haystack: norm(
        [l.title, a.name, a.city, country, a.clubName, ALIASES[a.id]].join(" ")
      ),
    }
  })
}

function durBucket(l: EnrichedListing): string {
  if (l.rolling) return "rolling"
  const w = l.durationWeeks ?? 0
  return CAT.DURATIONS.filter(function (d) {
    return d.min != null && d.max != null && w >= d.min && w <= d.max
  })[0].id
}
function provisionMatch(value: string, want: string): boolean {
  if (!want) return true
  if (want === "available") return value === "included" || value === "optional"
  return value === want
}
function startMatch(l: EnrichedListing, want: string, today: string): boolean {
  if (!want) return true
  const open = l.intakes.filter(function (i) {
    return i.open
  })
  if (want === "soon") {
    const limit = D.addDays(today, 92)
    return open.some(function (i) {
      return i.start <= limit
    })
  }
  return open.some(function (i) {
    return D.monthKey(i.start) === want
  })
}

export function matches(
  l: EnrichedListing,
  s: SearchState,
  today: string
): boolean {
  if (s.loc) {
    const toks = norm(s.loc).split(/\s+/).filter(Boolean)
    if (
      !toks.every(function (t) {
        return l.haystack.indexOf(t) > -1
      })
    )
      return false
  }
  if (s.age !== "" && s.age != null) {
    const age = +s.age
    if (age < l.ageMin || age > l.ageMax) return false
  }
  if (s.type && l.type !== s.type) return false
  if (s.level && l.level !== s.level) return false
  if (s.gender && !(l.gender === s.gender || l.gender === "mixed")) return false
  if (s.dur && durBucket(l) !== s.dur) return false
  if (s.country && l.academy.countryCode !== s.country) return false
  if (s.city && l.city !== s.city) return false
  if (l.monthly < s.min || l.monthly > s.max) return false
  if (!provisionMatch(l.accommodation, s.acc)) return false
  if (!provisionMatch(l.education, s.edu)) return false
  if (s.ver === "verified" && l.verification === "pending") return false
  if (s.ver === "club" && l.verification !== "club") return false
  if (!startMatch(l, s.start, today)) return false
  return true
}

/* Organic ranking (PRD §7.4). Sponsored placement is never part of it. */
export function rankScore(l: EnrichedListing, s?: SearchState | null): number {
  let score = 0
  if (s && s.age !== "" && s.age != null) score += 2 // only eligible rows reach here
  score +=
    l.verification === "club" ? 1.6 : l.verification === "verified" ? 1.2 : 0
  score += l.completeness / 100
  score += (l.bayes - 4) * 1.5
  score += l.academy.responseRate / 100
  score += l.nextIntake && l.nextIntake.placesLeft > 0 ? 0.5 : 0
  return Math.round(score * 1000) / 1000
}

export function sortListings(
  list: EnrichedListing[],
  sort: string,
  s?: SearchState | null
): EnrichedListing[] {
  const out = list.slice()
  const tie = function (a: EnrichedListing, b: EnrichedListing) {
    return a.id < b.id ? -1 : 1
  }
  const cmps: Record<
    string,
    (a: EnrichedListing, b: EnrichedListing) => number
  > = {
    recommended: function (a, b) {
      return rankScore(b, s) - rankScore(a, s) || tie(a, b)
    },
    "price-asc": function (a, b) {
      return a.monthly - b.monthly || tie(a, b)
    },
    "price-desc": function (a, b) {
      return b.monthly - a.monthly || tie(a, b)
    },
    rating: function (a, b) {
      return (
        b.bayes - a.bayes ||
        b.reviewSummary.count - a.reviewSummary.count ||
        tie(a, b)
      )
    },
    start: function (a, b) {
      const x = a.nextIntake ? a.nextIntake.start : "9999",
        y = b.nextIntake ? b.nextIntake.start : "9999"
      return x < y ? -1 : x > y ? 1 : tie(a, b)
    },
  }
  const cmp =
    cmps[sort] ||
    function () {
      return 0
    }
  return out.sort(cmp)
}

/* Returns { organic, sponsored } — the sponsored listing only shows when it
   genuinely matches the filters, and it is never counted in the ranking. */
export function search(
  listings: EnrichedListing[],
  s: SearchState,
  today: string
): {
  organic: EnrichedListing[]
  sponsored: EnrichedListing | null
  total: number
} {
  const hits = listings.filter(function (l) {
    return l.status === "published" && matches(l, s, today)
  })
  const sponsored =
    hits.filter(function (l) {
      return l.sponsored
    })[0] || null
  const organic = sortListings(
    hits.filter(function (l) {
      return !l.sponsored
    }),
    s.sort,
    s
  )
  return { organic: organic, sponsored: sponsored, total: hits.length }
}

/* Facet counts lift their own dimension, so a selected filter stays
   reversible instead of showing zeroes (same rule as Travel flights). */
export function facetCounts(
  listings: EnrichedListing[],
  s: SearchState,
  key: keyof SearchState,
  values: string[],
  today: string
): Record<string, number> {
  const lifted = { ...s, [key]: DEFAULT_STATE[key] } as SearchState
  const base = listings.filter(function (l) {
    return l.status === "published" && matches(l, lifted, today)
  })
  const out: Record<string, number> = {}
  values.forEach(function (v) {
    const probe = { ...lifted, [key]: v } as SearchState
    out[v] = base.filter(function (l) {
      return matches(l, probe, today)
    }).length
  })
  return out
}

/* ---------------- Options ---------------- */
export function startOptions(
  listings: EnrichedListing[]
): { value: string; label: string }[] {
  const keys: Record<string, string> = {}
  listings.forEach(function (l) {
    l.intakes.forEach(function (i) {
      if (i.open) keys[D.monthKey(i.start)] = i.start
    })
  })
  const opts = [
    { value: "", label: "Any time" },
    { value: "soon", label: "Next 3 months" },
  ]
  Object.keys(keys)
    .sort()
    .forEach(function (k) {
      opts.push({ value: k, label: D.monthLabel(keys[k]) })
    })
  return opts
}
export function cityOptions(
  listings: EnrichedListing[],
  country?: string
): string[] {
  const seen: Record<string, boolean> = {}
  listings.forEach(function (l) {
    if (!country || l.academy.countryCode === country) seen[l.city] = true
  })
  return Object.keys(seen).sort()
}

/* ---------------- Chips & state ---------------- */
const CHIP_KEYS: string[] = [
  "loc",
  "age",
  "type",
  "start",
  "dur",
  "country",
  "city",
  "gender",
  "level",
  "price",
  "acc",
  "edu",
  "ver",
]

function labelOf(list: { id: string; label: string }[], id: string): string {
  const x = list.filter(function (i) {
    return i.id === id
  })[0]
  return x ? x.label : id
}
function chipLabel(key: string, s: SearchState): string {
  switch (key) {
    case "loc":
      return "“" + s.loc + "”"
    case "age":
      return "Age " + s.age
    case "type":
      return labelOf(CAT.TYPES, s.type)
    case "start":
      return s.start === "soon"
        ? "Starts in the next 3 months"
        : "Starts " + D.monthLabel(s.start + "-01")
    case "dur":
      return labelOf(CAT.DURATIONS, s.dur)
    case "country":
      return countryName(s.country)
    case "city":
      return s.city
    case "gender":
      return s.gender === "boys" ? "Open to boys" : "Open to girls"
    case "level":
      return labelOf(CAT.LEVELS, s.level)
    case "price":
      return fmtEuro(s.min) + "–" + fmtEuro(s.max) + " / month"
    case "acc":
      return s.acc === "none"
        ? "No accommodation"
        : s.acc === "included"
          ? "Accommodation included"
          : "Accommodation available"
    case "edu":
      return s.edu === "none"
        ? "No schooling"
        : s.edu === "included"
          ? "Schooling included"
          : "Schooling available"
    case "ver":
      return s.ver === "club" ? "Club Academy only" : "Golafly Verified only"
    default:
      return key
  }
}
export function activeChips(s: SearchState): { key: string; label: string }[] {
  return CHIP_KEYS.filter(function (k) {
    if (k === "price") return s.min !== PRICE.min || s.max !== PRICE.max
    const v = s[k as keyof SearchState]
    return v !== "" && v != null
  }).map(function (k) {
    return { key: k, label: chipLabel(k, s) }
  })
}
export function removeFilter(s: SearchState, key: string): SearchState {
  const n: SearchState = { ...s }
  if (key === "price") {
    n.min = PRICE.min
    n.max = PRICE.max
  } else Object.assign(n, { [key]: DEFAULT_STATE[key as keyof SearchState] })
  if (key === "country") n.city = ""
  return n
}
export function clearFilters(s: SearchState): SearchState {
  return { ...DEFAULT_STATE, sort: s.sort, view: s.view }
}

/* ---------------- URL ---------------- */
const ENUMS: Record<string, string[]> = {
  type: CAT.TYPES.map(function (t) {
    return t.id
  }),
  dur: CAT.DURATIONS.map(function (t) {
    return t.id
  }),
  country: CAT.COUNTRIES.map(function (t) {
    return t.code
  }),
  gender: ["boys", "girls"],
  level: CAT.LEVELS.map(function (t) {
    return t.id
  }),
  acc: ["included", "available", "none"],
  edu: ["included", "available", "none"],
  ver: ["verified", "club"],
  sort: SORTS.map(function (t) {
    return t.id
  }),
  view: ["list", "map"],
}
function clampPrice(v: string, fallback: number): number {
  let n = parseInt(v, 10)
  if (!isFinite(n)) return fallback
  n = Math.round(n / PRICE.step) * PRICE.step
  return Math.min(PRICE.max, Math.max(PRICE.min, n))
}
export function toQuery(s: SearchState): string {
  const p: string[] = []
  ;(Object.keys(DEFAULT_STATE) as (keyof SearchState)[]).forEach(function (k) {
    if (s[k] !== DEFAULT_STATE[k] && s[k] !== "" && s[k] != null)
      p.push(k + "=" + encodeURIComponent(s[k]))
  })
  return p.length ? "?" + p.join("&") : ""
}
export function parseQuery(search?: string | null): SearchState {
  const s: SearchState = { ...DEFAULT_STATE }
  String(search || "")
    .replace(/^\?/, "")
    .split("&")
    .forEach(function (pair) {
      if (!pair) return
      const i = pair.indexOf("=")
      const k = decodeURIComponent(i < 0 ? pair : pair.slice(0, i))
      const v =
        i < 0 ? "" : decodeURIComponent(pair.slice(i + 1).replace(/\+/g, " "))
      if (k === "loc") s.loc = v.slice(0, 60)
      else if (k === "age") {
        const n = parseInt(v, 10)
        if (n >= 8 && n <= 23) s.age = String(n)
      } else if (k === "start") {
        if (v === "soon" || /^\d{4}-(0[1-9]|1[0-2])$/.test(v)) s.start = v
      } else if (k === "city") {
        if (/^[\p{L} .'-]{2,40}$/u.test(v)) s.city = v
      } else if (k === "min") s.min = clampPrice(v, PRICE.min)
      else if (k === "max") s.max = clampPrice(v, PRICE.max)
      else if (ENUMS[k] && ENUMS[k].indexOf(v) > -1)
        Object.assign(s, { [k]: v })
    })
  if (s.min > s.max) {
    const t = s.min
    s.min = s.max
    s.max = t
  }
  return s
}

/* ---------------- Formatting ---------------- */
export function fmtEuro(n: number | null | undefined): string {
  if (n == null) return "—"
  return "€" + Math.round(n).toLocaleString("en-US")
}
export function feeLabel(l: Pick<Listing, "fees">): string {
  return fmtEuro(l.fees.amount) + " / " + CAT.FEE_UNITS[l.fees.per].label
}
export function durationLabel(
  l: Pick<Listing, "rolling" | "durationWeeks">
): string {
  if (l.rolling) return "Rolling monthly"
  const w = l.durationWeeks ?? 0
  if (w >= 36) return "Full season · " + w + " weeks"
  return w + " weeks"
}
export function ageLabel(l: Pick<Listing, "ageMin" | "ageMax">): string {
  return "Ages " + l.ageMin + "–" + l.ageMax
}
export function genderLabel(l: Pick<Listing, "gender">): string {
  return labelOf(CAT.GENDERS, l.gender)
}
export function typeLabel(l: Pick<Listing, "type">): string {
  return labelOf(CAT.TYPES, l.type)
}
export function levelLabel(l: Pick<Listing, "level">): string {
  return labelOf(CAT.LEVELS, l.level)
}
export function placesLabel(n: number): string {
  return n === 0 ? "Full" : n === 1 ? "1 place left" : n + " places left"
}
