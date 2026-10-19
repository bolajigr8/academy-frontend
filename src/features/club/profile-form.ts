import { LIVE } from "@/data/live-copy"
import { isEmail, isPhone, isUrl } from "@/features/applications/flow"

import type {
  ApiAcademy,
  ApiImage,
  ApiOrganization,
  OrganizationUpdate,
} from "./api"

/*
 * The organization and academy forms (api mode, delivery W1c; contract
 * sections 3 and 4). Form state, API <-> form conversion, what is sent, checks.
 * No JSX.
 */

/* ---------------- organization ---------------- */

export type OrgDraft = {
  name: string
  legalName: string
  type: "club" | "independent_academy"
  countryCode: string
  registrationNumber: string
  website: string
  contactEmail: string
  contactPhone: string
}

export function orgDraftFrom(o: ApiOrganization): OrgDraft {
  return {
    name: o.name,
    legalName: o.legal_name ?? "",
    type: o.type,
    countryCode: o.country_code,
    registrationNumber: o.registration_number ?? "",
    website: o.website ?? "",
    contactEmail: o.contact_email ?? "",
    contactPhone: o.contact_phone ?? "",
  }
}

const orNull = (v: string) => (v.trim() === "" ? null : v.trim())

/** Only the fields that changed (contract: "Send only the fields that change") */
export function orgChanges(
  saved: ApiOrganization,
  d: OrgDraft
): OrganizationUpdate {
  const next: Required<OrganizationUpdate> = {
    name: d.name.trim(),
    legal_name: orNull(d.legalName),
    type: d.type,
    country_code: d.countryCode,
    registration_number: orNull(d.registrationNumber),
    website: orNull(d.website),
    contact_email: orNull(d.contactEmail),
    contact_phone: orNull(d.contactPhone),
  }
  const out: OrganizationUpdate = {}
  for (const k of Object.keys(next) as (keyof OrganizationUpdate)[]) {
    if (next[k] !== saved[k]) Object.assign(out, { [k]: next[k] })
  }
  return out
}

export const ORG_IDS = {
  name: "org-name",
  legalName: "org-legal",
  type: "org-type",
  country: "org-country",
  registration: "org-reg",
  website: "org-website",
  email: "org-email",
  phone: "org-phone",
} as const

/** Backend field -> control id (422 field errors) */
export const ORG_FIELDS: Record<string, string> = {
  name: ORG_IDS.name,
  legal_name: ORG_IDS.legalName,
  type: ORG_IDS.type,
  country_code: ORG_IDS.country,
  registration_number: ORG_IDS.registration,
  website: ORG_IDS.website,
  contact_email: ORG_IDS.email,
  contact_phone: ORG_IDS.phone,
}

/** The contract's rules, checked before sending */
export function validateOrg(d: OrgDraft): Record<string, string> {
  const t = LIVE.profileForm.errors
  const e: Record<string, string> = {}
  if (!d.name.trim()) e[ORG_IDS.name] = t.orgName
  if (!d.countryCode) e[ORG_IDS.country] = t.country
  if (d.website.trim() && !isUrl(d.website.trim()))
    e[ORG_IDS.website] = t.website
  if (d.contactEmail.trim() && !isEmail(d.contactEmail.trim()))
    e[ORG_IDS.email] = t.email
  if (d.contactPhone.trim() && !isPhone(d.contactPhone.trim()))
    e[ORG_IDS.phone] = t.phone
  return e
}

/* ---------------- academy ---------------- */

export type PickedFile = { file: File; url: string }

export type AcademyDraft = {
  /** null = the organization has no academy yet: saving creates it */
  id: number | null
  name: string
  description: string
  countryCode: string
  city: string
  address: string
  latitude: string
  longitude: string
  facilities: string[]
  policies: string
  logoUrl: string | null
  logo: PickedFile | null
  coverUrl: string | null
  cover: PickedFile | null
  gallery: (
    { kind: "saved"; image: ApiImage } | ({ kind: "new" } & PickedFile)
  )[]
  removedImageIds: number[]
}

export function emptyAcademy(countryCode: string): AcademyDraft {
  return {
    id: null,
    name: "",
    description: "",
    countryCode,
    city: "",
    address: "",
    latitude: "",
    longitude: "",
    facilities: [],
    policies: "",
    logoUrl: null,
    logo: null,
    coverUrl: null,
    cover: null,
    gallery: [],
    removedImageIds: [],
  }
}

export function academyDraftFrom(a: ApiAcademy): AcademyDraft {
  return {
    id: a.id,
    name: a.name,
    description: a.description ?? "",
    countryCode: a.country_code,
    city: a.city,
    address: a.address ?? "",
    // the API sends "40.4168000": shown without the trailing zeros
    latitude: a.latitude === null ? "" : String(Number(a.latitude)),
    longitude: a.longitude === null ? "" : String(Number(a.longitude)),
    facilities: a.facilities,
    policies: a.policies ?? "",
    logoUrl: a.logo_url,
    logo: null,
    coverUrl: a.header_image_url,
    cover: null,
    gallery: [...a.images]
      .sort((x, y) => x.sort_order - y.sort_order)
      .map((image) => ({ kind: "saved" as const, image })),
    removedImageIds: [],
  }
}

export const ACADEMY_IDS = {
  name: "acad-name",
  description: "acad-description",
  country: "acad-country",
  city: "acad-city",
  address: "acad-address",
  latitude: "acad-lat",
  longitude: "acad-lng",
  facilities: "acad-facilities",
  policies: "acad-policies",
  logo: "acad-logo",
  cover: "acad-cover",
  gallery: "acad-gallery",
} as const

export const ACADEMY_FIELDS: Record<string, string> = {
  name: ACADEMY_IDS.name,
  description: ACADEMY_IDS.description,
  country_code: ACADEMY_IDS.country,
  country_name: ACADEMY_IDS.country,
  city: ACADEMY_IDS.city,
  address: ACADEMY_IDS.address,
  latitude: ACADEMY_IDS.latitude,
  longitude: ACADEMY_IDS.longitude,
  facilities: ACADEMY_IDS.facilities,
  policies: ACADEMY_IDS.policies,
  logo: ACADEMY_IDS.logo,
  header_image: ACADEMY_IDS.cover,
  images: ACADEMY_IDS.gallery,
  delete_image_ids: ACADEMY_IDS.gallery,
}

const coord = (v: string, max: number) => {
  const t = v.trim()
  if (t === "") return true
  if (!/^-?\d+(\.\d+)?$/.test(t)) return false
  return Math.abs(Number(t)) <= max
}

export function validateAcademy(d: AcademyDraft): Record<string, string> {
  const t = LIVE.profileForm.errors
  const e: Record<string, string> = {}
  if (!d.name.trim()) e[ACADEMY_IDS.name] = t.academyName
  if (!d.countryCode) e[ACADEMY_IDS.country] = t.country
  if (!d.city.trim()) e[ACADEMY_IDS.city] = t.city
  if (!coord(d.latitude, 90)) e[ACADEMY_IDS.latitude] = t.latitude
  if (!coord(d.longitude, 180)) e[ACADEMY_IDS.longitude] = t.longitude
  if ((d.latitude.trim() === "") !== (d.longitude.trim() === ""))
    e[ACADEMY_IDS.longitude] = t.bothCoordinates
  return e
}

/**
 * The multipart body for create / update. Text fields are always sent (the
 * form shows them all); files only when picked; lists as indexed fields
 * (facilities[0], …) which the contract accepts.
 */
export function academyForm(d: AcademyDraft, countryName: string): FormData {
  const f = new FormData()
  f.append("name", d.name.trim())
  f.append("description", d.description.trim())
  f.append("country_code", d.countryCode)
  f.append("country_name", countryName)
  f.append("city", d.city.trim())
  f.append("address", d.address.trim())
  if (d.latitude.trim() !== "") f.append("latitude", d.latitude.trim())
  if (d.longitude.trim() !== "") f.append("longitude", d.longitude.trim())
  const facilities = d.facilities.map((x) => x.trim()).filter(Boolean)
  // an empty list is sent as a JSON string so the backend can clear it
  if (facilities.length === 0) f.append("facilities", "[]")
  facilities.forEach((x, i) => f.append(`facilities[${i}]`, x))
  f.append("policies", d.policies.trim())
  if (d.logo) f.append("logo", d.logo.file)
  if (d.cover) f.append("header_image", d.cover.file)
  let n = -1
  d.gallery.forEach((g, i) => {
    if (g.kind !== "new") return
    n += 1
    f.append(`images[${n}][file]`, g.file)
    f.append(`images[${n}][sort_order]`, String(i))
    f.append(`images[${n}][is_primary]`, i === 0 ? "1" : "0")
  })
  d.removedImageIds.forEach((imageId, i) =>
    f.append(`delete_image_ids[${i}]`, String(imageId))
  )
  return f
}
