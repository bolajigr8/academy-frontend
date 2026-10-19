import type { Metadata } from "next"

import { ClubMessagesClient } from "./client"
import { firstParam } from "@/features/auth/demo-login"

export const metadata: Metadata = { title: "Messages · Academy" }

export default async function ClubMessagesPage({
  searchParams,
}: PageProps<"/club/messages">) {
  const { thread } = await searchParams
  return <ClubMessagesClient thread={firstParam(thread) ?? null} />
}
