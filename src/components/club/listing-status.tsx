import { StatusPill } from "@/components/shared/status-pill"
import { LIVE } from "@/data/live-copy"
import type { StatusTone } from "@/features/applications/types"
import type { ListingStatusKey } from "@/features/club/view-models"

/* Listing status pill (host/listings.html labels; paused/archived from the sync guide) */
export const LISTING_STATUS: Record<ListingStatusKey, [string, StatusTone]> = {
  published: ["Published", "success"],
  in_review: ["In review", "info"],
  draft: ["Draft", "ghost"],
  rejected: ["Changes requested", "warning"],
  paused: [LIVE.listingStatus.paused, "ghost"],
  archived: [LIVE.listingStatus.archived, "ghost"],
}

export function ListingStatusPill({ status }: { status: ListingStatusKey }) {
  const [label, tone] = LISTING_STATUS[status]
  return <StatusPill tone={tone}>{label}</StatusPill>
}
