"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useRef, useState } from "react"

import { Icon, type IconName } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { EMPTY } from "@/data/copy"
import { fmtStamp } from "@/features/applications/flow"
import { useSession } from "@/features/auth/session"
import { stampOf } from "@/features/messages/conversations"
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
  type ApiNotification,
} from "@/features/notifications/api"
import { useDismiss } from "@/hooks/use-dismiss"
import { cn } from "@/lib/utils"
import { DEMO_CHROME, isLive } from "@/lib/data-source"
import { routes } from "@/routes"
import { useAppView } from "@/stores/hooks"
import { getAppStore } from "@/stores/instance"

export type Persona = "family" | "club"

const iconFor = (type: string): IconName =>
  type === "message"
    ? "chat"
    : type === "enrollment_pending"
      ? "wallet"
      : type === "accepted" || type === "enrolled"
        ? "checkcircle"
        : "bell"

/* Notifications popover: js/amk-shell.jsx, css/amk-app.css:64-76 */
export function Notifications({ persona }: { persona: Persona }) {
  return isLive("messages") ? (
    <LiveNotifications persona={persona} />
  ) : (
    <DemoNotifications persona={persona} />
  )
}

function DemoNotifications({ persona }: { persona: Persona }) {
  const view = useAppView()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, ref)

  // api mode: notifications come from the backend (batch 4); until then the
  // list is empty rather than showing demo items next to real data
  const list = !DEMO_CHROME
    ? []
    : persona === "club"
      ? view.hostNotifications
      : view.familyNotifications
  const unread = list.filter((n) => !view.reads[n.id])
  const hrefFor = (appId: string) =>
    persona === "club"
      ? routes.club.applicant(appId)
      : routes.family.application(appId)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        aria-label={
          "Notifications" +
          (unread.length ? ", " + unread.length + " unread" : "")
        }
        className="relative grid size-[42px] place-items-center rounded-full border border-border-2 bg-surface-elevated p-0 text-fg-1 hover:border-border-accent"
      >
        <Icon name="bell" size={19} />
        {unread.length > 0 ? (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-pill border-2 border-bg-1 bg-gf-neon px-[5px] font-mono text-[10px] font-bold text-primary-foreground">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-[calc(100%+10px)] right-0 z-(--amk-z-overlay) max-h-[70vh] w-[min(380px,calc(100vw-32px))] animate-[rise_var(--dur-base)_var(--ease-out)] overflow-auto rounded-md border border-border-2 bg-surface-elevated shadow-(--shadow-xl)"
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-border-1 bg-surface-elevated px-[14px] py-3">
            <b>Notifications</b>
            {unread.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => getAppStore().markRead(unread.map((n) => n.id))}
              >
                Mark all as read
              </Button>
            ) : null}
          </div>
          {list.length === 0 ? (
            <p className="p-6 text-fs-14 text-fg-3">
              {EMPTY.notifications.title}
            </p>
          ) : (
            <ul className="p-1.5">
              {list.slice(0, 12).map((n) => {
                const app = view.appsById[n.appId]
                const listing = app ? view.listingsById[app.listingId] : null
                const who =
                  persona === "club"
                    ? (app?.applicant?.name ??
                      (app?.playerId
                        ? view.playerById[app.playerId]?.firstName
                        : undefined))
                    : listing?.academy.name
                const isUnread = !view.reads[n.id]
                return (
                  <li key={n.id}>
                    <Link
                      href={hrefFor(n.appId)}
                      onClick={() => {
                        getAppStore().markRead([n.id])
                        close()
                      }}
                      className="grid grid-cols-[auto_minmax(0,1fr)] gap-[10px] rounded-[8px] p-[10px] hover:bg-tint-neon-2"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-8 place-items-center rounded-full bg-bg-3"
                      >
                        <Icon name={iconFor(n.type)} size={16} />
                      </span>
                      <span className="grid gap-px">
                        <b
                          className={cn(
                            "text-fs-13",
                            isUnread &&
                              "after:ml-1.5 after:inline-block after:size-[7px] after:rounded-full after:bg-gf-neon after:align-[1px] after:shadow-[0_0_0_1px_var(--fg-1)] after:content-['']"
                          )}
                        >
                          {n.title}
                        </b>
                        <small className="text-fs-12 text-fg-3">
                          {who}
                          {listing ? " · " + listing.title : ""}
                        </small>
                        <small className="text-fs-12 text-fg-3">
                          {fmtStamp(n.at)}
                        </small>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

/** The prototype's icons for the backend's notification types */
const liveIcon = (type: string): IconName =>
  type === "new_message"
    ? "chat"
    : type === "application_accepted" ||
        type === "listing_approved" ||
        type === "academy_verified"
      ? "checkcircle"
      : type === "information_requested" ||
          type === "listing_changes_needed" ||
          type === "academy_verification_needs_attention"
        ? "alert"
        : "bell"

/** The screen a notification opens (section 15: target {type, id}) */
function liveHref(n: ApiNotification, persona: Persona): string | null {
  const t = n.target
  if (!t) return null
  const id = String(t.id)
  if (t.type === "application") {
    if (n.type === "new_message")
      return persona === "club"
        ? `${routes.club.messages}?thread=${encodeURIComponent(id)}`
        : routes.family.messages(id)
    return persona === "club"
      ? routes.club.applicant(id)
      : routes.family.application(id)
  }
  if (t.type === "listing" && persona === "club")
    return routes.club.editListing(id)
  if (t.type === "academy" && persona === "club") return routes.club.profile
  return null
}

/*
 * The bell in api mode (week 2 part 2, section 15): GET /academy/me/notifications
 * (newest first, meta.unread_count for the badge), polled every minute and
 * when the window regains focus. Opening one marks it read
 * (POST …/{id}/read) and goes to its screen; "Mark all as read" calls
 * POST …/read-all. The wording (title, text) is the backend's.
 */
function LiveNotifications({ persona }: { persona: Persona }) {
  const { user } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, ref)
  const query = useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => listNotifications(20),
    enabled: user !== null && user.role !== "admin",
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
  const list = query.data?.data ?? []
  const unreadCount = query.data?.meta?.unread_count ?? 0
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all })

  const openOne = (n: ApiNotification) => {
    if (!n.read_at)
      void markNotificationRead(n.id)
        .then(refresh)
        .catch(() => undefined)
    const href = liveHref(n, persona)
    close()
    if (href) router.push(href)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          if (!open) refresh()
          setOpen(!open)
        }}
        aria-label={
          "Notifications" + (unreadCount ? ", " + unreadCount + " unread" : "")
        }
        className="relative grid size-[42px] place-items-center rounded-full border border-border-2 bg-surface-elevated p-0 text-fg-1 hover:border-border-accent"
      >
        <Icon name="bell" size={19} />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-pill border-2 border-bg-1 bg-gf-neon px-[5px] font-mono text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-[calc(100%+10px)] right-0 z-(--amk-z-overlay) max-h-[70vh] w-[min(380px,calc(100vw-32px))] animate-[rise_var(--dur-base)_var(--ease-out)] overflow-auto rounded-md border border-border-2 bg-surface-elevated shadow-(--shadow-xl)"
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-border-1 bg-surface-elevated px-[14px] py-3">
            <b>Notifications</b>
            {unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllNotificationsRead().then(refresh)}
              >
                Mark all as read
              </Button>
            ) : null}
          </div>
          {list.length === 0 ? (
            <p className="p-6 text-fs-14 text-fg-3">
              {query.isPending ? "…" : EMPTY.notifications.title}
            </p>
          ) : (
            <ul className="p-1.5">
              {list.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openOne(n)}
                    className="grid w-full grid-cols-[auto_minmax(0,1fr)] gap-[10px] rounded-[8px] border-0 bg-transparent p-[10px] text-left hover:bg-tint-neon-2"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-8 place-items-center rounded-full bg-bg-3"
                    >
                      <Icon name={liveIcon(n.type)} size={16} />
                    </span>
                    <span className="grid min-w-0 gap-px">
                      <b
                        className={cn(
                          "text-fs-13",
                          !n.read_at &&
                            "after:ml-1.5 after:inline-block after:size-[7px] after:rounded-full after:bg-gf-neon after:align-[1px] after:shadow-[0_0_0_1px_var(--fg-1)] after:content-['']"
                        )}
                      >
                        {n.title}
                        {!n.read_at ? (
                          <span className="am-sr"> (unread)</span>
                        ) : null}
                      </b>
                      {n.text ? (
                        <small className="text-fs-12 [overflow-wrap:anywhere] text-fg-3">
                          {n.text}
                        </small>
                      ) : null}
                      <small className="text-fs-12 text-fg-3">
                        {fmtStamp(stampOf(n.created_at))}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
