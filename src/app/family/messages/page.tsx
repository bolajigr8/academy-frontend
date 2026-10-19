import type { Metadata } from "next"

import { FAMILY } from "@/data/family-copy"
import { firstParam } from "@/features/auth/demo-login"

import { FamilyMessagesClient } from "./client"

export const metadata: Metadata = { title: FAMILY.messages.title }

/* account/messages.html?thread= */
export default async function FamilyMessagesPage({
  searchParams,
}: PageProps<"/family/messages">) {
  const { thread } = await searchParams
  return <FamilyMessagesClient thread={firstParam(thread) ?? null} />
}
