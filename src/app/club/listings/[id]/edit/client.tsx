"use client"

import { ListingWizard } from "@/components/club/listing-wizard/listing-wizard"
import { LiveListingWizard } from "@/components/club/live-wizard/live-wizard"
import { isLive } from "@/lib/data-source"

/* Edit listing (host/listing-edit.html?id=). api mode: the backend's numeric listing id. */
export function EditListingClient({ id }: { id: string }) {
  return isLive("listingEditor") ? (
    <LiveListingWizard id={Number(id)} />
  ) : (
    <ListingWizard id={id} />
  )
}
