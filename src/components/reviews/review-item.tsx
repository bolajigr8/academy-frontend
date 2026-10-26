import { AvatarInitials } from "@/components/shared/avatar-initials"
import { Tag } from "@/components/shared/tag"
import { Icon } from "@/components/icons/icon"
import { DATES } from "@/data/catalog"
import { REVIEWS } from "@/data/week3-copy"
import type { ApiReview } from "@/features/reviews/api"

import { StarsRow } from "./rating-stars"

const day = (iso: string) => DATES.fmt(iso.slice(0, 10))

/** A published review with its four ratings and the academy's reply, if any */
export function ReviewItem({
  r,
  footer,
}: {
  r: ApiReview
  /** the academy's Reply button */
  footer?: React.ReactNode
}) {
  return (
    <article className="grid gap-[10px] rounded-md border border-border-1 p-[18px]">
      <div className="flex flex-wrap items-center gap-[10px]">
        <AvatarInitials
          initials={r.author
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
          size={40}
          tone="soft"
        />
        <div className="grid min-w-[120px] flex-1">
          <b>{r.author}</b>
          <small className="text-fs-12 text-fg-3">
            {r.published_at ? day(r.published_at) : ""}
          </small>
        </div>
        {r.verified_enrollment ? (
          <Tag mono>
            <Icon name="shieldcheck" size={12} sw={2} />
            {REVIEWS.verified}
          </Tag>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <StarsRow value={r.overall} />
        <b className="text-fs-14 tabular-nums">{r.overall.toFixed(1)}</b>
      </div>
      <dl className="grid grid-cols-4 gap-2 text-fs-12 text-fg-3 le-600:grid-cols-2">
        {Object.entries(REVIEWS.areas).map(([k, label]) => (
          <div key={k}>
            <dt>{label}</dt>
            <dd className="font-bold text-fg-1 tabular-nums">
              {r.ratings[k as keyof typeof r.ratings]}/5
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-fs-14 leading-lh-relaxed whitespace-pre-line text-fg-2">
        {r.body}
      </p>
      {r.academy_reply ? (
        <div className="grid gap-1 rounded-sm border border-border-2 bg-bg-2 p-3">
          <b className="text-fs-13">{REVIEWS.academyReply}</b>
          <p className="text-fs-14 leading-lh-relaxed whitespace-pre-line text-fg-2">
            {r.academy_reply}
          </p>
          {r.replied_at ? (
            <small className="text-fs-12 text-fg-3">{day(r.replied_at)}</small>
          ) : null}
        </div>
      ) : null}
      {footer}
    </article>
  )
}
