import { LIVE } from "@/data/live-copy"

import type { ApiMeOptions, ApiPlayer, PlayerFileField } from "./api"

/*
 * The player profile form (api mode; week 2 part 1, section 3).
 * Form state, API <-> form, the multipart body, checks. No JSX.
 */

export const PLAYER_FILES: PlayerFileField[] = [
  "passport_document",
  "medical_certificate",
  "player_cv",
]

export type PlayerDraft = {
  id: number | null
  owner_relationship: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  nationality: string
  country_of_residence: string
  city: string
  email: string
  phone: string
  passport_number: string
  primary_position: string
  secondary_position: string
  preferred_foot: string
  height_cm: string
  current_club_academy: string
  previous_clubs: string[]
  current_level: string
  highlight_video_url: string
  video_links: string[]
  emergency_contact_name: string
  emergency_contact_relationship: string
  emergency_contact_phone: string
  emergency_contact_email: string
  guardian_name: string
  guardian_phone: string
  photo: File | null
  files: Partial<Record<PlayerFileField, File>>
  removeFiles: PlayerFileField[]
}

const TEXT_KEYS = [
  "first_name",
  "last_name",
  "date_of_birth",
  "gender",
  "nationality",
  "country_of_residence",
  "city",
  "email",
  "phone",
  "passport_number",
  "primary_position",
  "secondary_position",
  "preferred_foot",
  "height_cm",
  "current_club_academy",
  "current_level",
  "highlight_video_url",
  "emergency_contact_name",
  "emergency_contact_relationship",
  "emergency_contact_phone",
  "emergency_contact_email",
  "guardian_name",
  "guardian_phone",
] as const

/** A new profile; nothing is pre-selected for "Who is this player?" */
export function emptyPlayer(): PlayerDraft {
  return {
    id: null,
    // the family answers "Who is this player?" first: nothing is pre-selected
    owner_relationship: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    nationality: "",
    country_of_residence: "",
    city: "",
    email: "",
    phone: "",
    passport_number: "",
    primary_position: "",
    secondary_position: "",
    preferred_foot: "",
    height_cm: "",
    current_club_academy: "",
    previous_clubs: [],
    current_level: "",
    highlight_video_url: "",
    video_links: [],
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    emergency_contact_email: "",
    guardian_name: "",
    guardian_phone: "",
    photo: null,
    files: {},
    removeFiles: [],
  }
}

export function playerDraftFrom(p: ApiPlayer): PlayerDraft {
  const d: PlayerDraft = {
    ...emptyPlayer(),
    id: p.id,
    owner_relationship: p.owner_relationship,
    previous_clubs: p.previous_clubs,
    video_links: p.video_links,
  }
  for (const k of TEXT_KEYS) {
    const v = p[k]
    d[k] = v === null || v === undefined ? "" : String(v)
  }
  return d
}

/** Multipart body: every text field (empty clears it), lists indexed, files when picked */
export function playerForm(d: PlayerDraft): FormData {
  const f = new FormData()
  f.append("owner_relationship", d.owner_relationship)
  for (const k of TEXT_KEYS) f.append(k, d[k].trim())
  for (const [key, list] of [
    ["previous_clubs", d.previous_clubs],
    ["video_links", d.video_links],
  ] as const) {
    const items = list.map((x) => x.trim()).filter(Boolean)
    if (items.length === 0) f.append(key, "[]")
    items.forEach((x, i) => f.append(`${key}[${i}]`, x))
  }
  if (d.photo) f.append("profile_photo", d.photo)
  // files picked before the profile became a minor's own profile are not sent
  if (d.owner_relationship === "self" && minorSelfDraft(d)) {
    d.removeFiles.forEach((field) => f.append("remove_files[]", field))
    return f
  }
  for (const field of PLAYER_FILES) {
    const file = d.files[field]
    if (file) f.append(field, file)
  }
  d.removeFiles.forEach((field) => f.append("remove_files[]", field))
  return f
}

export const PLAYER_ID = (field: string) => `pl-${field.replace(/_/g, "-")}`

/** Backend field -> control id; list items ("video_links.0") land on their list */
export function playerFieldMap(): Record<string, string> {
  const m: Record<string, string> = {}
  for (const k of [
    ...TEXT_KEYS,
    "owner_relationship",
    "previous_clubs",
    "video_links",
    "profile_photo",
    ...PLAYER_FILES,
  ])
    m[k] = PLAYER_ID(k)
  return m
}

const isLink = (v: string) => /^https?:\/\/\S+$/i.test(v.trim())

/** Only what the contract makes required to SAVE (names); the rest is checked by the backend */
export function validatePlayer(d: PlayerDraft): Record<string, string> {
  const t = LIVE.players.errors
  const e: Record<string, string> = {}
  if (!d.owner_relationship) e[PLAYER_ID("owner_relationship")] = t.relationship
  if (!d.first_name.trim()) e[PLAYER_ID("first_name")] = t.firstName
  if (!d.last_name.trim()) e[PLAYER_ID("last_name")] = t.lastName
  const h = d.height_cm.trim()
  if (h && !(/^\d+$/.test(h) && Number(h) >= 50 && Number(h) <= 250))
    e[PLAYER_ID("height_cm")] = t.height
  if (d.highlight_video_url.trim() && !isLink(d.highlight_video_url))
    e[PLAYER_ID("highlight_video_url")] = t.link
  if (d.video_links.some((v) => v.trim() && !isLink(v)))
    e[PLAYER_ID("video_links")] = t.link
  return e
}

/** Percent of required_fields filled (the backend's missing_fields) */
export function completePercent(p: ApiPlayer, options: ApiMeOptions): number {
  const total = options.required_fields.length || 1
  return Math.round(((total - p.missing_fields.length) / total) * 100)
}

/** Whole years on a date (both plain YYYY-MM-DD) */
export function ageOn(dob: string, day: string): number {
  const [y, m, d] = dob.split("-").map(Number)
  const [ty, tm, td] = day.split("-").map(Number)
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0)
}

/** A self profile without a date of birth, or under 18, cannot hold documents */
export function minorSelfDraft(d: PlayerDraft, consentAge = 18): boolean {
  if (d.owner_relationship !== "self") return false
  if (!d.date_of_birth) return true
  const today = new Date().toISOString().slice(0, 10)
  return ageOn(d.date_of_birth, today) < consentAge
}
