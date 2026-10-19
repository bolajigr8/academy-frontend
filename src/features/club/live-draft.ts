import { DOC_TYPES, INCLUDES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import type { DocTypeId } from "@/data/types"
import * as DATES from "@/lib/date"
import { majorToMinor, minorToMajor } from "@/lib/money"

import type {
  ApiImage,
  ApiIntake,
  ApiListing,
  ApiListingStatus,
  ApiOptions,
  ApiQuestion,
  IntakeBody,
  ListingUpdate,
} from "./api"

/*
 * The listing editor in api mode (delivery W1b). The form edits a LiveDraft;
 * this module converts the backend listing into a draft, a draft step back
 * into the fields the backend accepts, and checks each step. No JSX.
 *
 * The step layout is the prototype's (host/listing-edit.html):
 * 0 About · 1 Images · 2 Details · 3 Ages · 4 Pricing · 5 Availability ·
 * 6 Included · 7 Requirements · 8 Preview · 9 Submit. The backend accepts any
 * field on any update, so each step sends only its own fields.
 */

export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const
export type Day = (typeof DAYS)[number]

/**
 * Prototype document -> backend key. passport, medical_certificate and
 * player_cv come from the contract sample; the others follow the same style.
 * TO CONFIRM with the backend (canonical key list requested).
 */
export const DOC_KEYS: Record<DocTypeId, string> = {
  passport: "passport",
  birth: "birth_certificate",
  medical: "medical_certificate",
  consent: "parental_consent",
  school: "school_report",
  cv: "player_cv",
  photo: "photo",
}

/** The prototype's "what's included" choices, sent as their labels */
export const INCLUDE_LABELS: string[] = Object.values(INCLUDES).map(
  (i) => i.label
)

/** Label for a document key: the prototype's label when known, else the key written out */
export function documentLabel(key: string): string {
  const id = (Object.keys(DOC_KEYS) as DocTypeId[]).find(
    (d) => DOC_KEYS[d] === key
  )
  if (id) return DOC_TYPES[id].label
  const words = key.replace(/_/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export type DraftImage =
  | { kind: "saved"; key: string; image: ApiImage }
  | { kind: "new"; key: string; file: File; url: string }

export type DraftIntake = {
  key: string
  /** null until created on the backend */
  id: number | null
  /** YYYY-MM: the start is the first Monday of this month (prototype makeIntake) */
  month: string
  /** "" = unlimited */
  capacity: string
  placesTaken: number
  /** the saved intake, to send only what changed */
  saved: ApiIntake | null
}

export type DraftQuestion = {
  key: string
  question: string
  type: ApiQuestion["type"]
  required: boolean
  options: string[]
}

export type LiveDraft = {
  id: number | null
  slug: string | null
  status: ApiListingStatus
  academyId: number | null
  // 0 About
  title: string
  description: string
  // 1 Images
  images: DraftImage[]
  removedImageIds: number[]
  // 2 Details
  academyType: string
  playingLevel: string
  gender: string
  trainingFrequency: string
  methodology: string
  competition: string
  schedule: Record<Day, string>
  // 3 Ages
  ageMin: string
  ageMax: string
  // 4 Pricing
  currency: string
  paymentFrequency: string
  price: string
  registrationFee: string
  deposit: string
  optionalServices: string[]
  // 5 Availability
  durationValue: string
  durationUnit: string
  intakes: DraftIntake[]
  removedIntakeIds: number[]
  // 6 Included
  included: string[]
  hasAccommodation: boolean
  hasEducation: boolean
  // 7 Requirements (the backend's step 8: requirements, documents, questions, terms)
  requirements: string[]
  documents: string[]
  questions: DraftQuestion[]
  terms: string
}

let seq = 0
export const newKey = (prefix: string) => `${prefix}-${++seq}`

const emptySchedule = (): Record<Day, string> =>
  Object.fromEntries(DAYS.map((d) => [d, ""])) as Record<Day, string>

const majorText = (minor: number | undefined, currency: string) =>
  minor === undefined || minor === 0
    ? ""
    : String(minorToMajor(minor, currency))

/** A new draft: the backend's first option for every dropdown */
export function newDraft(
  academyId: number | null,
  options: ApiOptions
): LiveDraft {
  return {
    id: null,
    slug: null,
    status: "draft",
    academyId,
    title: "",
    description: "",
    images: [],
    removedImageIds: [],
    academyType: options.academy_types[0] ?? "",
    playingLevel: options.playing_levels[0] ?? "",
    gender: options.genders[0] ?? "",
    trainingFrequency: "",
    methodology: "",
    competition: "",
    schedule: emptySchedule(),
    // the prototype editor's starting range (newListing)
    ageMin: "12",
    ageMax: "16",
    requirements: [],
    currency: options.default_currency,
    paymentFrequency: options.payment_frequencies[0] ?? "",
    price: "",
    registrationFee: "",
    deposit: "",
    optionalServices: [],
    durationValue: "",
    durationUnit: options.duration_units[0] ?? "",
    intakes: [],
    removedIntakeIds: [],
    included: [],
    hasAccommodation: false,
    hasEducation: false,
    documents: [],
    questions: [],
    terms: "",
  }
}

/** The saved listing as an editable draft */
export function draftFromApi(l: ApiListing, options: ApiOptions): LiveDraft {
  const base = newDraft(l.academy_id, options)
  const schedule = emptySchedule()
  for (const d of DAYS) schedule[d] = l.weekly_schedule[d] ?? ""
  const currency = l.currency || options.default_currency
  return {
    ...base,
    id: l.id,
    slug: l.slug,
    status: l.status,
    title: l.title,
    description: l.description ?? "",
    images: [...l.images]
      .sort(
        (a, b) =>
          Number(b.is_primary) - Number(a.is_primary) ||
          a.sort_order - b.sort_order
      )
      .map((image) => ({ kind: "saved", key: `img-${image.id}`, image })),
    academyType: l.academy_type ?? base.academyType,
    playingLevel: l.playing_level ?? base.playingLevel,
    gender: l.gender ?? base.gender,
    trainingFrequency: l.training_frequency ?? "",
    methodology: l.methodology ?? "",
    competition: l.competition ?? "",
    schedule,
    ageMin: l.age_min === null ? "" : String(l.age_min),
    ageMax: l.age_max === null ? "" : String(l.age_max),
    requirements: l.requirements
      ? l.requirements.split("\n").filter((x) => x.trim() !== "")
      : [],
    currency,
    paymentFrequency: l.payment_frequency ?? base.paymentFrequency,
    price: majorText(l.price?.amount_minor, currency),
    registrationFee: majorText(l.registration_fee?.amount_minor, currency),
    deposit: majorText(l.deposit?.amount_minor, currency),
    optionalServices: l.optional_services,
    durationValue: l.duration_value === null ? "" : String(l.duration_value),
    durationUnit: l.duration_unit ?? base.durationUnit,
    intakes: [...l.intakes]
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .map((i) => ({
        key: `intake-${i.id}`,
        id: i.id,
        month: i.start_date.slice(0, 7),
        capacity: i.capacity === null ? "" : String(i.capacity),
        placesTaken: i.places_taken,
        saved: i,
      })),
    included: l.included,
    hasAccommodation: l.has_accommodation,
    hasEducation: l.has_education,
    documents: l.required_documents,
    terms: l.terms ?? "",
    questions: l.application_questions.map((q) => ({
      key: newKey("q"),
      question: q.question,
      type: q.type,
      required: q.required,
      options: q.options ?? [],
    })),
  }
}

/* ---------------- numbers ---------------- */

const int = (v: string): number | null =>
  /^\d+$/.test(v.trim()) ? Number(v.trim()) : null

/** "8500" or "8500.50" -> minor units; "" -> 0; anything else -> null */
export function amountMinor(v: string, currency: string): number | null {
  const t = v.trim().replace(/,/g, "")
  if (t === "") return 0
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null
  return majorToMinor(Number(t), currency)
}

/** Weeks per duration unit, as the backend calculates duration_weeks */
const WEEKS: Record<string, number> = {
  week: 1,
  month: 4,
  season: 40,
  year: 52,
}

export function durationWeeks(
  d: Pick<LiveDraft, "durationValue" | "durationUnit">
): number | null {
  const n = int(d.durationValue)
  const w = WEEKS[d.durationUnit]
  return n === null || w === undefined ? null : n * w
}

/* ---------------- step payloads ---------------- */

/** The fields one step saves (steps 1 and 5 also have their own calls below) */
export function stepPayload(step: number, d: LiveDraft): ListingUpdate {
  switch (step) {
    case 0:
      return { title: d.title.trim(), description: d.description.trim() }
    case 2: {
      const days = DAYS.filter((day) => d.schedule[day].trim() !== "")
      return {
        academy_type: d.academyType,
        playing_level: d.playingLevel,
        gender: d.gender,
        training_frequency: d.trainingFrequency.trim() || null,
        methodology: d.methodology.trim() || null,
        competition: d.competition.trim() || null,
        // Only with at least one day: an empty {} reaches the backend (PHP) as
        // an empty list, which the contract refuses ("a list ... gives 422").
        ...(days.length > 0
          ? {
              weekly_schedule: Object.fromEntries(
                days.map((day) => [day, d.schedule[day].trim()])
              ),
            }
          : {}),
      }
    }
    case 3:
      return {
        age_min: int(d.ageMin) ?? undefined,
        age_max: int(d.ageMax) ?? undefined,
      }
    case 4:
      return {
        currency: d.currency,
        payment_frequency: d.paymentFrequency,
        price_minor: amountMinor(d.price, d.currency) ?? undefined,
        registration_fee_minor:
          amountMinor(d.registrationFee, d.currency) ?? undefined,
        deposit_minor: amountMinor(d.deposit, d.currency) ?? undefined,
        optional_services: d.optionalServices
          .map((s) => s.trim())
          .filter(Boolean),
      }
    case 5:
      return {
        duration_value: int(d.durationValue) ?? undefined,
        duration_unit: d.durationUnit,
      }
    case 6:
      return {
        included: d.included,
        has_accommodation: d.hasAccommodation,
        has_education: d.hasEducation,
      }
    case 7:
      return {
        requirements:
          d.requirements
            .map((r) => r.trim())
            .filter(Boolean)
            .join("\n") || null,
        terms: d.terms.trim() || null,
        required_documents: d.documents,
        application_questions: d.questions.map((q) => ({
          question: q.question.trim(),
          type: q.type,
          required: q.required,
          ...(q.type === "choice"
            ? { options: q.options.map((o) => o.trim()).filter(Boolean) }
            : {}),
        })),
      }
    default:
      return {}
  }
}

/** Step 1: the new photos to upload and the saved ones to delete */
export function imageChanges(d: LiveDraft) {
  const upload = d.images.flatMap((img, i) =>
    img.kind === "new"
      ? [{ file: img.file, sortOrder: i, primary: i === 0 }]
      : []
  )
  return { upload, deleteIds: d.removedImageIds }
}

/* ---------------- intakes (step 5) ---------------- */

/** Start, end, deadline and label for a start month (prototype makeIntake) */
export function intakeDates(
  d: Pick<LiveDraft, "durationValue" | "durationUnit" | "paymentFrequency">,
  month: string,
  today: string
) {
  const start = DATES.firstMonday(month + "-01", 0)
  const rolling = d.paymentFrequency === "monthly"
  const weeks = durationWeeks(d)
  const end =
    rolling || weeks === null ? null : DATES.addDays(start, weeks * 7 - 1)
  const wanted = DATES.addDays(start, rolling ? -7 : -21)
  // the backend refuses a deadline in the past on create
  const deadline = wanted < today ? today : wanted
  return {
    start_date: start,
    end_date: end,
    application_deadline: deadline > start ? start : deadline,
    label: `${DATES.monthLabel(start)} intake`,
  }
}

/** What step 5 has to send: new intakes, changed ones, removed ones */
export function intakeChanges(d: LiveDraft, today: string) {
  const create: IntakeBody[] = []
  const update: { id: number; body: IntakeBody }[] = []
  for (const i of d.intakes) {
    const capacity = i.capacity.trim() === "" ? null : int(i.capacity)
    if (!i.saved || i.id === null) {
      create.push({ ...intakeDates(d, i.month, today), capacity })
      continue
    }
    const body: IntakeBody = {}
    if (i.saved.start_date.slice(0, 7) !== i.month)
      Object.assign(body, intakeDates(d, i.month, today))
    if (capacity !== i.saved.capacity) body.capacity = capacity
    if (Object.keys(body).length > 0) update.push({ id: i.id, body })
  }
  return { create, update, remove: d.removedIntakeIds }
}

/* ---------------- checks ---------------- */

/** Errors for one step, keyed by field id. Prototype messages where the rule is the prototype's. */
export function validateDraft(
  step: number,
  d: LiveDraft
): Record<string, string> {
  const e: Record<string, string> = {}
  const t = LIVE.editor
  if (step === 0) {
    if (d.academyId === null) e["amk-w-academy"] = t.chooseAcademy
    if (!d.title.trim()) e["amk-w-title"] = "Give the program a name"
    if (d.description.trim().length < 30)
      e["amk-w-summary"] = "Write a one-line summary of at least 30 characters"
  }
  if (step === 1 && d.images.length < 3)
    e["amk-w-photos"] = "Choose at least 3 photos (5 is best)"
  if (step === 2) {
    if (!d.trainingFrequency.trim()) e["amk-w-frequency"] = t.trainingFrequency
    if (d.methodology.trim().length < 20)
      e["amk-w-method"] = "Describe the training methodology"
  }
  if (step === 3) {
    const min = int(d.ageMin)
    const max = int(d.ageMax)
    if (min === null || max === null || min < 3 || max > 99 || max < min)
      e["amk-w-ages"] = t.ages
  }
  if (step === 4) {
    const price = amountMinor(d.price, d.currency)
    const deposit = amountMinor(d.deposit, d.currency)
    if (!price) e["amk-w-amount"] = "Enter the fee"
    if (deposit === null || (price && deposit > price))
      e["amk-w-deposit"] = t.depositAbovePrice
    if (amountMinor(d.registrationFee, d.currency) === null)
      e["amk-w-reg"] = "Enter the fee"
  }
  if (step === 5) {
    const n = int(d.durationValue)
    if (n === null || n < 1 || n > 520) e["amk-w-weeks"] = t.duration
    if (!d.intakes.length) e["amk-w-intakes"] = "Add at least one start date"
  }
  if (step === 7) {
    if (!d.requirements.some((r) => r.trim())) e["amk-w-req"] = t.requirements
    if (!d.documents.length) e["amk-w-docs"] = "Ask for at least one document"
    d.questions.forEach((q, i) => {
      if (!q.question.trim()) e[`amk-w-q-${i}`] = t.questionText
      else if (
        q.type === "choice" &&
        (q.options.filter((o) => o.trim()).length < 2 || q.options.length > 20)
      )
        e[`amk-w-q-${i}`] = t.choiceOptions
    })
  }
  return e
}

/** What must be complete before the listing can be submitted (prototype checklist, backend fields) */
/**
 * What must be complete before the listing can be submitted: the prototype's
 * checklist, extended to everything the backend's submit requires (contract
 * section 12: training frequency, duration, payment frequency, entry
 * requirements, an image, an open intake starting today or later).
 */
export function draftChecklist(d: LiveDraft): [string, boolean][] {
  const min = int(d.ageMin)
  const max = int(d.ageMax)
  return [
    ["Name and summary", Boolean(d.title) && d.description.length >= 30],
    ["At least 3 photos", d.images.length >= 3],
    [
      "Program details, training frequency and methodology",
      Boolean(d.trainingFrequency.trim()) && d.methodology.length >= 20,
    ],
    ["Age range", min !== null && max !== null && min <= max],
    ["Fees and deposit", Boolean(amountMinor(d.price, d.currency))],
    [
      "Program length and at least one start date",
      int(d.durationValue) !== null && d.intakes.length > 0,
    ],
    ["What’s included", d.included.length > 0],
    [
      "Entry requirements and required documents",
      d.requirements.some((r) => r.trim()) && d.documents.length > 0,
    ],
  ]
}

/**
 * The editor step (0-based) that holds a backend field. The backend numbers its
 * steps differently from this editor (contract section 12: duration is its
 * step 3, ours is Availability), so "Go to step" follows the field.
 */
const FIELD_STEP: Record<string, number> = {
  title: 0,
  description: 0,
  images: 1,
  academy_type: 2,
  playing_level: 2,
  gender: 2,
  training_frequency: 2,
  methodology: 2,
  competition: 2,
  weekly_schedule: 2,
  age_min: 3,
  age_max: 3,
  price_minor: 4,
  currency: 4,
  payment_frequency: 4,
  deposit_minor: 4,
  registration_fee_minor: 4,
  duration_value: 5,
  duration_unit: 5,
  intakes: 5,
  included: 6,
  requirements: 7,
  required_documents: 7,
  application_questions: 7,
  terms: 7,
}

export function stepForField(field: string, backendStep: number): number {
  return FIELD_STEP[field] ?? Math.max(0, Math.min(9, backendStep - 1))
}

/** File types the backend accepts for gallery images */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
