/*
 * Domain types for the catalog, derived from the value sets that actually
 * appear in js/amk-catalog.js. Pure types: no runtime code, no UI.
 */
export type CountryCode = "ES" | "PT" | "GB" | "DE" | "IT" | "FR"
export type TypeId =
  "residential" | "day" | "school" | "specialist" | "development"
export type LevelId = "foundation" | "intermediate" | "advanced" | "elite"
export type GenderId = "boys" | "girls" | "mixed"
export type DurationId = "short" | "half" | "season" | "rolling"
export type Verification = "pending" | "verified" | "club"
export type FeeUnit = "season" | "term" | "program" | "week" | "month"
export type Provision = "included" | "optional" | "none"
export type IncludeId =
  | "coaching"
  | "accommodation"
  | "meals"
  | "education"
  | "kit"
  | "medical"
  | "analysis"
  | "matches"
  | "insurance"
  | "transfers"
  | "language"
export type DocTypeId =
  "passport" | "birth" | "medical" | "consent" | "school" | "cv" | "photo"

export type Deposit =
  { kind: "fixed"; value: number } | { kind: "percent"; value: number }

export type Fees = {
  amount: number
  per: FeeUnit
  registrationFee: number
  deposit: Deposit | null
  /** "full" = no deposit, the whole fee to confirm (set by the listing editor) */
  schedule: "deposit_balance" | "monthly" | "full"
  balanceDueDays: number
}

export type OptionalExtra = {
  id: string
  label: string
  price: number
  per: "once" | "program" | "season" | "term" | "week" | "month"
}

export type Question =
  | { id: string; label: string; type: "text" | "textarea"; required: boolean }
  | {
      id: string
      label: string
      type: "select"
      required: boolean
      options: string[]
    }

export type ScheduleDay = { day: string; items: string[] }

export type ReviewAreas = {
  training: number
  communication: number
  facilities: number
  organization: number
}

export type ReviewSummary = { count: number; avg: number; areas: ReviewAreas }

export type Organization = {
  id: string
  name: string
  type: "operator" | "club"
  countryCode: CountryCode
  verification: Verification
  since: number
  affiliation?: { clubName: string; docRef: string }
}

export type Academy = {
  id: string
  orgId: string
  name: string
  clubName: string | null
  city: string
  countryCode: CountryCode
  lat: number
  lng: number
  address: string
  founded: number
  responseRate: number
  responseHours: number
  languages: string[]
  facilities: string[]
  description: string
}

/** Intake as stored in the catalog */
export type Intake = {
  id: string
  label: string
  start: string
  end: string | null
  deadline: string
  capacity: number
  seededTaken: number
}

export type Review = {
  id: string
  listingId: string
  enrollmentRef: string
  verified: boolean
  authorLabel: string
  date: string
  ratings: ReviewAreas
  text: string
}

/** Prototype vocabulary. The API layer maps in_review <-> the backend's pending_review. */
export type ListingStatus = "draft" | "in_review" | "published" | "rejected"

/** One program as stored in the catalog (before search enriches it) */
export type Listing = {
  id: string
  academyId: string
  title: string
  type: TypeId
  level: LevelId
  gender: GenderId
  ageMin: number
  ageMax: number
  /** null for rolling (monthly) programs */
  durationWeeks: number | null
  sessionsPerWeek: number
  hoursPerWeek: number
  summary: string
  methodology: string
  competition: string
  fees: Fees
  includes: IncludeId[]
  optional: OptionalExtra[]
  accommodation: Provision
  accommodationNote: string
  education: Provision
  educationNote: string
  requirements: string[]
  documents: DocTypeId[]
  gallery: string[]
  alt: string
  sponsored: boolean
  views30d: number
  reviewSummary: ReviewSummary
  rolling: boolean
  image: string
  schedule: ScheduleDay[]
  questions: Question[]
  policies: Record<string, string>
  status: ListingStatus
  intakes: Intake[]
}

export type Catalog = {
  today: string
  orgs: Organization[]
  academies: Academy[]
  listings: Listing[]
  reviews: Review[]
}
