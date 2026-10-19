import { academyPhoto, type PhotoFile } from "@/data/assets"
import { BASE_QUESTIONS, DATES, POLICIES, SCHEDULES } from "@/data/catalog"
import type { Intake } from "@/data/types"
import { enrich } from "@/features/academies/search"
import type { EnrichedListing } from "@/features/academies/types"
import type { StoredListing, View } from "@/stores/app-store"

/*
 * The create / edit listing wizard (host/listing-edit.html + js/amk-host.jsx:
 * WIZ_STEPS, PHOTO_LIBRARY, newListing, makeIntake, validateWizard, preview,
 * checklist). Ported as-is; no JSX.
 */

/** A listing being edited. `id` is null until the first save. */
export type WizardListing = Omit<StoredListing, "id"> & { id: string | null }

export const WIZ_STEPS = [
  "About the academy",
  "Add images",
  "Program details",
  "Age & eligibility",
  "Pricing",
  "Availability",
  "Included services",
  "Requirements",
  "Preview",
  "Submit for verification",
] as const

const LIBRARY: PhotoFile[] = [
  "card-duel.jpg",
  "card-dribble.jpg",
  "card-group.jpg",
  "card-pose.jpg",
  "card-night.jpg",
  "card-stadium.jpg",
  "card-studio.jpg",
  "card-dusk.jpg",
  "card-lead.jpg",
  "field-goal.jpg",
  "field-cones.jpg",
  "match-duel.jpg",
  "match-stadium.jpg",
  "deck-coach.jpg",
  "deck-hotel.jpg",
  "deck-meal.jpg",
  "deck-bus.jpg",
  "deck-squad.jpg",
  "deck-camp2.jpg",
]

/** The photos an academy can pick from (same order as the prototype) */
export const PHOTO_LIBRARY: string[] = LIBRARY.map(academyPhoto)

/** The cover used when no photo is chosen yet */
export const FALLBACK_COVER = academyPhoto("field-goal.jpg")

export function newListing(view: Pick<View, "host">): WizardListing {
  return {
    id: null,
    academyId: view.host.academyIds[0],
    title: "",
    type: "residential",
    level: "intermediate",
    gender: "mixed",
    ageMin: 12,
    ageMax: 16,
    durationWeeks: 12,
    sessionsPerWeek: 8,
    hoursPerWeek: 12,
    rolling: false,
    summary: "",
    methodology: "",
    competition: "",
    fees: {
      amount: 2500,
      per: "term",
      registrationFee: 150,
      deposit: { kind: "percent", value: 25 },
      schedule: "deposit_balance",
      balanceDueDays: 21,
    },
    includes: ["coaching", "insurance"],
    optional: [],
    accommodation: "none",
    accommodationNote: "",
    education: "none",
    educationNote: "",
    requirements: ["Aged 12–16 on the start date"],
    documents: ["passport", "medical", "consent"],
    questions: BASE_QUESTIONS.slice(),
    gallery: [],
    alt: "",
    sponsored: false,
    views30d: 0,
    reviewSummary: {
      count: 0,
      avg: 0,
      areas: { training: 0, communication: 0, facilities: 0, organization: 0 },
    },
    image: "",
    intakes: [],
    status: "draft",
    schedule: SCHEDULES.residential,
    policies: POLICIES,
    wizardStep: 0,
  }
}

/** A start date on the first Monday of `monthKey` (YYYY-MM) */
export function makeIntake(
  listing: Pick<WizardListing, "id" | "rolling" | "durationWeeks">,
  monthKey: string,
  capacity: number,
  i: number
): Intake {
  const start = DATES.firstMonday(monthKey + "-01", 0)
  return {
    id: (listing.id || "new") + "-i" + (i + 1) + "-" + monthKey,
    label: DATES.monthLabel(start) + " intake",
    start,
    end: listing.rolling
      ? null
      : DATES.addDays(start, (listing.durationWeeks || 12) * 7 - 1),
    deadline: DATES.addDays(start, listing.rolling ? -7 : -21),
    capacity,
    seededTaken: 0,
  }
}

/** Errors for one step, keyed by the field id (prototype messages, verbatim) */
export function validateWizard(
  step: number,
  l: WizardListing
): Record<string, string> {
  const e: Record<string, string> = {}
  if (step === 0) {
    if (!l.title.trim()) e["amk-w-title"] = "Give the program a name"
    if (l.summary.trim().length < 30)
      e["amk-w-summary"] = "Write a one-line summary of at least 30 characters"
  }
  if (step === 1 && l.gallery.length < 3)
    e["amk-w-photos"] = "Choose at least 3 photos (5 is best)"
  if (step === 2 && l.methodology.trim().length < 20)
    e["amk-w-method"] = "Describe the training methodology"
  if (step === 3) {
    if (!(l.ageMin >= 8 && l.ageMax <= 23 && l.ageMin < l.ageMax))
      e["amk-w-ages"] = "Ages must be between 8 and 23, minimum below maximum"
  }
  if (step === 4) {
    if (!(l.fees.amount > 0)) e["amk-w-amount"] = "Enter the fee"
    const d = l.fees.deposit
    if (d && d.kind === "percent" && (d.value < 5 || d.value > 60))
      e["amk-w-deposit"] = "Deposits are between 5% and 60% of the program fee"
  }
  if (step === 5) {
    if (
      !l.rolling &&
      !(
        l.durationWeeks !== null &&
        l.durationWeeks >= 1 &&
        l.durationWeeks <= 52
      )
    )
      e["amk-w-weeks"] = "Duration must be 1 to 52 weeks"
    if (!l.intakes.length) e["amk-w-intakes"] = "Add at least one start date"
  }
  if (step === 7 && !l.documents.length)
    e["amk-w-docs"] = "Ask for at least one document"
  return e
}

/** The listing as families would see it, built with the same card and fee maths. */
export function preview(
  l: WizardListing,
  view: Pick<View, "academies" | "catalog" | "apps" | "today">
): EnrichedListing {
  const raw: StoredListing = {
    ...l,
    id: l.id || "preview",
    image: l.gallery[0] || FALLBACK_COVER,
    gallery: l.gallery.length
      ? l.gallery.concat(PHOTO_LIBRARY).slice(0, 5)
      : PHOTO_LIBRARY.slice(0, 5),
    intakes: l.intakes.length
      ? l.intakes
      : [makeIntake(l, DATES.monthKey(DATES.monthStart(view.today, 3)), 20, 0)],
  }
  return enrich(
    { academies: view.academies, orgs: view.catalog.orgs, listings: [raw] },
    view.apps,
    view.today
  )[0]
}

/** What must be complete before the listing can be submitted */
export function checklist(l: WizardListing): [string, boolean][] {
  return [
    ["Name and summary", Boolean(l.title) && l.summary.length >= 30],
    ["At least 3 photos", l.gallery.length >= 3],
    ["Program details and methodology", l.methodology.length >= 20],
    ["Age range", l.ageMin < l.ageMax],
    ["Fees and deposit", l.fees.amount > 0],
    ["At least one start date", l.intakes.length > 0],
    ["What’s included", l.includes.length > 0],
    ["Required documents", l.documents.length > 0],
  ]
}
