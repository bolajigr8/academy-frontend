"use client"

import { useInfiniteQuery } from "@tanstack/react-query"

import { Icon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import { listListingReviews, reviewKeys } from "@/features/reviews/api"

import { Stars } from "./stars"

const t = LIVE.reviews
const KEYS = [
  "training",
  "communication",
  "facilities",
  "organization",
] as const

/*
 * The public reviews of a listing (week 3 part 2, section 10): the summary
 * counts every published review (meta.summary, numbers; null without
 * reviews), then the reviews newest first, 10 at a time, each with the
 * academy's reply when there is one. Only "Sofia A." is ever shown.
 */
export function ListingReviews({
  slug,
  academyName,
}: {
  slug: string
  academyName: string
}) {
  const q = useInfiniteQuery({
    queryKey: reviewKeys.listing(slug, 0),
    queryFn: ({ pageParam }) => listListingReviews(slug, pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      (last.meta?.current_page ?? 1) < (last.meta?.last_page ?? 1)
        ? (last.meta?.current_page ?? 1) + 1
        : undefined,
  })
  const first = q.data?.pages[0]
  const summary = first?.meta?.summary
  const reviews = q.data?.pages.flatMap((p) => p.data) ?? []

  if (q.isPending)
    return (
      <div
        aria-hidden="true"
        className="h-24 animate-pulse rounded-md bg-bg-2"
      />
    )
  // a failed request says nothing rather than claiming there are no reviews
  if (q.isError && !first) return null
  if (!summary || summary.count === 0 || summary.averages.overall === null)
    return <p className="text-fs-14 text-fg-3">{t.none}</p>

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-3 rounded-md border border-border-1 bg-bg-2 p-4 le-480:grid-cols-[minmax(0,1fr)]">
        <div className="grid justify-items-start gap-1">
          <b className="font-display text-[40px] leading-none">
            {summary.averages.overall}
          </b>
          <Stars value={summary.averages.overall} size={16} />
          <small className="text-fs-12 text-fg-3">
            {t.based(summary.count)}
          </small>
        </div>
        <ul className="grid gap-1.5">
          {KEYS.map((k) => (
            <li
              key={k}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-fs-13"
            >
              <span className="text-fg-2">{t.categories[k]}</span>
              <Stars value={summary.averages[k] ?? 0} size={12} />
              <b className="w-8 text-right tabular-nums">
                {summary.averages[k] ?? "—"}
              </b>
            </li>
          ))}
        </ul>
      </div>
      <ul className="grid gap-3">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="grid gap-2 rounded-md border border-border-1 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex flex-wrap items-center gap-2">
                <b className="text-fs-14">{r.author}</b>
                {r.verified_enrollment ? (
                  <small className="inline-flex items-center gap-1 text-fs-12 text-fg-3">
                    <Icon name="shieldcheck" size={13} /> {t.verified}
                  </small>
                ) : null}
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
                  {t.replyFrom(academyName)}
                </small>
                <p className="text-fs-14 whitespace-pre-line text-fg-1">
                  {r.academy_reply}
                </p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {q.hasNextPage ? (
        <Button
          variant="secondary"
          className="justify-self-start"
          onClick={() => q.fetchNextPage()}
        >
          {t.more}
        </Button>
      ) : null}
    </div>
  )
}
