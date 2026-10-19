import { apiClient } from "@/lib/api/client"
import type { ApiMoney, ApiPage, ApiResponse } from "@/lib/api/types"

/*
 * Week 1 API contract, sections 3 to 7: the academy portal.
 * The only place these endpoints are called. Every route needs an academy
 * token; other account types get 403.
 */

export type ApiVerificationStatus =
  "pending" | "verified" | "club_academy" | "rejected"

export type ApiListingStatus =
  "draft" | "pending_review" | "published" | "rejected" | "paused" | "archived"

export type ApiOrganization = {
  id: number
  name: string
  legal_name: string | null
  type: "club" | "independent_academy"
  country_code: string
  registration_number: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
  owner_user_id: string
  created_at: string
  updated_at: string
}

export type ApiImage = {
  id: number
  url: string
  sort_order: number
  is_primary: boolean
  created_at: string
}

export type ApiAcademy = {
  id: number
  organization_id: number
  name: string
  slug: string
  logo_url: string | null
  header_image_url: string | null
  description: string | null
  country_name: string
  country_code: string
  city: string
  address: string | null
  /** strings, e.g. "40.4168000" */
  latitude: string | null
  longitude: string | null
  facilities: string[]
  policies: string | null
  verification_status: ApiVerificationStatus
  verification_submitted_at: string | null
  verified_at: string | null
  verification_note: string | null
  /** string, e.g. "0.00" */
  rating_avg: string
  reviews_count: number
  primary_image_url: string | null
  images: ApiImage[]
  created_at: string
  updated_at: string
}

/** The academy summary embedded in every listing */
export type ApiListingAcademy = {
  id: number
  name: string
  slug: string
  /** the club's name; null for an independent academy (part 2, section 14) */
  club_name: string | null
  logo_url: string | null
  city: string
  country_name: string
  country_code: string
  verification_status: ApiVerificationStatus
}

export type ApiIntake = {
  id: number
  label: string | null
  /** plain dates "2027-09-01" */
  start_date: string
  end_date: string | null
  applications_open_at: string | null
  application_deadline: string | null
  /** null = unlimited */
  capacity: number | null
  places_taken: number
  /** null when capacity is unlimited */
  places_left: number | null
  status: "open" | "closed" | "full"
}

export type ApiQuestion = {
  question: string
  type: "text" | "long_text" | "yes_no" | "choice"
  required: boolean
  options?: string[]
}

export type ApiListing = {
  id: number
  academy_id: number
  title: string
  slug: string
  status: ApiListingStatus
  rejection_reason: string | null
  published_at: string | null
  /** week 2 part 2: applications sent to this listing, any status (drafts not counted) */
  applications_count?: number
  /** part 2: when it was last submitted / decided */
  submitted_at?: string | null
  reviewed_at?: string | null
  academy: ApiListingAcademy
  description: string | null
  academy_type: string | null
  gender: string | null
  playing_level: string | null
  age_min: number | null
  age_max: number | null
  training_frequency: string | null
  methodology: string | null
  competition: string | null
  /** keyed monday..sunday; the order of days is not kept */
  weekly_schedule: Partial<Record<string, string>>
  duration_value: number | null
  duration_unit: string | null
  duration_weeks: number | null
  currency: string
  price: ApiMoney | null
  deposit: ApiMoney | null
  registration_fee: ApiMoney | null
  payment_frequency: string | null
  included: string[]
  optional_services: string[]
  has_accommodation: boolean
  has_education: boolean
  requirements: string | null
  required_documents: string[]
  application_questions: ApiQuestion[]
  terms: string | null
  primary_image_url: string | null
  images: ApiImage[]
  intakes: ApiIntake[]
  created_at: string
  updated_at: string
}

/** GET /academy/portal/options: every dropdown value comes from here */
export type ApiOptions = {
  academy_types: string[]
  playing_levels: string[]
  genders: string[]
  duration_units: string[]
  payment_frequencies: string[]
  currencies: string[]
  default_currency: string
  /** part 2: the document-upload screen exists only when true (false in the MVP) */
  verification_documents_enabled?: boolean
  verification_document_types?: string[]
}

/** GET /academy/portal/organization */
export async function getOrganization(): Promise<ApiOrganization> {
  const res = await apiClient.get<ApiResponse<ApiOrganization>>(
    "/academy/portal/organization"
  )
  return res.data.data
}

/** GET /academy/portal/academies (not paginated) */
export async function listAcademies(): Promise<ApiAcademy[]> {
  const res = await apiClient.get<ApiResponse<ApiAcademy[]>>(
    "/academy/portal/academies"
  )
  return res.data.data
}

/**
 * GET /academy/portal/academies/{id} (part 1, section 4): one academy with its
 * gallery. Another organization's academy answers 404.
 */
export async function getAcademy(id: number): Promise<ApiAcademy> {
  const res = await apiClient.get<ApiResponse<ApiAcademy>>(
    `/academy/portal/academies/${id}`
  )
  return res.data.data
}

/** GET /academy/portal/options */
export async function getOptions(): Promise<ApiOptions> {
  const res = await apiClient.get<ApiResponse<ApiOptions>>(
    "/academy/portal/options"
  )
  return res.data.data
}

/**
 * GET /academy/portal/listings, every page (newest first). The listings page
 * shows a count per status tab, so it needs the whole list; 100 is the
 * largest page the API allows.
 */
export async function listAllListings(): Promise<ApiListing[]> {
  const all: ApiListing[] = []
  let page = 1
  for (;;) {
    const res = await apiClient.get<ApiPage<ApiListing>>(
      "/academy/portal/listings",
      { params: { page, per_page: 100 } }
    )
    all.push(...res.data.data)
    const { current_page, last_page } = res.data.meta
    if (current_page >= last_page) return all
    page = current_page + 1
  }
}

/* ---------------- listing editor (W1b) ---------------- */

/** Every field a listing update accepts (contract section 6). Send only what changed. */
export type ListingUpdate = Partial<{
  title: string
  description: string | null
  academy_type: string
  playing_level: string
  gender: string
  training_frequency: string | null
  methodology: string | null
  competition: string | null
  weekly_schedule: Record<string, string>
  duration_value: number
  duration_unit: string
  age_min: number
  age_max: number
  price_minor: number
  currency: string
  payment_frequency: string
  deposit_minor: number
  registration_fee_minor: number
  included: string[]
  optional_services: string[]
  has_accommodation: boolean
  has_education: boolean
  requirements: string | null
  required_documents: string[]
  application_questions: ApiQuestion[]
  terms: string | null
}>

export type IntakeBody = {
  label?: string | null
  start_date?: string
  end_date?: string | null
  applications_open_at?: string | null
  application_deadline?: string | null
  /** null = unlimited */
  capacity?: number | null
  status?: "open" | "closed"
}

const listingPath = (id: number) => `/academy/portal/listings/${id}`

/** GET /academy/portal/listings/{id} (also the Preview step's data) */
export async function getListing(id: number): Promise<ApiListing> {
  const res = await apiClient.get<ApiResponse<ApiListing>>(listingPath(id))
  return res.data.data
}

/** POST /academy/portal/listings: creates a draft (academy_id + title required) */
export async function createListing(
  body: { academy_id: number; title: string } & ListingUpdate
): Promise<ApiListing> {
  const res = await apiClient.post<ApiResponse<ApiListing>>(
    "/academy/portal/listings",
    body
  )
  return res.data.data
}

/** POST /academy/portal/listings/{id}: saves one step's fields */
export async function updateListing(
  id: number,
  body: ListingUpdate
): Promise<ApiListing> {
  const res = await apiClient.post<ApiResponse<ApiListing>>(
    listingPath(id),
    body
  )
  return res.data.data
}

/**
 * POST /academy/portal/listings/{id} as multipart: new gallery files
 * (images[i][file], images[i][sort_order], images[i][is_primary]) and
 * images to remove (delete_image_ids[i]). JPEG, PNG or WebP.
 */
export async function saveListingImages(
  id: number,
  upload: { file: File; sortOrder: number; primary: boolean }[],
  deleteIds: number[]
): Promise<ApiListing> {
  // Removals first, then ONE request per new photo: a server drops an upload
  // above its size limit without an error, so several photos in one request
  // could silently lose them all (the backend then keeps its default image).
  let latest: ApiListing | null = null
  if (deleteIds.length || upload.length === 0) {
    const form = new FormData()
    deleteIds.forEach((imageId, i) =>
      form.append(`delete_image_ids[${i}]`, String(imageId))
    )
    const res = await apiClient.post<ApiResponse<ApiListing>>(
      listingPath(id),
      form
    )
    latest = res.data.data
  }
  for (const u of upload) {
    const form = new FormData()
    form.append("images[0][file]", u.file)
    form.append("images[0][sort_order]", String(u.sortOrder))
    form.append("images[0][is_primary]", u.primary ? "1" : "0")
    const res = await apiClient.post<ApiResponse<ApiListing>>(
      listingPath(id),
      form
    )
    latest = res.data.data
  }
  return latest as ApiListing
}

/** DELETE /academy/portal/listings/{id}: drafts only (422 otherwise) */
export async function deleteListing(id: number): Promise<void> {
  await apiClient.delete(listingPath(id))
}

/** GET /academy/portal/listings/{id}/intakes (part 1, section 7): earliest first, not paginated */
export async function listIntakes(listingId: number): Promise<ApiIntake[]> {
  const res = await apiClient.get<ApiResponse<ApiIntake[]>>(
    `${listingPath(listingId)}/intakes`
  )
  return res.data.data
}

/** POST /academy/portal/listings/{id}/intakes */
export async function createIntake(
  listingId: number,
  body: IntakeBody
): Promise<ApiIntake> {
  const res = await apiClient.post<ApiResponse<ApiIntake>>(
    `${listingPath(listingId)}/intakes`,
    body
  )
  return res.data.data
}

/** POST /academy/portal/listings/{id}/intakes/{intakeId} */
export async function updateIntake(
  listingId: number,
  intakeId: number,
  body: IntakeBody
): Promise<ApiIntake> {
  const res = await apiClient.post<ApiResponse<ApiIntake>>(
    `${listingPath(listingId)}/intakes/${intakeId}`,
    body
  )
  return res.data.data
}

/** DELETE /academy/portal/listings/{id}/intakes/{intakeId}: refused once a place is taken */
export async function deleteIntake(
  listingId: number,
  intakeId: number
): Promise<void> {
  await apiClient.delete(`${listingPath(listingId)}/intakes/${intakeId}`)
}

/* ---------------- organization and academy forms (W1c) ---------------- */

export type OrganizationUpdate = Partial<{
  name: string
  legal_name: string | null
  type: "club" | "independent_academy"
  country_code: string
  registration_number: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
}>

/** POST /academy/portal/organization: send only the fields that change */
export async function updateOrganization(
  body: OrganizationUpdate
): Promise<ApiOrganization> {
  const res = await apiClient.post<ApiResponse<ApiOrganization>>(
    "/academy/portal/organization",
    body
  )
  return res.data.data
}

/** POST /academy/portal/academies (multipart): creates an academy; 201 */
export async function createAcademy(form: FormData): Promise<ApiAcademy> {
  const res = await apiClient.post<ApiResponse<ApiAcademy>>(
    "/academy/portal/academies",
    form
  )
  return res.data.data
}

/** POST /academy/portal/academies/{id} (multipart): all fields optional, plus delete_image_ids */
export async function updateAcademy(
  id: number,
  form: FormData
): Promise<ApiAcademy> {
  const res = await apiClient.post<ApiResponse<ApiAcademy>>(
    `/academy/portal/academies/${id}`,
    form
  )
  return res.data.data
}

/* ---------------- part 2: verification and listing status (P2a) ---------------- */

/** GET /academy/portal/academies/{id}/verification (contract section 11) */
export type ApiVerification = {
  academy_id: number
  academy_name: string
  academy_slug: string
  city: string
  country_code: string
  verification_status: ApiVerificationStatus
  /** used only when document verification is on; offline null */
  verification_submitted_at: string | null
  verified_at: string | null
  /** the admin's note, shown when rejected */
  verification_note: string | null
  verification_reviewed_at: string | null
  /** offline always []; shown only while verification_documents_enabled is true */
  documents: ApiVerificationDocument[]
}

/** A verification document (part 2, section 11; only when document verification is on) */
export type ApiVerificationDocument = {
  id: number
  /** one of options.verification_document_types */
  type: string
  original_name: string
  status: "pending" | "accepted" | "rejected"
  /** the admin's note on a rejected document */
  note: string | null
  reviewed_at: string | null
  /** admin screens only */
  reviewed_by?: { id: number; name: string } | null
  created_at: string
}

export async function getVerification(
  academyId: number
): Promise<ApiVerification> {
  const res = await apiClient.get<ApiResponse<ApiVerification>>(
    `/academy/portal/academies/${academyId}/verification`
  )
  return res.data.data
}

/**
 * POST /academy/portal/academies/{id}/verification (part 2, section 11),
 * multipart documents[i][type] + documents[i][file] (PDF, JPEG or PNG, up to
 * 10 MB, up to 10 per request). Off in the MVP: call it only when
 * options.verification_documents_enabled is true.
 */
export async function uploadVerificationDocuments(
  academyId: number,
  docs: { type: string; file: File }[]
): Promise<ApiVerification> {
  const form = new FormData()
  docs.forEach((d, i) => {
    form.append(`documents[${i}][type]`, d.type)
    form.append(`documents[${i}][file]`, d.file)
  })
  const res = await apiClient.post<ApiResponse<ApiVerification>>(
    `/academy/portal/academies/${academyId}/verification`,
    form
  )
  return res.data.data
}

/** The academy's download path for one of its verification documents (needs the token) */
export const verificationDocumentPath = (academyId: number, docId: number) =>
  `/academy/portal/academies/${academyId}/verification/documents/${docId}/download`

/** One item of the 422 "not ready to submit" list (section 12) */
export type ApiMissingItem = { field: string; label: string; step: number }

export type ListingAction = "submit" | "pause" | "resume" | "archive"

/**
 * POST /academy/portal/listings/{id}/submit | pause | resume | archive (no body).
 * Returns the listing and the backend's message (shown as the toast).
 */
export async function listingAction(
  id: number,
  action: ListingAction
): Promise<{ listing: ApiListing; message: string }> {
  const res = await apiClient.post<ApiResponse<ApiListing>>(
    `/academy/portal/listings/${id}/${action}`
  )
  return { listing: res.data.data, message: res.data.message }
}

/** The "missing" list of a 422 from submit, or null for any other error */
export function missingItems(error: unknown): ApiMissingItem[] | null {
  const data = (
    error as { response?: { status?: number; data?: { errors?: unknown } } }
  )?.response
  if (data?.status !== 422) return null
  const errors = data.data?.errors as { missing?: unknown } | null | undefined
  if (!errors || !Array.isArray(errors.missing)) return null
  return errors.missing.filter(
    (m): m is ApiMissingItem =>
      typeof m === "object" &&
      m !== null &&
      typeof (m as ApiMissingItem).label === "string" &&
      typeof (m as ApiMissingItem).step === "number"
  )
}
