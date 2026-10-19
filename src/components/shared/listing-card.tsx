"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import type { ElementType } from "react"

import { Icon } from "@/components/icons/icon"
import { cardFromListing, type CardView } from "@/features/academies/card-view"
import type { EnrichedListing } from "@/features/academies/types"
import { DATES } from "@/data/catalog"
import { easeOut, inView, pressIcon } from "@/lib/motion"
import { cn } from "@/lib/utils"

import { ClubCrest } from "./club-crest"
import { SafeImage } from "./safe-image"
import { Tag } from "./tag"

type Props = (
  | { listing: EnrichedListing; card?: never }
  /** a ready card view (backend listings) */
  | { card: CardView; listing?: never }
) & {
  saved: boolean
  /** shows the heart; called with the listing id */
  onSave?: (id: string) => void
  /** adds the "Sponsored" label and the ink outline */
  sponsored?: boolean
  headingLevel?: 2 | 3 | 4
  /** reports hover, for the map pins on the search page */
  onHover?: (id: string | null) => void
  /** shows the title as plain text (the editor preview) */
  linkless?: boolean
  /** photo beside the text (the sponsored slot in list view, css/amk-pages.css:94-95 and 145) */
  wide?: boolean
  className?: string
  /** position in its grid, to stagger the entrance */
  index?: number
}

/* AmStars + .amk-stars: js/amk-core.jsx, css/amk-core.css:231-233 */
export function Stars({
  listing: l,
  showCount = true,
}: {
  listing: EnrichedListing
  showCount?: boolean
}) {
  return <ReviewStars summary={l.reviewSummary} showCount={showCount} />
}

function ReviewStars({
  summary: s,
  showCount = true,
}: {
  summary: { count: number; avg: number }
  showCount?: boolean
}) {
  if (!s.count)
    return (
      <span className="inline-flex items-center gap-[5px] text-fs-14 font-bold whitespace-nowrap text-fg-1">
        <small className="text-fs-13 font-medium text-fg-3">
          New · no reviews yet
        </small>
      </span>
    )
  return (
    <span
      aria-label={`${s.avg.toFixed(1)} out of 5 from ${s.count} verified reviews`}
      className="inline-flex items-center gap-[5px] text-fs-14 font-bold whitespace-nowrap text-fg-1"
    >
      <Icon name="star" size={14} filled className="text-amk-accent-ink" />{" "}
      {s.avg.toFixed(1)}
      {showCount ? (
        <small className="text-fs-13 font-medium text-fg-3">({s.count})</small>
      ) : null}
    </span>
  )
}

/* AmFav + .amk-fav: css/amk-core.css:316-321 */
function FavButton({
  id,
  saved,
  name,
  onToggle,
}: {
  id: string
  saved: boolean
  name: string
  onToggle: (id: string) => void
}) {
  return (
    <motion.button
      {...pressIcon}
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? "Remove " : "Save "}${name}${saved ? " from saved" : ""}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle(id)
      }}
      className="absolute top-2 right-2 z-[2] grid size-11 place-items-center rounded-full border-0 bg-glass-bg-strong p-0 text-fg-1 am-glass [transition:background_var(--dur-base)_var(--ease-out)] hover:bg-surface-elevated aria-pressed:[&_svg]:fill-gf-neon aria-pressed:[&_svg]:stroke-gf-black"
    >
      <Icon name="heart" size={20} sw={2} />
    </motion.button>
  )
}

/* AmCard + .amk-card*: js/amk-core.jsx:243, css/amk-core.css:311-345 */
export function ListingCard({
  listing,
  card,
  saved,
  onSave,
  sponsored = false,
  headingLevel = 3,
  onHover,
  linkless = false,
  wide = false,
  className,
  index = 0,
}: Props) {
  const Heading: ElementType = `h${headingLevel}`
  const c = card ?? cardFromListing(listing)
  const next = c.next
  return (
    <motion.article
      {...inView(index)}
      whileHover="hover"
      onMouseEnter={onHover ? () => onHover(c.id) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      className={cn(
        "group relative min-w-0",
        wide
          ? "grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center gap-5 le-1180:grid-cols-[1fr]"
          : "flex flex-col",
        className
      )}
    >
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-lg border border-border-1 bg-bg-3",
          // no photo yet (a new draft): a dark surface, so the white text drawn
          // for photos stays readable in both themes
          !c.image && "bg-gf-black",
          sponsored && "shadow-[0_0_0_2px_var(--fg-1)]"
        )}
      >
        <motion.div
          className="absolute inset-0"
          variants={{ hover: { scale: 1.04 } }}
          transition={{ duration: 0.42, ease: easeOut }}
        >
          {c.image ? (
            <SafeImage
              src={c.image}
              alt={c.alt}
              fill
              unoptimized={c.remoteImage}
              sizes="(max-width: 720px) 100vw, (max-width: 1024px) 50vw, 400px"
              className="object-cover [filter:var(--filter-media)]"
            />
          ) : null}
        </motion.div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-(image:--grad-stadium-soft)"
        />
        <div className="absolute top-3 left-3 flex max-w-[calc(100%-72px)] flex-wrap gap-1.5">
          {sponsored ? (
            <span className="inline-flex items-center gap-[5px] rounded-xs bg-fg-1 px-[9px] py-[3px] font-mono text-[11px] font-bold tracking-gf-wide text-bg-0 uppercase">
              Sponsored
            </span>
          ) : null}
          {c.verification === "club" ? (
            <Tag tone="neon" mono>
              Club Academy
            </Tag>
          ) : null}
          {c.verification === "pending" ? <Tag mono>New academy</Tag> : null}
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-fs-13 font-bold text-gf-white [text-shadow:0_1px_8px_var(--overlay-strong)]">
          <ClubCrest
            crest={c.crest}
            size={30}
            club={c.verification === "club"}
          />
          <span>
            {c.city}, {c.country}
          </span>
        </div>
      </div>
      {onSave ? (
        <FavButton
          id={c.id}
          saved={saved}
          onToggle={onSave}
          name={`${c.academyName}, ${c.title}`}
        />
      ) : null}
      <div className={cn("grid gap-1.5", wide ? "pt-0" : "pt-3")}>
        <div className="flex items-start justify-between gap-[10px]">
          <p className="text-fs-14 font-semibold text-fg-2">{c.academyName}</p>
          <ReviewStars summary={c.reviews} />
        </div>
        <Heading className="font-display text-fs-18 leading-lh-snug font-bold tracking-[-0.01em] text-fg-1">
          {linkless || !c.href ? (
            c.title || "Untitled program"
          ) : (
            <Link
              href={c.href}
              className="after:absolute after:inset-0 after:z-[1] after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-amk-accent-ink"
            >
              {c.title}
            </Link>
          )}
        </Heading>
        <p className="text-fs-13 text-fg-3">{c.facts.join(" · ")}</p>
        <div className="mt-0.5 flex flex-wrap gap-1.5">
          {c.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-border-1 pt-[10px]">
          <span className="font-display text-fs-20 font-bold tracking-[-0.02em] text-fg-1">
            {c.price ?? "—"}
          </span>
          {c.unit ? (
            <span className="text-fs-14 font-medium text-fg-2">/ {c.unit}</span>
          ) : null}
          {c.monthly ? (
            <span
              title="Monthly equivalent, for comparing programs"
              className="ml-auto font-mono text-fs-12 text-fg-3"
            >
              ≈ {c.monthly}/mo
            </span>
          ) : null}
        </p>
        {next ? (
          <p className="flex items-center gap-1.5 text-fs-13 text-fg-2">
            <Icon name="calendar" size={14} /> Next start{" "}
            <b className="text-fg-1">{DATES.fmtShort(next.start)}</b>
            {next.places ? ` · ${next.places}` : null}
          </p>
        ) : null}
      </div>
    </motion.article>
  )
}
