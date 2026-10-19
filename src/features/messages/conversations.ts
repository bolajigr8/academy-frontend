import { listInbox, type ApiInboxItem } from "@/features/club/applications-api"
import {
  listApplications,
  type ApiAppStatus,
  type ApiAppSummary,
} from "@/features/family/api"

import type { ThreadSide } from "./api"

/**
 * One row of the Messages list, for either side (week 2 part 2, section 14):
 * built from the application lists, which carry unread_messages and
 * last_message. Drafts have no conversation (it starts when the application
 * is sent), so they are not listed.
 */
export type ConversationRow = {
  id: number
  /** family: the academy; academy: the player */
  name: string
  subtitle: string
  listingTitle: string
  reference: string | null
  status: ApiAppStatus
  unread: number
  last: { body: string | null; hasAttachment: boolean; mine: boolean } | null
  /** ISO time of the last message, else of the last activity */
  at: string
  /** academy side: the player's initials; family side: the academy (crest) */
  initials: string
  academySlug: string | null
}

const initialsOf = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()

export function rowFromFamily(a: ApiAppSummary): ConversationRow {
  return {
    id: a.id,
    name: a.listing.academy.name,
    subtitle: `${a.player.first_name} ${a.player.last_name} · ${a.listing.title}`,
    listingTitle: a.listing.title,
    reference: a.reference,
    status: a.status,
    unread: a.unread_messages,
    last: a.last_message
      ? {
          body: a.last_message.body,
          hasAttachment: a.last_message.has_attachment,
          mine: a.last_message.sender_side === "applicant",
        }
      : null,
    at: a.last_message?.sent_at ?? a.updated_at ?? a.submitted_at ?? "",
    initials: initialsOf(a.player.first_name, a.player.last_name),
    academySlug: a.listing.academy.slug ?? null,
  }
}

export function rowFromInbox(a: ApiInboxItem): ConversationRow {
  return {
    id: a.id,
    name: `${a.player.first_name} ${a.player.last_name}`,
    subtitle: a.listing.title,
    listingTitle: a.listing.title,
    reference: a.reference,
    status: a.status,
    unread: a.unread_messages,
    last: a.last_message
      ? {
          body: a.last_message.body,
          hasAttachment: a.last_message.has_attachment,
          mine: a.last_message.sender_side === "academy",
        }
      : null,
    at: a.last_message?.sent_at ?? a.updated_at ?? a.submitted_at ?? "",
    initials: initialsOf(a.player.first_name, a.player.last_name),
    academySlug: null,
  }
}

/** Up to 200 conversations (4 pages of 50), most recent activity first, as the API orders them */
export async function listConversations(
  side: ThreadSide,
  /** the sidebar badge loads this in the background: no toast on failure */
  silent = false
): Promise<ConversationRow[]> {
  const rows: ConversationRow[] = []
  for (let page = 1; page <= 4; page++) {
    if (side === "me") {
      const res = await listApplications({ page, per_page: 50 }, silent)
      rows.push(
        ...res.data.filter((a) => a.status !== "draft").map(rowFromFamily)
      )
      if (page >= (res.meta?.last_page ?? 1)) break
    } else {
      // the inbox never contains drafts
      const res = await listInbox({ page, per_page: 50 }, silent)
      rows.push(...res.data.map(rowFromInbox))
      if (page >= (res.meta?.last_page ?? 1)) break
    }
  }
  return rows
}

/** ISO 8601 -> "YYYY-MM-DD HH:MM" in the viewer's time, the prototype's stamp format */
export function stampOf(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export const messagesKeys = {
  all: ["messages"] as const,
  list: (side: ThreadSide) => [...messagesKeys.all, "list", side] as const,
  thread: (side: ThreadSide, id: number) =>
    [...messagesKeys.all, "thread", side, id] as const,
}
