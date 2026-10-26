"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { CardBlock } from "@/components/shared/card-block"
import { FormField } from "@/components/shared/form-field"
import { Notice } from "@/components/shared/notice"
import { notify } from "@/components/shared/notify"
import { SectionHead } from "@/components/shared/section-head"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { LIVE } from "@/data/live-copy"
import { enrollmentKeys } from "@/features/enrollments/api"
import {
  writeReview,
  type ApiOwnReview,
  type ApiRatings,
} from "@/features/reviews/api"
import { getApiFieldErrors, getApiStatus } from "@/lib/api/errors"

import { StarInput, Stars } from "./stars"

const t = LIVE.reviews
const KEYS = [
  "training",
  "communication",
  "facilities",
  "organization",
] as const
const TONE = {
  pending: "warning",
  published: "success",
  rejected: "ghost",
} as const

/*
 * The family's review of a confirmed enrollment (week 3 part 2, section 10):
 * four ratings 1-5 and 10 to 2,000 characters, once per enrollment. After
 * sending it shows the family's own view in any status: waiting for Golafly,
 * published (with the academy's reply), or not published with the reason.
 */
export function FamilyReview({
  enrollmentId,
  academyName,
  review,
}: {
  enrollmentId: number
  academyName: string
  review: ApiOwnReview | undefined
}) {
  const queryClient = useQueryClient()
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [body, setBody] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  if (review)
    return (
      <CardBlock aria-labelledby="h-review">
        <SectionHead
          id="h-review"
          title={t.yours}
          action={
            <StatusPill tone={TONE[review.status] ?? "ghost"}>
              {t.status[review.status] ?? review.status}
            </StatusPill>
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          <Stars value={review.overall} size={16} />
          <b className="text-fs-14">{review.overall}/5</b>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(160px,100%),1fr))] gap-2">
          {KEYS.map((k) => (
            <li
              key={k}
              className="flex items-center justify-between gap-2 text-fs-13"
            >
              <span className="text-fg-2">{t.categories[k]}</span>
              <Stars value={review.ratings[k]} size={12} />
            </li>
          ))}
        </ul>
        <p className="text-fs-14 leading-lh-relaxed whitespace-pre-line text-fg-1">
          {review.body}
        </p>
        {review.status === "rejected" && review.rejection_reason ? (
          <Notice tone="neutral" icon="info">
            {t.rejectedWhy(review.rejection_reason)}
          </Notice>
        ) : null}
        {review.academy_reply ? (
          <div className="grid gap-1 rounded-md border-l-4 border-border-3 bg-bg-2 p-3">
            <small className="text-fs-12 font-semibold text-fg-3">
              {t.academyReplied}
            </small>
            <p className="text-fs-14 whitespace-pre-line text-fg-1">
              {review.academy_reply}
            </p>
          </div>
        ) : null}
      </CardBlock>
    )

  const send = async () => {
    const e: Record<string, string> = {}
    for (const k of KEYS) if (!ratings[k]) e[`rev-${k}`] = t.chooseRating
    if (body.trim().length < 10) e["rev-body"] = t.bodyShort
    setErrors(e)
    if (Object.keys(e).length) {
      document.getElementById(Object.keys(e)[0])?.focus()
      return
    }
    setBusy(true)
    try {
      await writeReview(enrollmentId, {
        ratings: ratings as unknown as ApiRatings,
        body,
      })
      notify(t.sent)
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    } catch (err) {
      // already_reviewed / enrollment_not_confirmed: the toast says why; show the backend's view
      setErrors(
        getApiFieldErrors(err, {
          "ratings.training": "rev-training",
          "ratings.communication": "rev-communication",
          "ratings.facilities": "rev-facilities",
          "ratings.organization": "rev-organization",
          body: "rev-body",
        }).byControl
      )
      if (getApiStatus(err) === 422)
        void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    } finally {
      setBusy(false)
    }
  }

  return (
    <CardBlock aria-labelledby="h-review">
      <SectionHead id="h-review" title={t.writeTitle} />
      <p className="text-fs-14 leading-lh-relaxed text-fg-2">
        {t.writeLead(academyName)}
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(230px,100%),1fr))] gap-3">
        {KEYS.map((k) => (
          <StarInput
            key={k}
            id={`rev-${k}`}
            label={t.categories[k]}
            value={ratings[k] ?? 0}
            onChange={(n) => setRatings((r) => ({ ...r, [k]: n }))}
            error={errors[`rev-${k}`]}
          />
        ))}
      </div>
      <FormField
        id="rev-body"
        label={t.body}
        hint={t.bodyHint}
        required
        error={errors["rev-body"]}
      >
        {(p) => (
          <Textarea
            {...p}
            rows={4}
            maxLength={2000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        )}
      </FormField>
      <Button
        className="justify-self-start"
        onClick={() => send()}
        aria-busy={busy}
      >
        {t.send}
      </Button>
    </CardBlock>
  )
}
