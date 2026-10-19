import type { Metadata } from "next"

import { FAMILY } from "@/data/family-copy"
import { firstParam } from "@/features/auth/demo-login"

import { FamilyPlayersClient } from "./client"

export const metadata: Metadata = { title: FAMILY.players.title }

/* account/players.html?id= */
export default async function FamilyPlayersPage({
  searchParams,
}: PageProps<"/family/players">) {
  const { id } = await searchParams
  return <FamilyPlayersClient id={firstParam(id) ?? "player-tobi"} />
}
