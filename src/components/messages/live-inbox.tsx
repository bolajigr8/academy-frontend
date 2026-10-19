"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { useEffect, useState, type ReactNode } from "react"

import { Icon } from "@/components/icons/icon"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { ClubCrest } from "@/components/shared/club-crest"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { EMPTY } from "@/data/copy"
import { LIVE } from "@/data/live-copy"
import { crestFor } from "@/features/academies/search"
import { STATUS } from "@/features/applications/flow"
import type { ThreadSide } from "@/features/messages/api"
import {
  listConversations,
  messagesKeys,
  stampOf,
} from "@/features/messages/conversations"
import { useMedia } from "@/hooks/use-media"
import { spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

import { LiveThread } from "./live-thread"

const t = LIVE.messages

/*
 * Messages in api mode (week 2 part 2, section 14), drawn like the
 * prototype's AmInbox. The list comes from the application lists (family:
 * GET /academy/me/applications; academy: the inbox), which carry
 * unread_messages and last_message; it is fetched again whenever the page is
 * opened or the window regains focus, and after reading or sending. The open
 * thread polls every 7 seconds. ?thread=<id> opens one conversation.
 */
export function LiveInbox({
  side,
  hrefApp,
  initialThread,
  emptyCta,
}: {
  side: ThreadSide
  hrefApp: (id: string) => string
  initialThread: string | null
  emptyCta?: ReactNode
}) {
  const wide = useMedia("(min-width: 1025px)")
  const list = useQuery({
    queryKey: messagesKeys.list(side),
    queryFn: () => listConversations(side),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  })
  const rows = list.data ?? []
  const [sel, setSel] = useState<number | null>(
    initialThread && /^\d+$/.test(initialThread) ? Number(initialThread) : null
  )
  const cur =
    rows.find((r) => r.id === sel) ??
    (sel === null && wide ? rows[0] : undefined)
  const curId = cur?.id ?? null

  useEffect(() => {
    if (curId !== null)
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?thread=${curId}`
      )
  }, [curId])

  if (list.isError && !list.data)
    return (
      <ErrorState
        message={LIVE.requestFailed}
        onRetry={() => void list.refetch()}
      />
    )
  if (!list.data)
    return (
      <div
        aria-hidden="true"
        className="h-[560px] animate-pulse rounded-lg border border-border-1 bg-bg-2"
      />
    )
  if (!rows.length)
    return (
      <EmptyState
        icon="chat"
        title={EMPTY.messages.title}
        text={EMPTY.messages.text}
        cta={emptyCta}
      />
    )

  const detail = Boolean(cur && sel !== null)

  return (
    <div className="grid min-h-[560px] grid-cols-[minmax(0,5fr)_minmax(0,8fr)] overflow-hidden rounded-lg border border-border-1 bg-surface-elevated le-1024:grid-cols-[minmax(0,1fr)]">
      <ul
        aria-label={t.conversations}
        className={cn(
          "relative max-h-[72vh] overflow-y-auto border-r border-border-1 le-1024:max-h-none le-1024:border-r-0",
          detail && "le-1024:hidden"
        )}
      >
        {rows.map((r) => {
          const on = cur?.id === r.id
          const unread = r.unread > 0
          const preview = r.last
            ? (r.last.mine ? t.youPrefix : "") +
              (r.last.body ?? (r.last.hasAttachment ? t.attachment : ""))
            : STATUS[r.status].label
          return (
            <li key={r.id}>
              <motion.button
                whileTap={{ scale: 0.99, transition: spring }}
                type="button"
                onClick={() => setSel(r.id)}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-0 border-b border-border-1 bg-transparent px-4 py-[14px] text-left hover:bg-tint-neon-1",
                  on &&
                    "bg-bg-3 shadow-[inset_3px_0_0_var(--gf-neon)] hover:bg-bg-3"
                )}
              >
                <>
                  {side === "portal" ? (
                    <AvatarInitials
                      initials={r.initials}
                      size={40}
                      tone="soft"
                    />
                  ) : (
                    <ClubCrest
                      crest={crestFor({
                        id: r.academySlug ?? r.name,
                        name: r.name,
                      })}
                      size={36}
                    />
                  )}
                  <span className="grid min-w-0 gap-0.5">
                    <b
                      className={cn(
                        "truncate text-fs-14",
                        unread && "font-bold text-fg-1"
                      )}
                    >
                      {r.name}
                    </b>
                    <small className="truncate text-fs-12 text-fg-3">
                      {r.subtitle}
                    </small>
                    <span
                      className={cn(
                        "flex min-w-0 items-center gap-1 text-fs-13 text-fg-2",
                        unread && "font-bold text-fg-1"
                      )}
                    >
                      {r.last?.hasAttachment ? (
                        <Icon name="clip" size={12} className="flex-none" />
                      ) : null}
                      <span className="truncate">{preview}</span>
                    </span>
                  </span>
                  <span className="grid justify-items-end gap-1.5">
                    <small className="text-[11px] whitespace-nowrap text-fg-3">
                      {r.at ? DATES.fmtShort(stampOf(r.at).slice(0, 10)) : ""}
                    </small>
                    {unread ? (
                      <i
                        aria-label={`${t.unread}: ${r.unread}`}
                        className="grid h-[18px] min-w-[18px] place-items-center rounded-[99px] bg-gf-neon px-[5px] text-[10px] font-bold text-text-on-neon not-italic"
                      >
                        {r.unread}
                      </i>
                    ) : null}
                  </span>
                </>
              </motion.button>
            </li>
          )
        })}
      </ul>
      <section
        aria-label={t.conversation}
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
                <Icon name="arrowl" size={16} /> {t.allMessages}
              </Button>
              <div className="grid min-w-40 flex-1">
                <b className="[overflow-wrap:anywhere]">{cur.name}</b>
                <small className="text-fs-12 text-fg-3">
                  {cur.listingTitle}
                  {cur.reference ? ` · ${cur.reference}` : ""}
                </small>
              </div>
              <StatusBadge status={cur.status} />
              <ButtonLink
                href={hrefApp(String(cur.id))}
                variant="secondary"
                size="sm"
              >
                {t.openApplication}
              </ButtonLink>
            </div>
            <LiveThread key={cur.id} side={side} applicationId={cur.id} />
          </>
        ) : (
          <div className="grid place-content-center justify-items-center gap-2 text-fg-3">
            <Icon name="chat" size={28} />
            <p>{t.choose}</p>
          </div>
        )}
      </section>
    </div>
  )
}
