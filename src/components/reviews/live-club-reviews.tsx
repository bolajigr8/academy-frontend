"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { EmptyState } from "@/components/shared/empty-state"
import { FormField } from "@/components/shared/form-field"
import { Modal } from "@/components/shared/modal"
import { NativeSelect } from "@/components/shared/native-select"
import { notify } from "@/components/shared/notify"
import { QueryState } from "@/components/shared/query-state"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CLUB } from "@/data/club-copy"
import { LIVE } from "@/data/live-copy"
import { REVIEWS } from "@/data/week3-copy"
import { listAllListings } from "@/features/club/api"
import { clubKeys } from "@/features/club/query-keys"
import { useSession } from "@/features/auth/session"
import {
  listPortalReviews,
  replyToReview,
  reviewKeys,
  type ApiPortalReview,
} from "@/features/reviews/api"
import { getApiFieldErrors } from "@/lib/api/errors"

import { ReviewItem } from "./review-item"

type Show = "all" | "waiting" | "answered"

/*
 * The academy's Reviews page (week 3 part 2, section 10): the published
 * reviews about its academies, newest first, with one public reply each.
 * A reply cannot be edited, so the dialog says so before it is sent.
 */
export function LiveClubReviews() {
  const t = REVIEWS
  const { user } = useSession()
  const enabled = user?.role === "academy"
  const [listing, setListing] = useState("")
  const [show, setShow] = useState<Show>("all")
  const [page, setPage] = useState(1)
  const [replying, setReplying] = useState<ApiPortalReview | null>(null)

  const filters = {
    listing_id: listing ? Number(listing) : undefined,
    needs_reply: show === "all" ? undefined : show === "waiting",
    page,
  }
  const listings = useQuery({
    queryKey: clubKeys.listings(),
    queryFn: listAllListings,
    enabled,
  })
  const query = useQuery({
    queryKey: reviewKeys.portal(filters),
    queryFn: () => listPortalReviews(filters),
    enabled,
  })
  const last = query.data?.meta.last_page ?? 1
  const filtered = listing !== "" || show !== "all"

  return (
    <>
      <PageHeading title={t.pageTitle} subtitle={t.pageSub} />
      <div className="flex flex-wrap items-center gap-[10px]">
        <NativeSelect
          aria-label={t.listingFilter}
          value={listing}
          onChange={(e) => {
            setListing(e.target.value)
            setPage(1)
          }}
          className="w-auto min-w-[220px]"
        >
          <option value="">{t.allListings}</option>
          {(listings.data ?? []).map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t.statusFilter}
          value={show}
          onChange={(e) => {
            setShow(e.target.value as Show)
            setPage(1)
          }}
          className="w-auto min-w-[200px]"
        >
          <option value="all">{t.filterAll}</option>
          <option value="waiting">{t.filterNeedsReply}</option>
          <option value="answered">{t.filterAnswered}</option>
        </NativeSelect>
      </div>
      <QueryState
        query={{ ...query, data: query.data?.data }}
        errorFallback={LIVE.requestFailed}
        skeleton={<div className="h-48 animate-pulse rounded-md bg-bg-2" />}
        empty={
          <EmptyState
            icon="star"
            title={t.pageTitle}
            text={filtered ? t.emptyFiltered : t.empty}
          />
        }
      >
        {(rows) => (
          <ul className="grid gap-4">
            {rows.map((r) => (
              <li key={r.id} className="grid gap-2">
                <p className="text-fs-13 font-semibold text-fg-3">
                  {r.listing.title}
                </p>
                <ReviewItem
                  r={r}
                  footer={
                    r.academy_reply ? null : (
                      <div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setReplying(r)}
                        >
                          <Icon name="chat" size={15} /> {t.reply}
                        </Button>
                      </div>
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </QueryState>
      {last > 1 ? (
        <nav
          aria-label={LIVE.search.page(page, last)}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <Icon name="arrowl" size={16} /> {LIVE.search.previous}
          </Button>
          <span className="text-fs-14 text-fg-2">
            {LIVE.search.page(page, last)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= last}
            onClick={() => setPage((p) => p + 1)}
          >
            {LIVE.search.next} <Icon name="arrow" size={16} />
          </Button>
        </nav>
      ) : null}
      {replying ? (
        <ReplyDialog review={replying} onClose={() => setReplying(null)} />
      ) : null}
    </>
  )
}

function ReplyDialog({
  review,
  onClose,
}: {
  review: ApiPortalReview
  onClose: () => void
}) {
  const t = REVIEWS
  const queryClient = useQueryClient()
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const send = async () => {
    if (!text.trim()) return setError(t.replyEmpty)
    setError("")
    setBusy(true)
    try {
      await replyToReview(review.id, text)
      notify(t.replied)
      await queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      onClose()
    } catch (e) {
      const { byControl } = getApiFieldErrors(e, { reply: "rev-reply" })
      setError(byControl["rev-reply"] ?? "")
      // already replied (422) or no longer published: show what the backend has
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t.replyTitle(review.author)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {CLUB.decision.cancel}
          </Button>
          <Button
            onClick={() => send()}
            disabled={busy}
            aria-busy={busy}
            data-autofocus
          >
            {t.replySend}
          </Button>
        </>
      }
    >
      <p className="rounded-sm border border-border-2 bg-bg-2 p-3 text-fs-14 leading-lh-relaxed whitespace-pre-line text-fg-2">
        {review.body}
      </p>
      <FormField
        id="rev-reply"
        label={t.replyLabel}
        hint={t.replyHint}
        required
        error={error || undefined}
      >
        {(p) => (
          <Textarea
            {...p}
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
          />
        )}
      </FormField>
    </Modal>
  )
}
