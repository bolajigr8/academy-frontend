import { DATES, FEE_UNITS, TYPES, VERIFY_CHECKS } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import type { Academy, Organization, Verification } from "@/data/types"
import {
  completeness as mockCompleteness,
  countryName,
  crestFor,
  feeLabel,
  placesLabel,
  typeLabel,
} from "@/features/academies/search"
import type { CrestData, EnrichedListing } from "@/features/academies/types"
import type { Application } from "@/features/applications/types"
import { formatMoney } from "@/lib/money"
import { routes } from "@/routes"

import type {
  ApiAcademy,
  ApiIntake,
  ApiListing,
  ApiListingStatus,
  ApiOrganization,
  ApiVerification,
  ApiVerificationStatus,
} from "./api"

/*
 * What the club profile and listings screens show, in one shape that both the
 * backend (api mode) and the prototype demo data (mock mode) produce. A field
 * the backend does not have is null in api mode and its UI is not rendered:
 * live screens never show demo or made-up values.
 */

/** The prototype's status vocabulary plus the backend's two extra states */
export type ListingStatusKey =
  "draft" | "in_review" | "published" | "rejected" | "paused" | "archived"

export type ClubListingRow = {
  id: string
  title: string
  status: ListingStatusKey
  image: string | null
  /** true when `image` is a backend URL (loaded as-is, no optimizer) */
  remoteImage: boolean
  /** "Residential academy · Ages 12–16 · €2,500 / term", parts that exist only */
  meta: string[]
  next: { start: string; places: string | null } | null
  /** null = no data source yet (views: batch 6, applications: batch 4) */
  views: number | null
  applications: number | null
  completeness: number
  /** null = the editor is not connected yet */
  editHref: string | null
  /** null = the public page is not connected yet */
  viewHref: string | null
  /** fee text for the profile's short list */
  fee: string | null
  /** api mode: Golafly's reason when the listing was rejected or unpublished */
  rejectionReason: string | null
}

export type ProfileVerification =
  { kind: "badge"; value: Verification } | { kind: "rejected" }

export type ClubProfileView = {
  academy: {
    name: string
    crest: CrestData
    logoUrl: string | null
    locationLine: string
    description: string
    facilities: string[]
    verification: ProfileVerification
    specs: {
      address: string | null
      languages: string | null
      responseRate: string | null
      usuallyReplies: string | null
    }
    /** verification_note from the backend (for example a rejection reason) */
    verificationNote: string | null
  } | null
  orgName: string
  /** demo only: the prototype's team list and dated checks */
  demo: {
    team: boolean
    checks: { id: string; label: string; date: string }[]
    affiliation: boolean
    edit: boolean
  } | null
  /** "Golafly Verified since 2019"-style year, or null */
  verifiedSince: number | null
  /** api mode: GET /academy/portal/academies/{id}/verification (contract section 11) */
  liveVerification: {
    academyId: number
    status: ApiVerificationStatus
    note: string | null
    reviewedAt: string | null
  } | null
  listings: ClubListingRow[]
}

/* ---------------- backend -> view ---------------- */

const STATUS_FROM_API: Record<ApiListingStatus, ListingStatusKey> = {
  draft: "draft",
  pending_review: "in_review",
  published: "published",
  rejected: "rejected",
  paused: "paused",
  archived: "archived",
}

export function verificationOf(s: ApiVerificationStatus): ProfileVerification {
  if (s === "rejected") return { kind: "rejected" }
  return { kind: "badge", value: s === "club_academy" ? "club" : s }
}

/** "residential" -> the prototype's "Residential academy"; unknown values are humanized */
export function optionLabel(value: string): string {
  const known = TYPES.find((t) => t.id === value)
  if (known) return known.label
  const words = value.replace(/_/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const FREQUENCY_UNIT: Record<string, string> = {
  per_season: FEE_UNITS.season.label,
  per_term: FEE_UNITS.term.label,
  monthly: FEE_UNITS.month.label,
  one_time: FEE_UNITS.program.label,
  yearly: LIVE.perYear,
}

/** "season", "program" ...: the prototype's fee unit for a payment_frequency */
export function apiFeeUnit(frequency: string | null): string | null {
  if (!frequency) return null
  return FREQUENCY_UNIT[frequency] ?? optionLabel(frequency)
}

/** "€900 / program", like the prototype's feeLabel; null without a price */
export function apiFeeLabel(l: ApiListing): string | null {
  if (!l.price) return null
  const unit = apiFeeUnit(l.payment_frequency)
  return unit ? `${formatMoney(l.price)} / ${unit}` : formatMoney(l.price)
}

/** The first intake still taking applications (open, deadline not passed, not started) */
export function nextOpenIntake(
  intakes: ApiIntake[],
  today: string
): ApiIntake | null {
  return (
    [...intakes]
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .find(
        (i) =>
          i.status === "open" &&
          i.start_date >= today &&
          (i.application_deadline === null || i.application_deadline >= today)
      ) ?? null
  )
}

/**
 * The prototype's completeness score (search.ts), on the backend's fields:
 * 80% for the filled content fields, 20% for photos (5 is complete).
 */
export function apiCompleteness(l: ApiListing): number {
  const fields = [
    l.description,
    l.methodology,
    l.competition,
    l.included,
    l.requirements,
    l.required_documents,
    l.images,
  ]
  const have = fields.filter((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  ).length
  const photos = Math.min(1, l.images.length / 5)
  return Math.round(((have / fields.length) * 0.8 + photos * 0.2) * 100)
}

export function rowFromApi(
  l: ApiListing,
  today: string,
  links: { editor: boolean; publicPage: boolean }
): ClubListingRow {
  const next = nextOpenIntake(l.intakes, today)
  const fee = apiFeeLabel(l)
  const meta = [
    l.academy_type ? optionLabel(l.academy_type) : null,
    l.age_min !== null && l.age_max !== null
      ? `Ages ${l.age_min}–${l.age_max}`
      : null,
    fee,
  ].filter((x): x is string => Boolean(x))
  return {
    id: String(l.id),
    title: l.title,
    status: STATUS_FROM_API[l.status],
    image: l.primary_image_url ?? l.images[0]?.url ?? null,
    remoteImage: true,
    meta,
    next: next
      ? {
          start: next.start_date,
          places:
            next.places_left === null ? null : placesLabel(next.places_left),
        }
      : null,
    views: null,
    applications: l.applications_count ?? null,
    completeness: apiCompleteness(l),
    editHref: links.editor ? routes.club.editListing(String(l.id)) : null,
    // only a published listing of a verified academy is public (week 1 part 2)
    viewHref:
      links.publicPage && l.status === "published"
        ? routes.academy(l.slug)
        : null,
    fee,
    rejectionReason: l.status === "rejected" ? l.rejection_reason : null,
  }
}

export function profileFromApi(
  org: ApiOrganization,
  academy: ApiAcademy | null,
  listings: ApiListing[],
  today: string,
  links: { editor: boolean; publicPage: boolean },
  verification: ApiVerification | null = null
): ClubProfileView {
  const v = verification ?? null
  return {
    liveVerification: academy
      ? {
          academyId: academy.id,
          status: v?.verification_status ?? academy.verification_status,
          note: v ? v.verification_note : academy.verification_note,
          reviewedAt: v?.verification_reviewed_at ?? null,
        }
      : null,
    orgName: org.name,
    academy: academy
      ? {
          name: academy.name,
          crest: crestFor({ id: String(academy.id), name: academy.name }),
          logoUrl: academy.logo_url,
          locationLine: `${academy.city}, ${academy.country_name}`,
          description: academy.description ?? "",
          facilities: academy.facilities,
          verification: verificationOf(academy.verification_status),
          specs: {
            address: academy.address,
            languages: null,
            responseRate: null,
            usuallyReplies: null,
          },
          verificationNote: academy.verification_note,
        }
      : null,
    demo: null,
    verifiedSince:
      academy?.verified_at &&
      (academy.verification_status === "verified" ||
        academy.verification_status === "club_academy")
        ? Number(academy.verified_at.slice(0, 4))
        : null,
    listings: listings
      .filter((l) => !academy || l.academy_id === academy.id)
      .map((l) => rowFromApi(l, today, links)),
  }
}

/* ---------------- demo data -> view (mock mode, unchanged output) ---------------- */

export function rowFromDemo(
  l: EnrichedListing,
  applications: Application[]
): ClubListingRow {
  return {
    id: l.id,
    title: l.title,
    status: l.status,
    image: l.image,
    remoteImage: false,
    meta: [typeLabel(l), `Ages ${l.ageMin}–${l.ageMax}`, feeLabel(l)],
    next: l.nextIntake
      ? {
          start: l.nextIntake.start,
          places: placesLabel(l.nextIntake.placesLeft),
        }
      : null,
    views: l.views30d,
    applications: applications.filter((a) => a.listingId === l.id).length,
    completeness: l.completeness ?? mockCompleteness(l),
    editHref: routes.club.editListing(l.id),
    viewHref: routes.academy(l.id),
    fee: feeLabel(l),
    rejectionReason: null,
  }
}

export function profileFromDemo(
  academy: Academy,
  org: Organization,
  listings: EnrichedListing[],
  applications: Application[],
  today: string
): ClubProfileView {
  return {
    orgName: org.name,
    academy: {
      name: academy.name,
      crest: crestFor(academy),
      logoUrl: null,
      locationLine: `${academy.city}, ${countryName(academy.countryCode)} · founded ${academy.founded}`,
      description: academy.description,
      facilities: academy.facilities,
      verification: { kind: "badge", value: org.verification },
      specs: {
        address: academy.address,
        languages: academy.languages.join(", "),
        responseRate: `${academy.responseRate}%`,
        usuallyReplies: `Within ${academy.responseHours} hours`,
      },
      verificationNote: null,
    },
    demo: {
      team: true,
      checks: VERIFY_CHECKS.filter((c) => !c.clubOnly).map((c, i) => ({
        id: c.id,
        label: c.label,
        date: DATES.fmt(DATES.addDays(today, -(120 + i * 9))),
      })),
      affiliation: true,
      edit: true,
    },
    verifiedSince: org.since,
    liveVerification: null,
    listings: listings.map((l) => rowFromDemo(l, applications)),
  }
}
