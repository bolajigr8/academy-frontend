import { getAppStore } from "@/stores/instance"

import type { Actor, AppDocStatus, AppStatus } from "./types"

/*
 * What a person can do to an application. Components call these, never the store,
 * so connecting the backend later only changes the bodies here.
 */
export function transitionApplication(
  id: string,
  to: AppStatus,
  actor: Actor,
  note?: string
): boolean {
  return getAppStore().transition(id, to, actor, note)
}

export function sendMessage(
  appId: string,
  from: Actor,
  author: string,
  text: string
): boolean {
  return getAppStore().sendMessage(appId, from, author, text)
}

export function setDocumentStatus(
  appId: string,
  type: string,
  status: AppDocStatus
): boolean {
  return getAppStore().setDocStatus(appId, type, status)
}

export function markRead(ids: string[]): void {
  getAppStore().markRead(ids)
}

/* ---------------- Apply to Join ---------------- */

/** Creates or updates a draft application; returns its id */
export function saveApplicationDraft(
  draft: Parameters<ReturnType<typeof getAppStore>["saveApplication"]>[0]
): string {
  return getAppStore().saveApplication(draft)
}

/** Sends a draft to the academy; returns the new reference, or null */
export function submitApplication(id: string): string | null {
  return getAppStore().submitApplication(id)
}

/** Saves changes to a player's reusable profile */
export function updatePlayer(
  id: string,
  patch: Parameters<ReturnType<typeof getAppStore>["updatePlayer"]>[1]
) {
  return getAppStore().updatePlayer(id, patch)
}

/** Adds a file to the player's document vault */
export function uploadDocument(
  playerId: string,
  type: Parameters<ReturnType<typeof getAppStore>["uploadDocument"]>[1],
  file: { name: string; size?: number },
  /** also attaches the file to this application */
  appId?: string
) {
  return getAppStore().uploadDocument(playerId, type, file, appId)
}

/** Records a demo payment for the chosen items; returns the application's new status */
export function payItems(appId: string, itemIds: string[], method: string) {
  return getAppStore().payItems(appId, itemIds, method)
}

/** The demo's "Continue as Amara" (switches the demo session to the family) */
export function continueAsFamily(): void {
  getAppStore().setRole("family")
}
