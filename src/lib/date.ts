/*
 * Local-date helpers ported from js/amk-catalog.js (DATES, lines 17-75).
 * Dates are 'YYYY-MM-DD' strings, parsed at local noon so DST never shifts a day.
 * Nothing here reads the clock except today(); callers that need a stable
 * "today" (the demo seed) pass it in.
 */
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

export const MON = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

const pad = (n: number) => (n < 10 ? "0" : "") + n

/** 'YYYY-MM-DD' to a Date at local noon, or null when it is not a real date. */
export function parseDate(value: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""))
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0)
  return d.getMonth() === +m[2] - 1 ? d : null
}

export function toISODate(d: Date): string {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
}

export function todayISO(): string {
  return toISODate(new Date())
}

function mustParse(value: string): Date {
  const d = parseDate(value)
  if (!d) throw new RangeError(`Invalid date: ${value}`)
  return d
}

export function addDays(iso: string, n: number): string {
  const d = mustParse(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function addYears(iso: string, n: number): string {
  const d = mustParse(iso)
  d.setFullYear(d.getFullYear() + n)
  return toISODate(d)
}

/** First day of the month k months after the month of `today`. */
export function monthStart(today: string, k: number): string {
  const d = mustParse(today)
  return toISODate(new Date(d.getFullYear(), d.getMonth() + k, 1, 12))
}

/** Programs start on a Monday: first Monday of the month plus n weeks. */
export function firstMonday(iso: string, weeks: number = 0): string {
  const d = mustParse(iso)
  const first = new Date(d.getFullYear(), d.getMonth(), 1, 12)
  const shift = (8 - first.getDay()) % 7
  first.setDate(1 + shift + 7 * weeks)
  return toISODate(first)
}

export function diffDays(a: string, b: string): number {
  return Math.round(
    (mustParse(b).getTime() - mustParse(a).getTime()) / 86400000
  )
}

export function ageOn(dob: string, on: string): number | null {
  const b = parseDate(dob)
  const t = parseDate(on)
  if (!b || !t) return null
  let age = t.getFullYear() - b.getFullYear()
  if (
    t.getMonth() < b.getMonth() ||
    (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())
  ) {
    age -= 1
  }
  return age
}

/** 'Sep 25, 2026' */
export function formatDate(iso: string): string {
  const d = parseDate(iso)
  if (!d) return "—"
  return MON[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear()
}

/** 'Sep 25' */
export function formatDateShort(iso: string): string {
  const d = parseDate(iso)
  if (!d) return "—"
  return MON[d.getMonth()] + " " + d.getDate()
}

/** 'September 2026' */
export function monthLabel(iso: string): string {
  const d = parseDate(iso)
  if (!d) return "—"
  return MONTHS[d.getMonth()] + " " + d.getFullYear()
}

/** '2026-09' */
export function monthKey(iso: string): string {
  return String(iso).slice(0, 7)
}
