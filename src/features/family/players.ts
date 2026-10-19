import type { Player, VaultDoc } from "@/features/applications/types"

/** How complete a player's reusable profile is, in percent (account/players.html completeness) */
export function completeness(p: Player, docs: VaultDoc[]): number {
  const checks = [
    p.dob,
    p.nationality,
    p.location,
    p.position,
    p.foot,
    p.heightCm,
    p.currentClub,
    p.level,
    p.bio,
    (p.seasons || []).length,
    (p.videos || []).length,
    docs.length >= 3,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
