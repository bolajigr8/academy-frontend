import { env } from "./env"

/*
 * Where each area of the app gets its data.
 *
 * The backend is the source of truth. An area is "live" when the app runs in
 * api mode AND that area's endpoints have been delivered (READY below). A live
 * area shows only backend data: no demo records, no hard-coded values. An area
 * whose endpoints are not delivered yet keeps the prototype's demo data until
 * its batch lands; then flip it to true here.
 */
export type DataArea =
  /** register, login, the session (batch 1) */
  | "auth"
  /** academy portal: organization, academy profile, listings list (batch 1) */
  | "clubPortal"
  /** academy portal: create / edit listing wizard and intakes (batch 1, delivery W1b) */
  | "listingEditor"
  /** home, search, listing detail, saved (batch 2) */
  | "discovery"
  /** the public listing page and Apply start (week 1 part 2 section 15; week 2 part 1 section 4) */
  | "listingPage"
  /** player profiles (week 2 part 1) */
  | "players"
  /** academy inbox, applicant page, decisions, document review (week 2 part 2) */
  | "academyInbox"
  /** Apply to Join, applications, family dashboard (week 2 part 1) */
  | "applications"
  /** messages and notifications (batch 4) */
  | "messages"
  /** enrollment and payments (batch 5) */
  | "payments"

const READY: Record<DataArea, boolean> = {
  auth: true,
  clubPortal: true,
  listingEditor: true,
  discovery: true,
  players: true,
  listingPage: true,
  academyInbox: true,
  applications: true,
  messages: true,
  payments: false,
}

/** "api" only when it was not switched off AND an API URL is configured */
export const DATA_MODE: "api" | "mock" =
  env.NEXT_PUBLIC_DATA_MODE === "mock" || !env.NEXT_PUBLIC_API_URL
    ? "mock"
    : "api"

export const API_MODE = DATA_MODE === "api"

/** True when this area reads and writes the backend (and shows no demo data). */
export function isLive(area: DataArea): boolean {
  return API_MODE && READY[area]
}

/**
 * True when this area may show demo data: always in mock mode; in api mode
 * only for areas whose endpoints are not delivered yet.
 */
export function usesDemo(area: DataArea): boolean {
  return !isLive(area)
}

/**
 * Shared chrome (sidebar badges and counts, the notifications bell) sits on
 * every page, including live ones. In api mode it never shows demo numbers;
 * each area's badge is wired to its own endpoint in that area's batch.
 */
export const DEMO_CHROME = !API_MODE

/**
 * Pages that still run on sample data in api mode (their endpoints are not
 * wired yet). Each shows a "Sample data" notice so nobody mistakes it for real
 * data. Remove an entry when its delivery lands.
 */
const SAMPLE_PAGES: { path: string; exact?: boolean }[] = [
  { path: "/club/dashboard" }, // week 3 dashboards
  { path: "/club/payments" }, // week 3
  { path: "/family/payments" }, // week 3
]

export function pageOnSampleData(pathname: string): boolean {
  if (!API_MODE) return false
  return SAMPLE_PAGES.some((p) =>
    p.exact
      ? pathname === p.path
      : pathname === p.path || pathname.startsWith(p.path + "/")
  )
}
