import type { CrestData } from "@/features/academies/types"
import type { View } from "@/stores/app-store"

import type { Application, Role, ThreadMessage } from "./types"

/** One conversation in an inbox: one per application (AmInbox in js/amk-shell.jsx) */
export type InboxRow = {
  app: Application
  messages: ThreadMessage[]
  last: ThreadMessage | undefined
  /** timestamp of the latest message, status change or creation */
  at: string
  /** notification ids for unread messages in this thread */
  unreadIds: string[]
  /** who the other side is: the applicant for an academy, the academy for a family */
  name: string
  /** program title (and the player's first name for a family) */
  subtitle: string
  avatar:
    | { kind: "initials"; initials: string }
    | { kind: "crest"; crest: CrestData; club: boolean }
  listingTitle: string
}

type Lookup = Pick<
  View,
  | "threads"
  | "listingsById"
  | "playerById"
  | "reads"
  | "familyNotifications"
  | "hostNotifications"
>

/** Conversations that have a message or a status change, newest first. */
export function buildInbox(
  view: Lookup,
  apps: Application[],
  me: Role
): InboxRow[] {
  const notifications =
    me === "family" ? view.familyNotifications : view.hostNotifications
  return apps
    .map((app): InboxRow => {
      const messages = view.threads[app.id] ?? []
      const last = messages[messages.length - 1]
      const lastEvent = app.events[app.events.length - 1]
      const at =
        [last?.at, lastEvent?.at, app.createdAt]
          .filter((x): x is string => Boolean(x))
          .sort()
          .pop() ?? app.createdAt
      const unreadIds = notifications
        .filter(
          (n) => n.appId === app.id && n.type === "message" && !view.reads[n.id]
        )
        .map((n) => n.id)
      const l = view.listingsById[app.listingId]
      const player = app.playerId ? view.playerById[app.playerId] : undefined
      if (me === "academy") {
        const who = app.applicant
        return {
          app,
          messages,
          last,
          at,
          unreadIds,
          name: who ? who.name : `${player?.firstName} ${player?.lastName}`,
          subtitle: l.title,
          avatar: {
            kind: "initials",
            initials: who ? who.initials : (player?.initials ?? ""),
          },
          listingTitle: l.title,
        }
      }
      return {
        app,
        messages,
        last,
        at,
        unreadIds,
        name: l.academy.name,
        subtitle: l.title + (player ? ` · ${player.firstName}` : ""),
        avatar: {
          kind: "crest",
          crest: l.crest,
          club: l.verification === "club",
        },
        listingTitle: l.title,
      }
    })
    .filter((t) => t.last || t.app.events.length)
    .sort((x, y) => (x.at < y.at ? 1 : -1))
}
