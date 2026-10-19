"use client"

import { ListingWizard } from "@/components/club/listing-wizard/listing-wizard"
import { LiveListingWizard } from "@/components/club/live-wizard/live-wizard"
import { isLive } from "@/lib/data-source"

/* Create listing (host/listing-edit.html with no ?id=). api mode: saved to the backend. */
export function NewListingClient() {
  return isLive("listingEditor") ? (
    <LiveListingWizard id={null} />
  ) : (
    <ListingWizard id={null} />
  )
}
