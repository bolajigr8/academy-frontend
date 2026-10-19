import type {
  Academy,
  Intake,
  Listing,
  Organization,
  Verification,
} from "@/data/types"

/** Deterministic club crest for academies without a logo (see crestFor) */
export type CrestData = {
  shape: 0 | 1 | 2 | 3
  pattern: 0 | 1 | 2 | 3
  initials: string
}

export type EnrichedIntake = Intake & {
  placesLeft: number
  open: boolean
}

/** A listing with everything a card, map pin or detail page needs (search enrich) */
export type EnrichedListing = Omit<Listing, "intakes"> & {
  intakes: EnrichedIntake[]
  academy: Academy
  org: Organization
  verification: Verification
  country: string
  city: string
  crest: CrestData
  monthly: number
  total: number | null
  deposit: number
  nextIntake: EnrichedIntake | null
  openCount: number
  bayes: number
  completeness: number
  haystack: string
}

/** Search filters, mirrored in the URL (see toQuery / parseQuery) */
export type SearchState = {
  loc: string
  age: string
  type: string
  start: string
  dur: string
  country: string
  city: string
  gender: string
  level: string
  min: number
  max: number
  acc: string
  edu: string
  ver: string
  sort: string
  view: string
}
