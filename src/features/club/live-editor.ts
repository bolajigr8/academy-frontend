import {
  createIntake,
  createListing,
  deleteIntake,
  deleteListing,
  getListing,
  listIntakes,
  saveListingImages,
  updateIntake,
  updateListing,
  type ApiListing,
  type ApiOptions,
} from "./api"
import {
  draftFromApi,
  imageChanges,
  intakeChanges,
  stepPayload,
  type LiveDraft,
} from "./live-draft"

/*
 * Saving the listing editor in api mode, one step at a time.
 * The first save creates the draft (academy_id + title, plus step 1's text);
 * every later save sends only the current step's fields.
 */

/** The draft fields each step owns (the rest of the form is left as typed) */
const STEP_FIELDS: Record<number, (keyof LiveDraft)[]> = {
  0: ["academyId", "title", "description"],
  1: ["images", "removedImageIds"],
  2: [
    "academyType",
    "playingLevel",
    "gender",
    "trainingFrequency",
    "methodology",
    "competition",
    "schedule",
  ],
  3: ["ageMin", "ageMax"],
  4: [
    "currency",
    "paymentFrequency",
    "price",
    "registrationFee",
    "deposit",
    "optionalServices",
  ],
  5: ["durationValue", "durationUnit", "intakes", "removedIntakeIds"],
  6: ["included", "hasAccommodation", "hasEducation"],
  7: ["requirements", "documents", "questions", "terms"],
}

/**
 * The form after a save: the saved step (and the listing's id, slug and
 * status) from the server's answer, every other step as the person left it.
 */
export function mergeSaved(
  step: number,
  local: LiveDraft,
  saved: ApiListing,
  options: ApiOptions
): LiveDraft {
  const server = draftFromApi(saved, options)
  const next: LiveDraft = {
    ...local,
    id: server.id,
    slug: server.slug,
    status: server.status,
  }
  const owned = new Set<keyof LiveDraft>(STEP_FIELDS[step] ?? [])
  if (local.id === null) STEP_FIELDS[0].forEach((k) => owned.add(k))
  for (const k of owned) Object.assign(next, { [k]: server[k] })
  return next
}

/** Saves one step; returns the listing as the backend now has it */
export async function saveStep(
  step: number,
  d: LiveDraft,
  today: string
): Promise<ApiListing> {
  let id = d.id
  let saved: ApiListing | null = null
  if (id === null) {
    if (d.academyId === null) throw new Error("academy required")
    saved = await createListing({
      ...stepPayload(0, d),
      academy_id: d.academyId,
      title: d.title.trim(),
    })
    id = saved.id
  }
  if (step === 1) {
    const { upload, deleteIds } = imageChanges(d)
    if (upload.length || deleteIds.length)
      saved = await saveListingImages(id, upload, deleteIds)
  } else if (step === 5) {
    // duration first: the intake end dates follow it
    saved = await updateListing(id, stepPayload(5, d))
    const changes = intakeChanges(d, today)
    for (const intakeId of changes.remove) await deleteIntake(id, intakeId)
    for (const u of changes.update) await updateIntake(id, u.id, u.body)
    for (const body of changes.create) await createIntake(id, body)
    // the listing's intakes as saved now (GET …/intakes, part 1 section 7)
    if (changes.remove.length || changes.update.length || changes.create.length)
      saved = { ...saved, intakes: await listIntakes(id) }
  } else if (step !== 0 || d.id !== null) {
    const body = stepPayload(step, d)
    if (Object.keys(body).length) saved = await updateListing(id, body)
  }
  return saved ?? getListing(id)
}

/** Delete a draft listing (the backend refuses any other status with a 422) */
export async function removeDraft(id: number): Promise<void> {
  await deleteListing(id)
}

/* ---------------- step progress (ticks and resume) ---------------- */

/**
 * Which of the 10 steps are done, from what the backend has SAVED (never
 * from the step the user is on). The fields are the backend's submit check
 * (week 1 part 2, section 12), each counted on the step of THIS editor that
 * collects it: the one-line summary (description) is in step 1 and the
 * program length (duration) in step 6, as in the prototype, although the
 * backend's missing list numbers them step 3.
 *   1 title, description      2 an image        3 type, level, training frequency
 *   4 ages and gender          5 price and payment frequency
 *   6 duration and an open intake starting today or later
 *   7 nothing required: done once saved      8 entry requirements
 *   9 done once seen          10 done once the listing left draft or rejection
 */
export function stepsDone(
  l: ApiListing | null,
  today: string,
  progress: EditorProgress
): boolean[] {
  const has = (v: unknown) =>
    v !== null && v !== undefined && String(v).trim() !== ""
  if (!l) return Array.from({ length: 10 }, () => false)
  return [
    has(l.title) && has(l.description),
    l.images.length > 0,
    has(l.academy_type) && has(l.playing_level) && has(l.training_frequency),
    has(l.age_min) && has(l.age_max) && has(l.gender),
    l.price !== null && has(l.payment_frequency),
    has(l.duration_value) &&
      has(l.duration_unit) &&
      l.intakes.some((i) => i.status === "open" && i.start_date >= today),
    progress.saved.includes(6),
    has(l.requirements),
    progress.saved.includes(8),
    l.status !== "draft" && l.status !== "rejected",
  ]
}

/** What the editor remembers per listing in this browser: the last step and the steps saved */
export type EditorProgress = { last: number; saved: number[] }

const progressKey = (id: number) => `gf-editor:${id}`

export function readProgress(id: number | null): EditorProgress {
  const empty = { last: -1, saved: [] }
  if (id === null || typeof window === "undefined") return empty
  try {
    const raw = window.localStorage.getItem(progressKey(id))
    const p = raw ? (JSON.parse(raw) as Partial<EditorProgress>) : null
    return {
      last: Number.isInteger(p?.last) ? Number(p?.last) : -1,
      saved: Array.isArray(p?.saved) ? p.saved.filter(Number.isInteger) : [],
    }
  } catch {
    return empty
  }
}

export function writeProgress(id: number | null, p: EditorProgress) {
  if (id === null || typeof window === "undefined") return
  try {
    window.localStorage.setItem(progressKey(id), JSON.stringify(p))
  } catch {
    // storage full or blocked: progress is only a convenience
  }
}

/** Where a reopened listing starts: the last step worked on, else the first unfinished one */
export function resumeStep(done: boolean[], progress: EditorProgress): number {
  if (progress.last >= 0 && progress.last <= 9) return progress.last
  const firstOpen = done.findIndex((x, i) => !x && i <= 7)
  return firstOpen === -1 ? 8 : firstOpen
}

/**
 * Whether a step holds changes not saved yet: what the step would send now
 * differs from what it would send from the saved listing (photos and start
 * dates: anything to upload, remove, create or update). Preview and Submit
 * hold nothing to save.
 */
export function stepDirty(
  step: number,
  d: LiveDraft,
  saved: ApiListing | null,
  options: ApiOptions,
  today: string
): boolean {
  if (step >= 8) return false
  if (!saved) return step === 0 ? d.title.trim() !== "" : false
  if (step === 1) {
    const c = imageChanges(d)
    return c.upload.length > 0 || c.deleteIds.length > 0
  }
  if (step === 5) {
    const c = intakeChanges(d, today)
    if (c.create.length || c.update.length || c.remove.length) return true
  }
  const base = draftFromApi(saved, options)
  return (
    JSON.stringify(stepPayload(step, d)) !==
    JSON.stringify(stepPayload(step, base))
  )
}
