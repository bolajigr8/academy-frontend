import { FEE_UNITS, GENDERS, LEVELS, TYPES } from "@/data/catalog"
import type { Verification } from "@/data/types"
import type { ApiSearchCard } from "@/features/academies/api"
import type { ApiListing } from "@/features/club/api"
import { apiFeeUnit, nextOpenIntake } from "@/features/club/view-models"
import { formatMoney } from "@/lib/money"
import { routes } from "@/routes"

import {
  ageLabel,
  crestFor,
  durationLabel,
  fmtEuro,
  genderLabel,
  levelLabel,
  placesLabel,
  typeLabel,
} from "./search"
import type { CrestData, EnrichedListing } from "./types"

/*
 * What a listing card shows (AmCard), in one shape. The demo data and the
 * backend each have an adapter, so the card renders either without
 * converting backend values into the prototype's fixed lists.
 */
export type CardView = {
  id: string
  /** null = no link (the editor preview) */
  href: string | null
  title: string
  image: string | null
  /** a backend URL: loaded as-is */
  remoteImage: boolean
  alt: string
  verification: Verification | "rejected"
  crest: CrestData
  city: string
  country: string
  academyName: string
  reviews: { count: number; avg: number }
  /** "Residential academy · Elite · Boys" */
  facts: string[]
  /** "Ages 12–16", "12 weeks", "Accommodation", "Schooling" */
  tags: string[]
  price: string | null
  unit: string | null
  /** "≈ €833/mo" when the fee is not monthly (demo data only) */
  monthly: string | null
  next: { start: string; places: string | null } | null
}

/** The prototype card, unchanged */
export function cardFromListing(l: EnrichedListing): CardView {
  return {
    id: l.id,
    href: routes.academy(l.id),
    title: l.title,
    image: l.image,
    remoteImage: false,
    alt: l.alt,
    verification: l.verification,
    crest: l.crest,
    city: l.city,
    country: l.country,
    academyName: l.academy.name,
    reviews: { count: l.reviewSummary.count, avg: l.reviewSummary.avg },
    facts: [typeLabel(l), levelLabel(l), genderLabel(l)],
    tags: [
      ageLabel(l),
      durationLabel(l),
      ...(l.accommodation === "included" ? ["Accommodation"] : []),
      ...(l.education === "included" ? ["Schooling"] : []),
    ],
    price: fmtEuro(l.fees.amount),
    unit: FEE_UNITS[l.fees.per].label,
    monthly: l.fees.per !== "month" ? fmtEuro(l.monthly) : null,
    next: l.nextIntake
      ? {
          start: l.nextIntake.start,
          places: placesLabel(l.nextIntake.placesLeft),
        }
      : null,
  }
}

/** A backend value as a label: the prototype's label when the id matches, else written out */
export function valueLabel(
  list: readonly { id: string; label: string }[],
  value: string
): string {
  const known = list.find((x) => x.id === value)
  if (known) return known.label
  const words = value.replace(/_/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** "2 weeks", "1 season": the backend's duration as written */
export function apiDurationLabel(
  value: number | null,
  unit: string | null
): string | null {
  if (value === null || !unit) return null
  return `${value} ${unit}${value === 1 ? "" : "s"}`
}

/** A backend listing as a card (portal preview now; search results in batch 2) */
export function cardFromApi(
  l: ApiListing,
  today: string,
  href: string | null
): CardView {
  const next = nextOpenIntake(l.intakes, today)
  const s = l.academy.verification_status
  return {
    id: String(l.id),
    href,
    title: l.title,
    image: l.primary_image_url ?? l.images[0]?.url ?? null,
    remoteImage: true,
    alt: "",
    verification: s === "club_academy" ? "club" : s,
    crest: crestFor({ id: String(l.academy.id), name: l.academy.name }),
    city: l.academy.city,
    country: l.academy.country_name,
    academyName: l.academy.name,
    // reviews arrive in batch 6: the card shows "New · no reviews yet"
    reviews: { count: 0, avg: 0 },
    facts: [
      l.academy_type ? valueLabel(TYPES, l.academy_type) : null,
      l.playing_level ? valueLabel(LEVELS, l.playing_level) : null,
      l.gender ? valueLabel(GENDERS, l.gender) : null,
    ].filter((x): x is string => Boolean(x)),
    tags: [
      l.age_min !== null && l.age_max !== null
        ? `Ages ${l.age_min}–${l.age_max}`
        : null,
      apiDurationLabel(l.duration_value, l.duration_unit),
      l.has_accommodation ? "Accommodation" : null,
      l.has_education ? "Schooling" : null,
    ].filter((x): x is string => Boolean(x)),
    price: l.price ? formatMoney(l.price) : null,
    unit: apiFeeUnit(l.payment_frequency),
    monthly: null,
    next: next
      ? {
          start: next.start_date,
          places:
            next.places_left === null ? null : placesLabel(next.places_left),
        }
      : null,
  }
}

/**
 * A search card (week 1 part 2, section 14) as a card. The search shape has
 * no type, level or gender, so the facts line shows the club when there is
 * one and nothing else: nothing the API does not send is invented.
 */
export function cardFromSearch(c: ApiSearchCard): CardView {
  const s = c.academy.verification_status
  const avg = Number(c.rating_avg)
  return {
    id: String(c.id),
    href: routes.academy(c.slug),
    title: c.title,
    image: c.primary_image_url,
    remoteImage: true,
    alt: "",
    verification:
      s === "club_academy"
        ? "club"
        : s === "verified" || s === "pending" || s === "rejected"
          ? s
          : "verified",
    crest: crestFor({ id: c.academy.slug, name: c.academy.name }),
    city: c.academy.city,
    country: c.academy.country_name,
    academyName: c.academy.name,
    // "0.00" and 0 until reviews exist (week 3): the card shows "New · no reviews yet"
    reviews: {
      count: c.reviews_count,
      avg: Number.isFinite(avg) ? avg : 0,
    },
    facts: c.academy.club_name ? [c.academy.club_name] : [],
    tags: [
      c.age_min !== null && c.age_max !== null
        ? `Ages ${c.age_min}–${c.age_max}`
        : null,
      apiDurationLabel(c.duration.value, c.duration.unit),
      c.has_accommodation ? "Accommodation" : null,
      c.has_education ? "Schooling" : null,
    ].filter((x): x is string => Boolean(x)),
    price: c.price ? formatMoney(c.price) : null,
    unit: apiFeeUnit(c.payment_frequency),
    monthly: null,
    next: c.next_start_date
      ? {
          start: c.next_start_date,
          places: c.places_left === null ? null : placesLabel(c.places_left),
        }
      : null,
  }
}
