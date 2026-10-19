"use client"

import { useMemo } from "react"

import { useAppView, useDemoSession } from "@/stores/hooks"

import { STATUS } from "./flow"

/*
 * Apply to Join: the program (from the URL slug, or from a draft being resumed
 * with ?app=), the family's players and vault, and the demo session.
 */
export function useApply(slug: string, appId: string | null) {
  const view = useAppView()
  const { role, hydrated } = useDemoSession()
  return useMemo(() => {
    const existing = appId ? (view.appsById[appId] ?? null) : null
    const l = view.listingsById[existing ? existing.listingId : slug] ?? null
    return {
      hydrated,
      role,
      today: view.today,
      existing,
      l,
      players: view.players,
      playerById: view.playerById,
      documents: view.documents,
      apps: view.apps,
      /** an application for the same program and player that is still in progress */
      activeAppFor: (playerId: string, draftId: string | null) =>
        view.familyApps.find(
          (a) =>
            a.listingId === l?.id &&
            a.playerId === playerId &&
            a.id !== draftId &&
            a.status !== "draft" &&
            !STATUS[a.status].final
        ) ?? null,
      vaultFor: (playerId: string) =>
        view.documents.filter((d) => d.playerId === playerId),
    }
  }, [view, role, hydrated, slug, appId])
}
