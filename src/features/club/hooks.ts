"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { DATES, LEVELS } from "@/data/catalog"
import { crestFor } from "@/features/academies/search"
import { useSession } from "@/features/auth/session"
import { CLUB } from "@/data/club-copy"
import type { EnrichedListing } from "@/features/academies/types"
import {
  applicantOf,
  type ApplicantView,
} from "@/features/applications/applicant"
import { actionsFor, commission, kpis } from "@/features/applications/flow"
import { buildInbox } from "@/features/applications/inbox"
import { flatPayments, type PaymentRow } from "@/features/applications/payments"
import type {
  AppDoc,
  AppStatus,
  Application,
} from "@/features/applications/types"
import { todayISO } from "@/lib/date"
import { isLive } from "@/lib/data-source"
import type { View } from "@/stores/app-store"
import { useAppView } from "@/stores/hooks"

import {
  getAcademy,
  getVerification,
  getListing,
  getOptions,
  getOrganization,
  listAcademies,
  listAllListings,
  type ApiAcademy,
  type ApiListing,
  type ApiOptions,
  type ApiOrganization,
} from "./api"
import { clubKeys } from "./query-keys"
import {
  profileFromApi,
  profileFromDemo,
  rowFromApi,
  rowFromDemo,
  verificationOf,
  type ClubListingRow,
  type ClubProfileView,
  type ProfileVerification,
} from "./view-models"

/*
 * Club (academy) view models. Components read these hooks, never the store or
 * the API. The profile and listings hooks read the backend when the club
 * portal is live (lib/data-source.ts) and the demo data otherwise; both paths
 * return the same view shape, so the screens do not change between modes.
 */

/** The query-like shape QueryState renders (loading, error, data, updating) */
export type Loadable<T> = {
  data: T | undefined
  error: unknown
  isPending: boolean
  isError: boolean
  isFetching: boolean
  refetch: () => unknown
}

function loaded<T>(data: T): Loadable<T> {
  return {
    data,
    error: null,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: () => undefined,
  }
}

type QueryParts = Pick<
  Loadable<unknown>,
  "error" | "isPending" | "isError" | "isFetching" | "refetch"
>

function combined<T>(parts: QueryParts[], data: T | undefined): Loadable<T> {
  const failed = parts.find((p) => p.isError)
  return {
    data,
    error: failed?.error ?? null,
    isPending: !failed && parts.some((p) => p.isPending),
    isError: Boolean(failed),
    isFetching: parts.some((p) => p.isFetching),
    refetch: () => parts.forEach((p) => p.isError && p.refetch()),
  }
}

/** Which pages a listing row may link to (the mode is fixed for the whole run) */
const LINKS = {
  editor: isLive("listingEditor"),
  publicPage: isLive("listingPage"),
}

/**
 * Portal endpoints need an academy token: never call them signed out (401) or
 * as an applicant (403). The shell's academy block runs on family pages too.
 */
function useSignedIn(): boolean {
  return useSession().user?.role === "academy"
}

/** GET /academy/portal/organization */
function useOrganizationQuery() {
  const signedIn = useSignedIn()
  return useQuery({
    queryKey: clubKeys.organization(),
    queryFn: getOrganization,
    enabled: signedIn,
  })
}

/** GET /academy/portal/academies */
/** The organization's academies (week 1 part 1, section 4) */
export function useAcademiesQuery() {
  const signedIn = useSignedIn()
  return useQuery({
    queryKey: clubKeys.academies(),
    queryFn: listAcademies,
    enabled: signedIn,
  })
}

/** GET /academy/portal/listings (every page) */
function useListingsQuery() {
  const signedIn = useSignedIn()
  return useQuery({
    queryKey: clubKeys.listings(),
    queryFn: listAllListings,
    enabled: signedIn,
  })
}

/** Academy profile (/club/profile): backend */
function useClubProfileLive(): Loadable<ClubProfileView> {
  const org = useOrganizationQuery()
  const academies = useAcademiesQuery()
  const listings = useListingsQuery()
  const academyId = academies.data?.[0]?.id ?? null
  const signedIn = useSignedIn()
  // the verification card (contract section 11); its failure never blocks the page
  const verification = useQuery({
    queryKey: clubKeys.verification(academyId ?? 0),
    queryFn: () => getVerification(academyId ?? 0),
    enabled: signedIn && academyId !== null,
  })
  const data = useMemo(
    () =>
      org.data && academies.data && listings.data
        ? profileFromApi(
            org.data,
            academies.data[0] ?? null,
            listings.data,
            todayISO(),
            LINKS,
            verification.data ?? null
          )
        : undefined,
    [org.data, academies.data, listings.data, verification.data]
  )
  return combined([org, academies, listings], data)
}

/** Academy profile (/club/profile): demo data */
function useClubProfileDemo(): Loadable<ClubProfileView> {
  const view = useAppView()
  return useMemo(() => {
    const academy = view.academyById[view.host.academyIds[0]]
    return loaded(
      profileFromDemo(
        academy,
        view.orgById[academy.orgId],
        view.hostListings,
        view.hostApps,
        view.today
      )
    )
  }, [view])
}

/** Listings (/club/listings): backend */
function useClubListingsLive(): Loadable<ClubListingRow[]> {
  const listings = useListingsQuery()
  const data = useMemo(
    () => listings.data?.map((l) => rowFromApi(l, todayISO(), LINKS)),
    [listings.data]
  )
  return combined([listings], data)
}

/** Listings (/club/listings): demo data */
function useClubListingsDemo(): Loadable<ClubListingRow[]> {
  const view = useAppView()
  return useMemo(
    () => loaded(view.hostListings.map((l) => rowFromDemo(l, view.hostApps))),
    [view]
  )
}

/*
 * The data mode is fixed for the whole run, so each hook is chosen once here.
 * Mock mode never creates a react-query entry; api mode never reads demo data.
 */
const LIVE_PORTAL = isLive("clubPortal")

export const useClubProfile = LIVE_PORTAL
  ? useClubProfileLive
  : useClubProfileDemo

export const useClubListings = LIVE_PORTAL
  ? useClubListingsLive
  : useClubListingsDemo

/* ---------------- Phase 4: dashboard, applications, applicant, messages, payments ---------------- */

/** One application with the person and program it is about */
export type ApplicationEntry = {
  app: Application
  who: ApplicantView
  listing: EnrichedListing
  /** the applicant's age today */
  age: number | null
}

function entryOf(view: View, app: Application): ApplicationEntry {
  const who = applicantOf(app, view)
  return {
    app,
    who,
    listing: view.listingsById[app.listingId],
    age: DATES.ageOn(who.dob, view.today),
  }
}

/** The label under a message written by the signed-in academy user ("Marta Ruiz · Valencia International") */
function hostAuthor(view: View): string {
  return `${view.host.firstName} ${view.host.lastName} · ${CLUB.signature}`
}

const TODO_ORDER: AppStatus[] = ["submitted", "under_review", "accepted"]

export function useClubDashboard() {
  const view = useAppView()
  return useMemo(() => {
    const academy = view.academyById[view.host.academyIds[0]]
    const org = view.orgById[academy.orgId]
    const listings = view.hostListings
    const todo = view.hostApps
      .filter((a) => TODO_ORDER.includes(a.status))
      .sort(
        (a, b) => TODO_ORDER.indexOf(a.status) - TODO_ORDER.indexOf(b.status)
      )
      .map((a) => entryOf(view, a))
    const capacity = listings
      .filter((l) => l.status === "published")
      .flatMap((l) =>
        l.intakes
          .filter((i) => i.open)
          .slice(0, 1)
          .map((intake) => ({ listing: l, intake }))
      )
    const feed = view.hostNotifications.slice(0, 6).map((n) => {
      const a = view.appsById[n.appId]
      return {
        notification: n,
        app: a,
        who: applicantOf(a, view),
        listingTitle: view.listingsById[a.listingId].title,
      }
    })
    return {
      academy,
      org,
      listingCount: listings.length,
      kpis: kpis(view.hostApps, listings),
      todo,
      capacity,
      feed,
    }
  }, [view])
}

export function useClubApplications() {
  const view = useAppView()
  return useMemo(
    () => ({
      entries: view.hostApps.map((a) => entryOf(view, a)),
      listings: view.hostListings,
      publishedCount: view.hostListings.filter((l) => l.status === "published")
        .length,
    }),
    [view]
  )
}

/** One application for the academy to review. `found` is false when it belongs to another academy. */
export function useApplicant(id: string) {
  const view = useAppView()
  return useMemo(() => {
    const app = view.appsById[id]
    const mine = app && view.hostApps.some((a) => a.id === app.id)
    if (!app || !mine) return { found: false as const }
    const entry = entryOf(view, app)
    const l = entry.listing
    const intake = l.intakes.find((i) => i.id === app.intakeId) ?? l.intakes[0]
    const ageAtStart = DATES.ageOn(entry.who.dob, intake.start)
    return {
      found: true as const,
      ...entry,
      today: view.today,
      intake,
      ageAtStart,
      eligible:
        ageAtStart !== null && ageAtStart >= l.ageMin && ageAtStart <= l.ageMax,
      actions: actionsFor(app.status, "academy").map((t) => t.to),
      levelLabel: LEVELS.find((x) => x.id === entry.who.level)?.label,
      documentName: (d: AppDoc) =>
        view.documents.find((x) => x.id === d.docId)?.name ?? d.name ?? "—",
      optionalLabels: l.optional
        .filter((o) => (app.optional ?? []).includes(o.id))
        .map((o) => o.label),
      messages: view.threads[app.id] ?? [],
      author: hostAuthor(view),
    }
  }, [view, id])
}

export function useClubInbox() {
  const view = useAppView()
  return useMemo(
    () => ({
      rows: buildInbox(view, view.hostApps, "academy"),
      author: hostAuthor(view),
    }),
    [view]
  )
}

export function useClubPayments() {
  const view = useAppView()
  return useMemo(() => {
    const items = flatPayments(view.hostApps, view)
    const sum = (f: (i: PaymentRow) => boolean) =>
      items.filter(f).reduce((s, i) => s + i.amount, 0)
    const collected = sum((i) => i.status === "paid")
    const outstanding = sum((i) => i.status !== "paid")
    const fee = commission(collected)
    return {
      today: view.today,
      items,
      collected,
      outstanding,
      fee,
      net: collected - fee,
      nextPayout: DATES.firstMonday(DATES.monthStart(view.today, 1), 0),
    }
  }, [view])
}

/* ---------------- Phase 3b: listing editor ---------------- */

/** Data the listing editor shows around the form (academy, today, the current status). */
export function useListingEditor(listingId: string | null) {
  const view = useAppView()
  return useMemo(
    () => ({
      view,
      today: view.today,
      /** the stored status wins: it changes when a listing is submitted or approved */
      storedStatus: listingId
        ? (view.listingsById[listingId]?.status ?? null)
        : null,
      academyOf: (academyId: string) => {
        const academy = view.academyById[academyId]
        return { academy, org: view.orgById[academy.orgId] }
      },
    }),
    [view, listingId]
  )
}

/* ---------------- shell ---------------- */

/** The academy shown in the club sidebar: name, crest or logo, verification */
export type ClubShellAcademy = {
  name: string
  crest: ReturnType<typeof crestFor>
  logoUrl: string | null
  verification: ProfileVerification
}

function useClubShellAcademyLive(): ClubShellAcademy | null {
  const academies = useAcademiesQuery()
  return useMemo(() => {
    const a = academies.data?.[0]
    if (!a) return null
    return {
      name: a.name,
      crest: crestFor({ id: String(a.id), name: a.name }),
      logoUrl: a.logo_url,
      verification: verificationOf(a.verification_status),
    }
  }, [academies.data])
}

function useClubShellAcademyDemo(): ClubShellAcademy | null {
  const view = useAppView()
  return useMemo(() => {
    const a = view.academyById[view.host.academyIds[0]]
    return a
      ? {
          name: a.name,
          crest: crestFor(a),
          logoUrl: null,
          verification: { kind: "badge", value: "verified" },
        }
      : null
  }, [view])
}

export const useClubShellAcademy = LIVE_PORTAL
  ? useClubShellAcademyLive
  : useClubShellAcademyDemo

/* ---------------- listing editor (api mode) ---------------- */

export type LiveEditorData = {
  options: ApiOptions
  academies: ApiAcademy[]
  orgName: string
  /** null for a new listing */
  listing: ApiListing | null
}

/**
 * Everything the api-mode editor needs before it can open: GET /options,
 * /academies, /organization and, when editing, /listings/{id}.
 */
export function useLiveEditorData(id: number | null): Loadable<LiveEditorData> {
  const signedIn = useSignedIn()
  const options = useQuery({
    queryKey: clubKeys.options(),
    queryFn: getOptions,
    enabled: signedIn,
    staleTime: Infinity,
  })
  const org = useOrganizationQuery()
  const academies = useAcademiesQuery()
  const listing = useQuery({
    queryKey: clubKeys.listing(id ?? 0),
    queryFn: () => getListing(id ?? 0),
    enabled: signedIn && id !== null,
    // the editor starts from what the backend has now
    staleTime: 0,
  })
  const parts =
    id === null ? [options, org, academies] : [options, org, academies, listing]
  const data = useMemo(
    () =>
      options.data &&
      org.data &&
      academies.data &&
      (id === null || listing.data)
        ? {
            options: options.data,
            academies: academies.data,
            orgName: org.data.name,
            listing: id === null ? null : (listing.data ?? null),
          }
        : undefined,
    [options.data, org.data, academies.data, listing.data, id]
  )
  return combined(parts, data)
}

/* ---------------- organization + academy forms (api mode) ---------------- */

export type ProfileFormData = {
  org: ApiOrganization
  academy: ApiAcademy | null
}

/** GET /organization + /academies for the edit page (countries come from useCountries) */
export function useProfileFormData(): Loadable<ProfileFormData> {
  const org = useOrganizationQuery()
  const academies = useAcademiesQuery()
  // the form edits a fresh copy of the academy: GET /academy/portal/academies/{id}
  const firstId = academies.data?.[0]?.id ?? null
  const academy = useQuery({
    queryKey: clubKeys.academy(firstId ?? 0),
    queryFn: () => getAcademy(firstId ?? 0),
    enabled: firstId !== null,
    staleTime: 0,
  })
  const data = useMemo(
    () =>
      org.data && academies.data && (firstId === null || academy.data)
        ? {
            org: org.data,
            academy: firstId === null ? null : (academy.data ?? null),
          }
        : undefined,
    [org.data, academies.data, firstId, academy.data]
  )
  // with no academy yet there is nothing to fetch (a disabled query stays "pending")
  return combined(
    firstId === null ? [org, academies] : [org, academies, academy],
    data
  )
}
