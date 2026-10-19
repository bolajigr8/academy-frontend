"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { DATES, LEVELS } from "@/data/catalog"
import type { EnrichedListing } from "@/features/academies/types"
import { eligibility, planTotals, STATUS } from "@/features/applications/flow"
import { buildInbox } from "@/features/applications/inbox"
import { flatPayments } from "@/features/applications/payments"
import type { Application, StatusGroup } from "@/features/applications/types"
import type { View } from "@/stores/app-store"
import { useAppView } from "@/stores/hooks"

import { useSession } from "@/features/auth/session"
import { isLive } from "@/lib/data-source"

import {
  getMeOptions,
  listPlayers,
  type ApiMeOptions,
  type ApiPlayer,
} from "./api"
import { completeness } from "./players"
import { familyKeys } from "./query-keys"

/*
 * Family pages (account/*.html). Pages read these hooks and never the store,
 * so connecting the backend later only changes the bodies here.
 */

const lastAt = (a: Application) =>
  a.events.length ? a.events[a.events.length - 1].at : a.createdAt

/** The name a family member signs messages with */
const parentName = (view: View) =>
  `${view.parent.firstName} ${view.parent.lastName}`

export type AppRowData = {
  app: Application
  listing: EnrichedListing
  intakeStart: string
  playerFirst: string | null
  playerInitials: string | null
  lastAt: string
}

function rowOf(view: View, a: Application): AppRowData {
  const l = view.listingsById[a.listingId]
  const intake = l.intakes.find((i) => i.id === a.intakeId) ?? l.intakes[0]
  const p = a.playerId ? view.playerById[a.playerId] : undefined
  return {
    app: a,
    listing: l,
    intakeStart: intake.start,
    playerFirst: p ? p.firstName : null,
    playerInitials: p ? p.initials : null,
    lastAt: lastAt(a),
  }
}

export function useFamilyDashboard() {
  const view = useAppView()
  return useMemo(() => {
    const apps = view.familyApps
    const offersSet = ["accepted", "enrollment_pending", "enrolled"]
    const action = apps.filter((a) => STATUS[a.status].group === "action")
    const sent = apps.filter((a) => a.status !== "draft")
    const recent = sent
      .slice()
      .sort((a, b) => (lastAt(a) < lastAt(b) ? 1 : -1))
      .slice(0, 4)
    const deadlines = view.saved
      .flatMap((id) => {
        const l = view.listingsById[id]
        return l && l.nextIntake ? [{ l, i: l.nextIntake }] : []
      })
      .sort((a, b) => (a.i.deadline < b.i.deadline ? -1 : 1))
      .slice(0, 4)
    const threads = apps
      .filter((a) => (view.threads[a.id] ?? []).length)
      .map((a) => {
        const msgs = view.threads[a.id]
        return {
          app: a,
          listing: view.listingsById[a.listingId],
          last: msgs[msgs.length - 1],
        }
      })
      .sort((x, y) => (x.last.at < y.last.at ? 1 : -1))
      .slice(0, 3)
    const applied: Record<string, boolean> = {}
    apps.forEach((a) => {
      applied[`${a.listingId}:${a.playerId}`] = true
    })
    const recs: EnrichedListing[] = []
    view.players.forEach((p) => {
      view.publicListings.forEach((l) => {
        if (
          recs.length >= 3 ||
          applied[`${l.id}:${p.id}`] ||
          recs.some((r) => r.id === l.id)
        )
          return
        if (
          eligibility(p, l, l.nextIntake, view.today, view.apps).ok &&
          l.verification !== "pending"
        )
          recs.push(l)
      })
    })
    /* The "Needs your attention" cards (todoText in account/dashboard.html) */
    const todos = action.map((a) => {
      const l = view.listingsById[a.listingId]
      const p = view.playerById[a.playerId ?? ""]
      if (a.status === "enrollment_pending" && a.payment) {
        const due = a.payment.items.find(
          (i) => i.required && i.status !== "paid"
        )
        return {
          app: a,
          kind: "pay" as const,
          academy: l.academy.name,
          first: p.firstName,
          amount: planTotals(a.payment.items).requiredDue,
          due: due ? due.due : view.today,
        }
      }
      if (a.status === "info_required") {
        const ev = a.events.filter((e) => e.status === "info_required").pop()
        return {
          app: a,
          kind: "info" as const,
          academy: l.academy.name,
          note: ev?.note ?? "",
        }
      }
      return {
        app: a,
        kind: "draft" as const,
        first: p.firstName,
        title: l.title,
        academy: l.academy.name,
      }
    })
    return {
      today: view.today,
      parentFirst: view.parent.firstName,
      playerNames: view.players.map((p) => p.firstName),
      saved: view.saved,
      action,
      todos,
      counts: {
        sent: sent.length,
        waiting: apps.filter((a) =>
          ["submitted", "under_review", "info_required"].includes(a.status)
        ).length,
        offers: apps.filter((a) => offersSet.includes(a.status)).length,
        enrolled: apps.filter((a) => a.status === "enrolled").length,
      },
      recent: recent.map((a) => rowOf(view, a)),
      recs,
      handoff: apps
        .filter((a) => offersSet.includes(a.status))
        .slice(0, 1)
        .map((a) => rowOf(view, a)),
      deadlines,
      threads,
    }
  }, [view])
}

const GROUP_ORDER: Record<StatusGroup, number> = {
  action: 0,
  progress: 1,
  enrolled: 2,
  closed: 3,
}

export function useFamilyApplications(tab: string, player: string) {
  const view = useAppView()
  return useMemo(() => {
    const byPlayer = view.familyApps.filter(
      (a) => player === "all" || a.playerId === player
    )
    const count = (g: string) =>
      byPlayer.filter((a) => g === "all" || STATUS[a.status].group === g).length
    const list = byPlayer
      .filter((a) => tab === "all" || STATUS[a.status].group === tab)
      .sort(
        (a, b) =>
          GROUP_ORDER[STATUS[a.status].group] -
            GROUP_ORDER[STATUS[b.status].group] ||
          (lastAt(a) < lastAt(b) ? 1 : -1)
      )
    return {
      players: view.players,
      count,
      rows: list.map((a) => rowOf(view, a)),
    }
  }, [view, tab, player])
}

/** One application of this family; `found` is false for another family's id. */
export function useFamilyApplication(id: string) {
  const view = useAppView()
  return useMemo(() => {
    const app = view.appsById[id]
    if (!app || app.familyId !== view.parent.id)
      return { found: false as const }
    const l = view.listingsById[app.listingId]
    const intake = l.intakes.find((i) => i.id === app.intakeId) ?? l.intakes[0]
    const player = view.playerById[app.playerId ?? ""]
    return {
      found: true as const,
      app,
      listing: l,
      intake,
      player,
      today: view.today,
      totals: app.payment ? planTotals(app.payment.items) : null,
      messages: view.threads[app.id] ?? [],
      author: parentName(view),
      documentOf: (docId: string | null) =>
        view.documents.find((x) => x.id === docId),
      optionalLabels: l.optional
        .filter((o) => (app.optional ?? []).includes(o.id))
        .map((o) => o.label),
    }
  }, [view, id])
}

export function useFamilyPlayers(sel: string) {
  const view = useAppView()
  return useMemo(() => {
    const p = view.playerById[sel] ?? view.players[0]
    const docs = view.documents.filter((d) => d.playerId === p.id)
    return {
      players: view.players,
      today: view.today,
      parent: view.parent,
      player: p,
      age: DATES.ageOn(p.dob, view.today),
      ageOf: (dob: string) => DATES.ageOn(dob, view.today),
      level: LEVELS.find((x) => x.id === p.level)?.label ?? "",
      docs,
      pct: completeness(p, docs),
      rows: view.familyApps
        .filter((a) => a.playerId === p.id)
        .map((a) => rowOf(view, a)),
    }
  }, [view, sel])
}

export function useFamilySaved() {
  const view = useAppView()
  return useMemo(() => {
    const list = view.saved.map((id) => view.listingsById[id]).filter(Boolean)
    return {
      list,
      eligibleFor: (l: EnrichedListing) =>
        view.players
          .filter(
            (p) => eligibility(p, l, l.nextIntake, view.today, view.apps).ok
          )
          .map((p) => p.firstName),
    }
  }, [view])
}

export function useFamilyPayments() {
  const view = useAppView()
  return useMemo(() => {
    const items = flatPayments(view.familyApps, view)
    const sum = (f: (i: (typeof items)[number]) => boolean) =>
      items.filter(f).reduce((s, i) => s + i.amount, 0)
    return {
      today: view.today,
      items,
      dueNow: sum((i) => i.status !== "paid" && i.required),
      upcoming: sum((i) => i.status !== "paid" && !i.required),
      paid: sum((i) => i.status === "paid"),
      withPlan: view.familyApps.filter((a) => a.payment).length,
      appById: (id: string) => view.appsById[id],
    }
  }, [view])
}

export function useFamilyInbox() {
  const view = useAppView()
  return useMemo(
    () => ({
      rows: buildInbox(
        view,
        view.familyApps.filter((a) => a.status !== "draft"),
        "family"
      ),
      author: parentName(view),
    }),
    [view]
  )
}

/** The pay dialog: an application's unpaid items and its program */
export function usePayDialog(appId: string | null) {
  const view = useAppView()
  return useMemo(() => {
    const app = appId ? view.appsById[appId] : undefined
    if (!app || !app.payment) return null
    return {
      app,
      listing: view.listingsById[app.listingId],
      items: app.payment.items.filter((i) => i.status !== "paid"),
    }
  }, [view, appId])
}

/* ---------------- player profiles (api mode, week 2 part 1) ---------------- */

export type LivePlayersData = { options: ApiMeOptions; players: ApiPlayer[] }

type LivePlayersQuery = {
  data: LivePlayersData | undefined
  error: unknown
  isPending: boolean
  isError: boolean
  isFetching: boolean
  refetch: () => void
}

/** mock mode: no backend, no react-query entry (the shell calls this on every page) */
function useNoPlayers(): LivePlayersQuery {
  return {
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: () => undefined,
  }
}

/** GET /academy/me/options + /academy/me/players (applicant accounts only) */
function useBackendPlayers(): LivePlayersQuery {
  const { user } = useSession()
  const enabled = user?.role === "applicant"
  const options = useQuery({
    queryKey: familyKeys.options(),
    queryFn: getMeOptions,
    enabled,
    staleTime: Infinity,
  })
  const players = useQuery({
    queryKey: familyKeys.players(),
    queryFn: listPlayers,
    enabled,
  })
  const failed = options.isError ? options : players.isError ? players : null
  return {
    data:
      options.data && players.data
        ? { options: options.data, players: players.data }
        : undefined,
    error: failed?.error ?? null,
    isPending: !failed && (options.isPending || players.isPending),
    isError: Boolean(failed),
    isFetching: options.isFetching || players.isFetching,
    refetch: () => {
      if (options.isError) void options.refetch()
      if (players.isError) void players.refetch()
    },
  }
}

/** The mode is fixed for the run, so the hook is chosen once */
export const useLivePlayers = isLive("players")
  ? useBackendPlayers
  : useNoPlayers
