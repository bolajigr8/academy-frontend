"use client"

import { Icon } from "@/components/icons/icon"
import { ClubCrest } from "@/components/shared/club-crest"
import { Stars } from "@/components/shared/listing-card"
import { VerifyBadge } from "@/components/shared/verify-badge"
import { Button } from "@/components/ui/button"
import { PROGRAM } from "@/data/search-copy"
import { genderLabel, levelLabel, typeLabel } from "@/features/academies/search"
import type { EnrichedListing } from "@/features/academies/types"
import { cn } from "@/lib/utils"

type Props = {
  listing: EnrichedListing
  saved?: boolean
  onSave?: (id: string) => void
  onShare?: () => void
  /** the editor preview: no Share / Save */
  preview?: boolean
}

/* AmListingHeader + .amk-lhead*: js/amk-listing.jsx, css/amk-pages.css:166-175 and 720 rule */
export function ListingHeader({
  listing: l,
  saved = false,
  onSave,
  onShare,
  preview = false,
}: Props) {
  const t = PROGRAM
  return (
    <header className="mb-[22px] flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 items-start gap-[18px] le-720:flex-col le-720:gap-3">
        <ClubCrest
          crest={l.crest}
          size={56}
          club={l.verification === "club"}
          className="mt-1"
        />
        <div>
          <p className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
            {typeLabel(l)} · {levelLabel(l)} · {genderLabel(l)}
          </p>
          <h1 className="my-1.5 font-display text-[clamp(28px,3.6vw,46px)] leading-[1.02] font-bold tracking-[-0.025em]">
            {l.title || t.untitled}
          </h1>
          <p className="text-fs-16 font-semibold text-fg-2">
            {l.academy.name}
            {l.academy.clubName && l.verification === "club" ? (
              <>
                {" · "}
                <span className="text-fg-1">
                  {t.officialAcademyOf} {l.academy.clubName}
                </span>
              </>
            ) : null}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-[18px] gap-y-2 text-fs-14">
            <Stars listing={l} />
            {l.reviewSummary.count > 0 ? (
              <a className="am-link" href="#reviews">
                {l.reviewSummary.count} {t.verifiedReviews}
              </a>
            ) : null}
            <span className="inline-flex items-center gap-[5px] text-fg-2">
              <Icon name="pin" size={15} />
              {l.city}, {l.country}
            </span>
            <VerifyBadge v={l.verification} />
          </div>
        </div>
      </div>
      {!preview ? (
        <div className="flex gap-1">
          <Button variant="ghost" onClick={onShare}>
            <Icon name="share" size={17} /> {t.share}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={saved}
            onClick={() => onSave?.(l.id)}
          >
            <Icon
              name="heart"
              size={17}
              className={cn(saved && "fill-gf-neon stroke-fg-1")}
            />{" "}
            {saved ? t.saved : t.save}
          </Button>
        </div>
      ) : null}
    </header>
  )
}
