"use client"

import { motion } from "framer-motion"
import { useEffect, useState, type ReactNode } from "react"

import { Icon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { EMPTY } from "@/data/copy"
import { markRead } from "@/features/applications/actions"
import { STATUS } from "@/features/applications/flow"
import type { InboxRow } from "@/features/applications/inbox"
import type { Actor } from "@/features/applications/types"
import { useMedia } from "@/hooks/use-media"
import { spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

import { AvatarInitials } from "./avatar-initials"
import { ClubCrest } from "./club-crest"
import { EmptyState } from "./empty-state"
import { MessageThread } from "./message-thread"
import { StatusBadge } from "./status-badge"

type Props = {
  rows: InboxRow[]
  me: Actor
  meName: string
  /** where "Open application" goes */
  hrefApp: (appId: string) => string
  emptyCta?: ReactNode
  /** the conversation named in ?thread= */
  initialThread?: string | null
}

/* AmInbox + .amk-inbox*: js/amk-shell.jsx, css/amk-app.css:160-179 */
export function Inbox({
  rows,
  me,
  meName,
  hrefApp,
  emptyCta,
  initialThread,
}: Props) {
  const wide = useMedia("(min-width: 1025px)")
  const [sel, setSel] = useState<string | null>(
    initialThread && rows.some((r) => r.app.id === initialThread)
      ? initialThread
      : null
  )
  const cur =
    rows.find((r) => r.app.id === sel) ??
    (sel === null && wide ? rows[0] : undefined)
  const curId = cur?.app.id ?? null
  const unreadKey = cur ? cur.unreadIds.join("|") : ""

  useEffect(() => {
    if (unreadKey) markRead(unreadKey.split("|"))
    if (curId)
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?thread=${encodeURIComponent(curId)}`
      )
  }, [curId, unreadKey])

  if (!rows.length)
    return (
      <EmptyState
        icon="chat"
        title={EMPTY.messages.title}
        text={EMPTY.messages.text}
        cta={emptyCta}
      />
    )

  const detail = Boolean(cur && sel)

  return (
    <div className="grid min-h-[560px] grid-cols-[minmax(0,5fr)_minmax(0,8fr)] overflow-hidden rounded-lg border border-border-1 bg-surface-elevated le-1024:grid-cols-[1fr]">
      <ul
        aria-label="Conversations"
        className={cn(
          "relative max-h-[72vh] overflow-y-auto border-r border-border-1 le-1024:max-h-none le-1024:border-r-0",
          detail && "le-1024:hidden"
        )}
      >
        {rows.map((r) => {
          const on = cur?.app.id === r.app.id
          const unread = r.unreadIds.length > 0
          return (
            <li key={r.app.id}>
              <motion.button
                whileTap={{ scale: 0.99, transition: spring }}
                type="button"
                onClick={() => setSel(r.app.id)}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-0 border-b border-border-1 bg-transparent px-4 py-[14px] text-left hover:bg-tint-neon-1",
                  on &&
                    "bg-bg-3 shadow-[inset_3px_0_0_var(--gf-neon)] hover:bg-bg-3"
                )}
              >
                {r.avatar.kind === "initials" ? (
                  <AvatarInitials
                    initials={r.avatar.initials}
                    size={40}
                    tone="soft"
                  />
                ) : (
                  <ClubCrest
                    crest={r.avatar.crest}
                    size={36}
                    club={r.avatar.club}
                  />
                )}
                <span className="grid min-w-0 gap-0.5">
                  <b
                    className={cn(
                      "text-fs-14",
                      unread && "font-bold text-fg-1"
                    )}
                  >
                    {r.name}
                  </b>
                  <small className="text-fs-12 text-fg-3">{r.subtitle}</small>
                  <span
                    className={cn(
                      "truncate text-fs-13 text-fg-2",
                      unread && "font-bold text-fg-1"
                    )}
                  >
                    {r.last
                      ? (r.last.from === me ? "You: " : "") + r.last.text
                      : STATUS[r.app.status].label}
                  </span>
                </span>
                <span className="grid justify-items-end gap-1.5">
                  <small className="text-[11px] text-fg-3">
                    {DATES.fmtShort(r.at.split(" ")[0])}
                  </small>
                  {unread ? (
                    <i
                      aria-label="Unread"
                      className="grid h-[18px] min-w-[18px] place-items-center rounded-[99px] bg-gf-neon px-[5px] text-[10px] font-bold text-text-on-neon not-italic"
                    >
                      {r.unreadIds.length}
                    </i>
                  ) : null}
                </span>
              </motion.button>
            </li>
          )
        })}
      </ul>
      <section
        aria-label="Conversation"
        className={cn(
          "grid min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 p-4",
          detail ? "le-1024:grid" : "le-1024:hidden"
        )}
      >
        {cur ? (
          <>
            <div className="flex flex-wrap items-center gap-[10px] border-b border-border-1 pb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSel(null)}
                className="hidden le-1024:inline-flex le-1024:w-full le-1024:justify-start"
              >
                <Icon name="arrowl" size={16} /> All messages
              </Button>
              <div className="grid min-w-40 flex-1">
                <b>{cur.name}</b>
                <small className="text-fs-12 text-fg-3">
                  {cur.listingTitle} · {cur.app.ref || "Draft"}
                </small>
              </div>
              <StatusBadge status={cur.app.status} />
              <ButtonLink
                href={hrefApp(cur.app.id)}
                variant="secondary"
                size="sm"
              >
                Open application
              </ButtonLink>
            </div>
            <MessageThread
              key={cur.app.id}
              app={cur.app}
              messages={cur.messages}
              me={me}
              meName={meName}
            />
          </>
        ) : (
          <div className="grid place-content-center justify-items-center gap-2 text-fg-3">
            <Icon name="chat" size={28} />
            <p>Choose a conversation</p>
          </div>
        )}
      </section>
    </div>
  )
}
