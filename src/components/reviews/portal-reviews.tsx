"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { CardBlock } from "@/components/shared/card-block"
import { FormField } from "@/components/shared/form-field"
import { notify } from "@/components/shared/notify"
import { SectionHead } from "@/components/shared/section-head"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import {
  listPortalReviews,
  replyToReview,
  reviewKeys,
  type ApiPortalReview,
} from "@/features/reviews/api"
import { getApiFieldErrors, getApiStatus } from "@/lib/api/errors"
import { cn } from "@/lib/utils"

import { Stars } from "./stars"

const t = LIVE.reviews

/*
 * The academy's published reviews (week 3 part 2, section 10) on its profile
 * page (#reviews): "To answer" (needs_reply=true) or all, newest first. Each
 * review takes one public reply, which cannot be edited afterwards.
 */
export function PortalReviews() {
  const [tab, setTab] = useState<"reply" | "all">("reply")
  const params = {
    needs_reply: tab === "reply" ? true : undefined,
    per_page: 20,
  }
  const q = useQuery({
    queryKey: reviewKeys.portal(params),
    queryFn: () => listPortalReviews(params),
  })
  // a link from the dashboard (#review-12) scrolls to that review once loaded
  useEffect(() => {
    if (!q.data || typeof window === "undefined") return
    const id = window.location.hash.slice(1)
    if (id.startsWith("review-"))
      document.getElementById(id)?.scrollIntoView({ block: "center" })
  }, [q.data])
  const rows = q.data?.data ?? []
  return (
    <CardBlock aria-labelledby="h-reviews" id="reviews">
      <SectionHead id="h-reviews" title={t.portalTitle} sub={t.portalSub} />
      <div role="tablist" aria-label={t.portalTitle} className="flex gap-2">
        {(["reply", "all"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "min-h-9 rounded-pill border border-border-2 bg-transparent px-4 text-fs-14 font-semibold text-fg-2",
              tab === k && "border-fg-1 bg-fg-1 text-bg-0"
            )}
          >
            {t.tabs[k]}
          </button>
        ))}
      </div>
      {!q.data ? (
        <div
          aria-hidden="true"
          className="h-24 animate-pulse rounded-md bg-bg-2"
        />
      ) : rows.length === 0 ? (
        <p className="text-fs-14 text-fg-3">
          {tab === "reply" ? t.noneToAnswer : t.noneYet}
        </p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => (
            <PortalReview key={r.id} r={r} />
          ))}
        </ul>
      )}
    </CardBlock>
  )
}

function PortalReview({ r }: { r: ApiPortalReview }) {
  const queryClient = useQueryClient()
  const [reply, setReply] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const id = `rev-reply-${r.id}`
  const send = async () => {
    if (!reply.trim()) return setError(t.replyEmpty)
    setError("")
    setBusy(true)
    try {
      await replyToReview(r.id, reply)
      notify(t.replied)
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    } catch (err) {
      setError(getApiFieldErrors(err, { reply: id }).byControl[id] ?? "")
      // already_replied: show the reply that is there
      if (getApiStatus(err) === 422)
        void queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    } finally {
      setBusy(false)
    }
  }
  return (
    <li
      id={`review-${r.id}`}
      className="grid gap-2 rounded-md border border-border-1 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="grid">
          <b className="text-fs-14">{r.author}</b>
          <small className="text-fs-12 text-fg-3">{r.listing.title}</small>
        </span>
        <span className="flex items-center gap-2">
          <Stars value={r.overall} size={13} />
          <small className="text-fs-12 text-fg-3">
            {r.published_at ? DATES.fmt(r.published_at.slice(0, 10)) : ""}
          </small>
        </span>
      </div>
      <p className="text-fs-14 leading-lh-relaxed whitespace-pre-line text-fg-1">
        {r.body}
      </p>
      {r.academy_reply ? (
        <div className="grid gap-1 rounded-md border-l-4 border-border-3 bg-bg-2 p-3">
          <small className="text-fs-12 font-semibold text-fg-3">
            {t.replyLabel}
          </small>
          <p className="text-fs-14 whitespace-pre-line text-fg-1">
            {r.academy_reply}
          </p>
        </div>
      ) : (
        <>
          <FormField
            id={id}
            required
            label={t.replyLabel}
            hint={t.replyHint}
            error={error || undefined}
          >
            {(p) => (
              <Textarea
                {...p}
                rows={3}
                maxLength={2000}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
            )}
          </FormField>
          <Button
            className="justify-self-start"
            size="sm"
            onClick={() => send()}
            aria-busy={busy}
          >
            {t.replySend}
          </Button>
        </>
      )}
    </li>
  )
}
