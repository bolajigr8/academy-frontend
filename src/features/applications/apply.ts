import { DOC_TYPES } from "@/data/catalog"
import type { DocTypeId, Intake, LevelId } from "@/data/types"
import type { EnrichedListing } from "@/features/academies/types"

import { eligibility, isUrl, needsGuardian } from "./flow"
import type { AppStatus, Player } from "./types"

/*
 * Apply to Join (apply.html + js/amk-apply.jsx: STEPS, POSITIONS, validate,
 * profileFrom). Ported as-is; no JSX. Messages are the prototype's, verbatim.
 */

export const STEPS = [
  "Player & start date",
  "Player profile",
  "Academy questions",
  "Documents",
  "Review & submit",
] as const

export const POSITIONS = [
  "Goalkeeper",
  "Centre back",
  "Full back",
  "Defensive midfielder",
  "Central midfielder",
  "Attacking midfielder",
  "Winger",
  "Left winger",
  "Right winger",
  "Striker",
]

/** The player's reusable football profile, as edited in step 2 (all strings) */
export type ApplyProfile = {
  position: string
  foot: string
  currentClub: string
  level: LevelId | ""
  heightCm: string
  video: string
  bio: string
}

/** A document chosen for the application: from the vault or added now */
export type ChosenDoc = { id: string; name: string; fromVault: boolean }

export type ApplyDraft = {
  appId: string | null
  playerId: string | null
  intakeId: string
  optional: string[]
  answers: Record<string, string>
  docs: Partial<Record<DocTypeId, ChosenDoc>>
  profile: ApplyProfile | null
  accurate?: boolean
  guardian?: boolean
}

export function profileFrom(p: Player): ApplyProfile {
  return {
    position: p.position,
    foot: p.foot,
    currentClub: p.currentClub,
    level: p.level,
    heightCm: p.heightCm ? String(p.heightCm) : "",
    video: p.videos && p.videos[0] ? p.videos[0].url : "",
    bio: p.bio || "",
  }
}

type Ctx = {
  l: EnrichedListing
  player: Player | undefined
  intake: Intake | undefined
  today: string
  apps: { intakeId: string; status: AppStatus }[]
}

/** Errors for one step, keyed by the field id */
export function validate(
  step: number,
  draft: ApplyDraft,
  ctx: Ctx
): Record<string, string> {
  const e: Record<string, string> = {}
  const { l, player, intake, today, apps } = ctx
  if (step === 0) {
    if (!player) e["amk-a-player"] = "Choose the player who is applying"
    else {
      const el = eligibility(player, l, intake, today, apps)
      if (!el.ok) e["amk-a-player"] = el.reasons[0]
    }
    if (!intake) e["amk-a-intake"] = "Choose a start date"
  }
  if (step === 1) {
    const p = draft.profile
    if (!p?.position) e["amk-a-position"] = "Choose a main position"
    if (!p?.foot) e["amk-a-foot"] = "Choose the preferred foot"
    if (!String(p?.currentClub || "").trim())
      e["amk-a-club"] = "Enter the current club, or “No club”"
    if (p?.heightCm && (+p.heightCm < 120 || +p.heightCm > 215))
      e["amk-a-height"] = "Enter a height between 120 and 215 cm"
    if (p?.video && !isUrl(p.video))
      e["amk-a-video"] = "Enter a full link starting with https://"
  }
  if (step === 2) {
    l.questions.forEach((q) => {
      const v = String(draft.answers[q.id] || "").trim()
      if (q.required && !v)
        e["amk-q-" + q.id] =
          q.type === "select" ? "Choose an answer" : "Answer this question"
      else if (q.id === "video" && v && !isUrl(v))
        e["amk-q-" + q.id] = "Enter a full link starting with https://"
      else if (q.type === "textarea" && v && v.length < 20)
        e["amk-q-" + q.id] = "Add a little more detail (at least 20 characters)"
    })
  }
  if (step === 3) {
    l.documents.forEach((t) => {
      if (!draft.docs[t])
        e["amk-d-" + t] = "Add the " + DOC_TYPES[t].label.toLowerCase()
    })
  }
  if (step === 4) {
    if (!draft.accurate)
      e["amk-a-accurate"] = "Confirm the information is accurate"
    if (player && needsGuardian(player.dob, today) && !draft.guardian)
      e["amk-a-guardian"] =
        "A parent or guardian must confirm consent for players under 18"
  }
  return e
}

/** Field names for the error summary (the prototype's labels map) */
export function errorLabels(l: EnrichedListing): Record<string, string> {
  const labels: Record<string, string> = {
    "amk-a-player": "Player",
    "amk-a-intake": "Start date",
    "amk-a-position": "Position",
    "amk-a-foot": "Preferred foot",
    "amk-a-club": "Current club",
    "amk-a-height": "Height",
    "amk-a-video": "Video",
    "amk-a-accurate": "Confirmation",
    "amk-a-guardian": "Guardian consent",
  }
  l.questions.forEach((q) => {
    labels["amk-q-" + q.id] = q.label
  })
  l.documents.forEach((t) => {
    labels["amk-d-" + t] = DOC_TYPES[t].label
  })
  return labels
}
