import type { Deposit, Intake, Listing } from "@/data/types"

/*
 * Application-side types, derived from js/amk-flow.js and js/amk-demo.js.
 * The sync guide's application statuses and labels match this set exactly.
 */
export type AppStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "info_required"
  | "accepted"
  | "rejected"
  | "enrollment_pending"
  | "enrolled"
  | "cancelled"

export type Actor = "family" | "academy" | "system"
export type StatusTone = "ghost" | "info" | "success" | "warning"
export type StatusGroup = "action" | "progress" | "enrolled" | "closed"

export type StatusMeta = {
  label: string
  tone: StatusTone
  final: boolean
  group: StatusGroup
  family: string
  host: string
  next: string | null
}

export type Transition = {
  from: AppStatus
  to: AppStatus
  actor: Actor
  verb: string
}

export type AppEvent = {
  status: AppStatus
  at: string
  by: Actor
  note: string
}

export type TimelineStep = {
  key: string
  label: string
  state: "done" | "current" | "upcoming" | "skipped"
  at: string | null | undefined
  tone?: StatusTone
}

export type PlanItem = {
  id: string
  label: string
  amount: number
  due: string
  required: boolean
  status: "due" | "paid"
  paidAt: string | null
  method?: string
}

export type Gender = "male" | "female"

/** What eligibility() reads from a player */
export type PlayerBasics = {
  dob: string
  firstName: string
  gender: Gender
}

export type Eligibility = { ok: boolean; reasons: string[]; age?: number }

export type FeeListing = Pick<
  Listing,
  "fees" | "durationWeeks" | "optional" | "rolling"
>
export type PlanListing = FeeListing & {
  fees: Listing["fees"] & { deposit: Deposit | null }
}
export type { Intake }

export type Message = {
  from: Actor
  at: string
  text: string
}

export type Notification = {
  id: string
  appId: string
  type: string
  title: string
  at: string
  note: string
}

export type Role = "family" | "academy"

export type HostKpis = {
  received: number
  pending: number
  accepted: number
  enrolled: number
  activeListings: number
  views: number
  conversion: number
  revenue: number
  commission: number
}

/* ---------------- Demo people, documents and applications (js/amk-demo.js) ---------------- */
import type { DocTypeId, LevelId } from "@/data/types"

export type Parent = {
  id: string
  role: "family"
  firstName: string
  lastName: string
  initials: string
  email: string
  phone: string
  city: string
  country: string
  relation: string
}

export type Season = {
  season: string
  club: string
  apps: number
  goals: number
  assists: number
  note: string
}

export type PlayerVideo = {
  id: string
  title: string
  url: string
  duration: string
}

export type Player = PlayerBasics & {
  id: string
  lastName: string
  initials: string
  nationality: string
  location: string
  position: string
  positions: string[]
  foot: string
  heightCm: number
  weightKg: number
  level: LevelId
  currentClub: string
  previousClubs: string[]
  bio: string
  seasons: Season[]
  achievements: string[]
  videos: PlayerVideo[]
}

export type Host = {
  id: string
  role: "host"
  firstName: string
  lastName: string
  initials: string
  title: string
  email: string
  phone: string
  orgId: string
  academyIds: string[]
}

export type VaultDoc = {
  id: string
  playerId: string
  type: DocTypeId
  name: string
  sizeKb: number
  uploadedAt: string
}

export type AppDocStatus = "uploaded" | "accepted" | "missing" | "needs_update"

export type AppDoc = {
  docId: string | null
  type: DocTypeId
  status: AppDocStatus
  name?: string
}

export type Guardian = { name: string; email: string }

/** A player as the academy sees them when the family is not the demo family */
export type Applicant = {
  first: string
  last: string
  name: string
  initials: string
  dob: string
  nationality: string
  position: string
  foot: string
  heightCm: number
  club: string
  level: LevelId
  guardian: Guardian | null
  video: string
}

export type Application = {
  id: string
  ref: string | null
  familyId: string | null
  listingId: string
  intakeId: string
  playerId: string | null
  applicant: Applicant | null
  status: AppStatus
  events: AppEvent[]
  createdAt: string
  answers: Record<string, string>
  documents: AppDoc[]
  optional: string[]
  payment: { items: PlanItem[]; createdAt: string } | null
  lastStep: number | null
}

export type ThreadMessage = Message & { author: string }

export type HostListing = Omit<
  Listing,
  | "rolling"
  | "image"
  | "schedule"
  | "questions"
  | "policies"
  | "intakes"
  | "status"
> & {
  status: "draft"
  intakeDraft: { monthsAhead: number; capacity: number }[]
  wizardStep: number
}

export type Demo = {
  parent: Parent
  players: Player[]
  host: Host
  documents: VaultDoc[]
  applications: Application[]
  threads: Record<string, ThreadMessage[]>
  hostListings: HostListing[]
}
