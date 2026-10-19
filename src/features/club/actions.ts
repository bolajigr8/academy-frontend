import type { StoredListing } from "@/stores/app-store"
import { getAppStore } from "@/stores/instance"

import type { WizardListing } from "./wizard"

/*
 * What an academy can do to its listings. Components call these, never the store,
 * so connecting the backend later only changes the bodies here.
 */

/** The editable listing behind an id (a saved draft, or the published one) */
export function loadListing(id: string): WizardListing | null {
  return getAppStore().rawListing(id)
}

/** Saves a draft (or changes to a live listing); returns its id */
export function saveListing(listing: WizardListing): string {
  const { id, ...rest } = listing
  return getAppStore().saveListing(id ? { ...rest, id } : rest)
}

export function setListingStatus(
  id: string,
  status: StoredListing["status"]
): boolean {
  return getAppStore().setListingStatus(id, status)
}
