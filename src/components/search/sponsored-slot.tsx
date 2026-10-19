import { Icon } from "@/components/icons/icon"
import { ListingCard } from "@/components/shared/listing-card"
import { SEARCH } from "@/data/search-copy"
import type { EnrichedListing } from "@/features/academies/types"

/* AmSponsored + .amk-sponsor*: js/amk-search.jsx, css/amk-pages.css:91-96. Never part of the ranking. */
export function SponsoredSlot({
  listing,
  saved,
  onSave,
  map,
}: {
  listing: EnrichedListing
  saved: boolean
  onSave: (id: string) => void
  /** in map view the card stays a narrow column (max 420px) */
  map: boolean
}) {
  return (
    <aside
      aria-label={SEARCH.sponsoredLabel}
      className="grid gap-3 rounded-lg border border-dashed border-border-3 bg-bg-2 p-4 le-720:p-3"
    >
      <div className="flex flex-wrap items-center gap-[10px]">
        <Icon name="info" size={15} className="flex-none text-fg-2" />
        <span className="text-fs-14 text-fg-3">{SEARCH.sponsoredNote}</span>
      </div>
      <ListingCard
        listing={listing}
        saved={saved}
        onSave={onSave}
        sponsored
        headingLevel={3}
        wide={!map}
        className={map ? "max-w-[420px]" : undefined}
      />
    </aside>
  )
}
