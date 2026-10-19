import type { LevelId } from "@/data/types"
import type { View } from "@/stores/app-store"

import type { Application, Guardian, Player } from "./types"

/** The player as an academy sees them (applicantOf in js/amk-host.jsx) */
export type ApplicantView = {
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
  /** only for applications sent from the demo family's reusable profile */
  player: Player | null
}

type Lookup = Pick<View, "playerById" | "parent">

export function applicantOf(a: Application, view: Lookup): ApplicantView {
  if (a.applicant) {
    const x = a.applicant
    return {
      name: x.name,
      initials: x.initials,
      dob: x.dob,
      nationality: x.nationality,
      position: x.position,
      foot: x.foot,
      heightCm: x.heightCm,
      club: x.club,
      level: x.level,
      guardian: x.guardian,
      video: x.video,
      player: null,
    }
  }
  const p = view.playerById[a.playerId ?? ""]
  return {
    name: `${p.firstName} ${p.lastName}`,
    initials: p.initials,
    dob: p.dob,
    nationality: p.nationality,
    position: p.position,
    foot: p.foot,
    heightCm: p.heightCm,
    club: p.currentClub,
    level: p.level,
    guardian: {
      name: `${view.parent.firstName} ${view.parent.lastName}`,
      email: view.parent.email,
    },
    video: p.videos[0]?.url ?? "",
    player: p,
  }
}
