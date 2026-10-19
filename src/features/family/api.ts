import { resolveBackendUrl } from "@/lib/api/assets"
import { apiClient } from "@/lib/api/client"
import type { ApiPage, ApiResponse } from "@/lib/api/types"

/*
 * Week 2 part 1 contract, sections 2 and 3: profile options and player
 * profiles (applicant token only). The only place these endpoints are called.
 */

/** GET /academy/me/options */
export type ApiMeOptions = {
  relationships: string[]
  genders: string[]
  positions: string[]
  preferred_feet: string[]
  playing_levels: string[]
  /** fields a profile needs before it can be used to apply */
  required_fields: string[]
  /** under this age on submit day, a parent or guardian must consent */
  consent_age: number
}

export type PlayerFileField =
  "passport_document" | "medical_certificate" | "player_cv"

export type ApiPlayer = {
  id: number
  owner_relationship: "self" | "parent" | "guardian"
  first_name: string
  last_name: string
  date_of_birth: string | null
  gender: string | null
  nationality: string | null
  country_of_residence: string | null
  city: string | null
  email: string | null
  phone: string | null
  passport_number: string | null
  primary_position: string | null
  secondary_position: string | null
  preferred_foot: string | null
  height_cm: number | null
  current_club_academy: string | null
  previous_clubs: string[]
  current_level: string | null
  highlight_video_url: string | null
  video_links: string[]
  profile_photo_url: string | null
  files: Record<
    PlayerFileField,
    { uploaded: boolean; download_url: string | null }
  >
  emergency_contact_name: string | null
  emergency_contact_relationship: string | null
  emergency_contact_phone: string | null
  emergency_contact_email: string | null
  guardian_name: string | null
  guardian_phone: string | null
  is_complete: boolean
  missing_fields: { field: string; label: string }[]
  created_at: string
  updated_at: string
}

export async function getMeOptions(): Promise<ApiMeOptions> {
  const res = await apiClient.get<ApiResponse<ApiMeOptions>>(
    "/academy/me/options"
  )
  return res.data.data
}

/** GET /academy/me/players (oldest first, not paginated) */
export async function listPlayers(): Promise<ApiPlayer[]> {
  const res = await apiClient.get<ApiResponse<ApiPlayer[]>>(
    "/academy/me/players"
  )
  return res.data.data
}

/** POST /academy/me/players (multipart): 201 */
export async function createPlayer(form: FormData): Promise<ApiPlayer> {
  const res = await apiClient.post<ApiResponse<ApiPlayer>>(
    "/academy/me/players",
    form
  )
  return res.data.data
}

/** POST /academy/me/players/{id} (multipart): a new file replaces the old one */
export async function updatePlayer(
  id: number,
  form: FormData
): Promise<ApiPlayer> {
  const res = await apiClient.post<ApiResponse<ApiPlayer>>(
    `/academy/me/players/${id}`,
    form
  )
  return res.data.data
}

/** DELETE /academy/me/players/{id}: refused (player_in_use) while an application is in progress */
export async function deletePlayer(id: number): Promise<void> {
  await apiClient.delete(`/academy/me/players/${id}`)
}

/**
 * A private file (download_url needs the bearer token, so a plain link would
 * get 401): fetched as a blob and saved under the name the server gives.
 */
export async function downloadPrivateFile(
  url: string,
  fallbackName: string
): Promise<void> {
  const res = await apiClient.get<Blob>(resolveBackendUrl(url), {
    responseType: "blob",
  })
  const disposition = String(res.headers["content-disposition"] ?? "")
  const name =
    /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1] ??
    fallbackName
  const href = URL.createObjectURL(res.data)
  const a = document.createElement("a")
  a.href = href
  a.download = decodeURIComponent(name)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}

/* ---------------- applications (week 2 part 1 sections 5 to 8; part 2 section 13) ---------------- */

export type ApiAppStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "info_required"
  | "accepted"
  | "rejected"
  | "enrollment_pending"
  | "enrolled"
  | "cancelled"

export type ApiTimelineEntry = {
  from_status: ApiAppStatus | null
  to_status: ApiAppStatus
  actor_type: "applicant" | "academy" | "admin" | "system"
  actor_name: string | null
  note: string | null
  at: string
}

export type ApiAppQuestion = {
  position: number
  question: string
  type: "text" | "long_text" | "yes_no" | "choice"
  required: boolean
  options: string[] | null
  answer: string | boolean | null
}

export type ApiAppDocument = {
  id: number
  type: string
  original_name: string
  download_url: string
  uploaded_at: string
  /** part 2: the academy's review */
  review_status: "uploaded" | "accepted" | "needs_update"
  reviewed_at: string | null
}

export type ApiMissingForSubmission = {
  type: "profile" | "question" | "document"
  key: string | number
  label: string
}

export type ApiAppIntake = {
  id: number
  label: string | null
  start_date: string
  end_date?: string | null
  applications_open_at?: string | null
  application_deadline?: string | null
  status?: "open" | "closed" | "full"
  places_left?: number | null
}

/**
 * The "Need help getting there?" block (week 2 part 2, section 15), from the
 * offer on (accepted, enrollment_pending, enrolled); null before.
 */
export type ApiTravel = {
  /** the academy's city */
  city: string
  /** the intake's start date (plain date) */
  arrive_before: string
  /** Golafly Travel links: key flights | hotels | esim | transfers | insurance (others possible) */
  links: { key: string; label: string; url: string }[]
}

export type ApiApplication = {
  id: number
  reference: string | null
  status: ApiAppStatus
  listing: {
    id: number
    title: string
    slug: string
    academy: {
      id: number
      name: string
      slug?: string
      logo_url: string | null
    }
  }
  intake: ApiAppIntake
  player: ApiPlayer | null
  player_snapshot: Record<string, unknown> | null
  questions: ApiAppQuestion[]
  required_documents: string[]
  documents: ApiAppDocument[]
  /** null once the application can no longer be changed */
  missing_for_submission: ApiMissingForSubmission[] | null
  info_request_note: string | null
  decision_reason: string | null
  consent_at: string | null
  submitted_at: string | null
  decided_at: string | null
  timeline: ApiTimelineEntry[]
  /** part 2: Golafly Travel links from the offer on, else null */
  travel?: ApiTravel | null
  created_at: string
  updated_at: string
}

export type ApiAppSummary = {
  id: number
  reference: string | null
  status: ApiAppStatus
  listing: ApiApplication["listing"]
  intake: { id: number; label: string | null; start_date: string }
  player: { id: number | null; first_name: string; last_name: string }
  submitted_at: string | null
  decided_at: string | null
  timeline: ApiTimelineEntry[]
  unread_messages: number
  last_message: {
    body: string | null
    has_attachment: boolean
    sender_side: "applicant" | "academy"
    sent_at: string
  } | null
  created_at: string
  updated_at: string
}

export type ApiDashboard = {
  players: number
  saved_listings: number
  applications: { total: number; by_status: Record<ApiAppStatus, number> }
  unread_messages: number
  unread_notifications: number
  recent_applications: ApiAppSummary[]
}

const appPath = (id: number) => `/academy/me/applications/${id}`
type Wrapped<T> = { data: ApiResponse<T> }
const unwrap = <T>(r: Wrapped<T>) => r.data.data

/** GET /academy/me/applications (status, player_id, page, per_page <= 50) */
export async function listApplications(
  params: {
    status?: string
    player_id?: number
    page?: number
    per_page?: number
  },
  /** a background count (the Messages badge): a failure shows no toast */
  silent = false
): Promise<ApiPage<ApiAppSummary>> {
  const res = await apiClient.get<ApiPage<ApiAppSummary>>(
    "/academy/me/applications",
    {
      params: { per_page: 50, ...params },
      ...(silent ? { headers: { "X-Silent-Error": "1" } } : {}),
    }
  )
  return res.data
}

export async function getApplication(id: number): Promise<ApiApplication> {
  return unwrap(await apiClient.get<ApiResponse<ApiApplication>>(appPath(id)))
}

/** POST /academy/me/applications/{id}: answers keyed by position (only what changed) */
export async function saveAnswers(
  id: number,
  answers: Record<string, string | boolean | null>
): Promise<ApiApplication> {
  return unwrap(
    await apiClient.post<ApiResponse<ApiApplication>>(appPath(id), { answers })
  )
}

/**
 * POST /academy/me/applications/{id} {intake_id}: moves a draft to another
 * intake of the same listing (part 1, section 5). Draft only (intake_locked
 * otherwise), checked like a new application (full, closed, age, deadline…).
 */
export async function changeIntake(
  id: number,
  intakeId: number
): Promise<ApiApplication> {
  return unwrap(
    await apiClient.post<ApiResponse<ApiApplication>>(appPath(id), {
      intake_id: intakeId,
    })
  )
}

/** POST /academy/me/applications/{id}/documents (multipart: type + file) */
export async function uploadDocument(
  id: number,
  type: string,
  file: File
): Promise<ApiApplication> {
  const form = new FormData()
  form.append("type", type)
  form.append("file", file)
  return unwrap(
    await apiClient.post<ApiResponse<ApiApplication>>(
      `${appPath(id)}/documents`,
      form
    )
  )
}

export async function deleteDocument(
  id: number,
  documentId: number
): Promise<ApiApplication> {
  return unwrap(
    await apiClient.delete<ApiResponse<ApiApplication>>(
      `${appPath(id)}/documents/${documentId}`
    )
  )
}

/** POST …/submit; {consent: true} when the player is under consent_age */
export async function submitApplication(
  id: number,
  consent: boolean
): Promise<ApiApplication> {
  return unwrap(
    await apiClient.post<ApiResponse<ApiApplication>>(
      `${appPath(id)}/submit`,
      consent ? { consent: true } : {}
    )
  )
}

/** POST …/cancel {reason?} */
export async function cancelApplication(
  id: number,
  reason: string
): Promise<ApiApplication> {
  return unwrap(
    await apiClient.post<ApiResponse<ApiApplication>>(
      `${appPath(id)}/cancel`,
      reason.trim() ? { reason: reason.trim() } : {}
    )
  )
}

/** POST …/respond {note?}: sends an info_required application back (part 2, section 13) */
export async function respondToRequest(
  id: number,
  note: string
): Promise<ApiApplication> {
  return unwrap(
    await apiClient.post<ApiResponse<ApiApplication>>(
      `${appPath(id)}/respond`,
      note.trim() ? { note: note.trim() } : {}
    )
  )
}

/** GET /academy/me/dashboard */
export async function getDashboard(): Promise<ApiDashboard> {
  return unwrap(
    await apiClient.get<ApiResponse<ApiDashboard>>("/academy/me/dashboard")
  )
}

/** errors.missing of a 422 "incomplete" (submit / respond), or null */
export function missingFromError(
  error: unknown
): ApiMissingForSubmission[] | null {
  const e = (
    error as { response?: { status?: number; data?: { errors?: unknown } } }
  )?.response
  if (e?.status !== 422) return null
  const errs = e.data?.errors as { missing?: unknown } | null | undefined
  return errs && Array.isArray(errs.missing)
    ? (errs.missing as ApiMissingForSubmission[])
    : null
}

/** errors.reason when it is a refusal code (a string), else null (section 10: it can also be a list) */
export function refusalCode(error: unknown): string | null {
  const r = (
    error as { response?: { data?: { errors?: { reason?: unknown } } } }
  )?.response?.data?.errors?.reason
  return typeof r === "string" ? r : null
}
