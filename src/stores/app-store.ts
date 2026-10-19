import { createStore } from "zustand/vanilla"
import { persist, type PersistStorage } from "zustand/middleware"

import * as CAT from "@/data/catalog"
import type { Academy, Catalog, Listing, Organization } from "@/data/types"
import type { EnrichedListing } from "@/features/academies/types"
import * as SEARCH from "@/features/academies/search"
import * as DEMO from "@/features/applications/demo"
import * as FLOW from "@/features/applications/flow"
import type {
  Actor,
  AppDoc,
  AppDocStatus,
  AppStatus,
  Application,
  Demo,
  HostListing,
  Notification,
  Player,
  ThreadMessage,
  VaultDoc,
} from "@/features/applications/types"

/*
 * Ported from js/amk-store.js. A zustand vanilla store holds only the "delta"
 * (what the visitor changed). Everything else is derived from the seeded
 * catalog and demo data, relative to "today", in compute().
 *
 * Persistence keeps the prototype's on-disk format (key and { v: 1, ... }
 * payload). Hydration is skipped on creation: the app calls hydrate() once on
 * the client so server and first client render both start from the seed.
 * If storage is unavailable or throws, it falls back to memory.
 */
export const KEY = "gf-amk-demo:v1"
const VERSION = 1

export const SEED_SAVED = [
  "barcelona-school-season",
  "lyon-girls-academy",
  "london-goalkeeper",
  "manchester-football-college",
]

export type DemoRole = "guest" | "family" | "host"

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

/** A listing as saved by the editor (raw, before search enriches it) */
export type StoredListing = Listing & { wizardStep?: number }

export type Delta = {
  v: number
  session: { role: DemoRole }
  saved: string[]
  apps: Record<string, Application>
  messages: Record<string, ThreadMessage[]>
  reads: Record<string, boolean>
  docs: VaultDoc[]
  players: Record<string, Player>
  listings: Record<string, StoredListing>
  drafts: Record<string, Json>
}

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

export type AppStoreOptions = {
  /** 'YYYY-MM-DD'. Defaults to the visitor's local today. */
  today?: string
  /** skip localStorage entirely */
  memory?: boolean
  localStorage?: StorageLike
  /** read storage immediately (tests, non-React callers). The app hydrates from a provider instead. */
  hydrate?: boolean
}

export type View = {
  today: string
  storage: "local" | "memory"
  session: { role: DemoRole }
  saved: string[]
  reads: Record<string, boolean>
  drafts: Record<string, Json>
  catalog: Catalog
  academies: Academy[]
  academyById: Record<string, Academy>
  orgById: Record<string, Organization>
  reviews: Catalog["reviews"]
  listings: EnrichedListing[]
  publicListings: EnrichedListing[]
  listingsById: Record<string, EnrichedListing>
  apps: Application[]
  appsById: Record<string, Application>
  threads: Record<string, ThreadMessage[]>
  parent: Demo["parent"]
  players: Player[]
  playerById: Record<string, Player>
  documents: VaultDoc[]
  host: Demo["host"]
  familyApps: Application[]
  hostListings: EnrichedListing[]
  hostApps: Application[]
  familyNotifications: Notification[]
  hostNotifications: Notification[]
}

type State = {
  delta: Delta
  version: number
  hydrated: boolean
}

type DraftApplication = {
  id?: string
  listingId?: string
  intakeId?: string
  playerId?: string | null
  answers?: Record<string, string>
  documents?: AppDoc[]
  optional?: string[]
  lastStep?: number | null
}

function emptyDelta(): Delta {
  return {
    v: VERSION,
    session: { role: "guest" },
    saved: SEED_SAVED.slice(),
    apps: {},
    messages: {},
    reads: {},
    docs: [],
    players: {},
    listings: {},
    drafts: {},
  }
}

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T
}

/* ---------------- Storage adapter (memory fallback) ---------------- */
type Adapter = {
  mode: "local" | "memory"
  read: () => Delta | null
  write: (d: Delta) => void
  clear: () => void
}

function createAdapter(opts: AppStoreOptions): Adapter {
  let mem: Delta | null = null
  let ls: StorageLike | null = null
  if (!opts.memory) {
    try {
      ls =
        opts.localStorage ??
        (typeof localStorage !== "undefined" ? localStorage : null)
      if (ls) {
        ls.setItem(KEY + ":probe", "1")
        ls.removeItem(KEY + ":probe")
      }
    } catch {
      ls = null
    }
  }
  const adapter: Adapter = {
    mode: ls ? "local" : "memory",
    read() {
      if (!ls) return mem ? clone(mem) : null
      try {
        const raw = ls.getItem(KEY)
        if (!raw) return null
        const d = JSON.parse(raw) as Delta | null
        return d && d.v === VERSION ? d : null
      } catch {
        adapter.mode = "memory"
        ls = null
        return mem ? clone(mem) : null
      }
    },
    write(d) {
      mem = clone(d)
      if (!ls) return
      try {
        ls.setItem(KEY, JSON.stringify(d))
      } catch {
        adapter.mode = "memory"
        ls = null
      }
    },
    clear() {
      mem = null
      if (ls) {
        try {
          ls.removeItem(KEY)
        } catch {
          /* memory only */
        }
      }
    },
  }
  return adapter
}

type Persisted = { delta: Delta }

function persistStorage(adapter: Adapter): PersistStorage<Persisted> {
  return {
    getItem: () => {
      const d = adapter.read()
      return d ? { state: { delta: d }, version: VERSION } : null
    },
    setItem: (_name, value) => adapter.write(value.state.delta),
    removeItem: () => adapter.clear(),
  }
}

export type AppStoreApi = ReturnType<typeof createAppStore>

export function createAppStore(opts: AppStoreOptions = {}) {
  const today = opts.today || CAT.DATES.today()
  const D = CAT.DATES
  const adapter = createAdapter(opts)
  const catalog = CAT.build(today)
  const demo = DEMO.build(catalog)

  const store = createStore<State>()(
    persist<State, [], [], Persisted>(
      () => ({ delta: emptyDelta(), version: 1, hydrated: false }),
      {
        name: KEY,
        version: VERSION,
        storage: persistStorage(adapter),
        skipHydration: true,
        partialize: (s) => ({ delta: s.delta }),
      }
    )
  )

  /* ---------------- derived state ---------------- */
  function hostDraftToListing(h: HostListing): StoredListing {
    const { intakeDraft, ...rest } = clone(h)
    return {
      ...rest,
      status: "draft",
      rolling: false,
      image: rest.gallery[0],
      schedule: CAT.SCHEDULES[rest.type] || [],
      questions: CAT.BASE_QUESTIONS.slice(),
      policies: CAT.POLICIES,
      intakes: (intakeDraft || []).map(function (t, i) {
        const start = D.monthStart(today, t.monthsAhead)
        return {
          id: rest.id + "-i" + (i + 1),
          label: D.monthLabel(start) + " intake",
          start: start,
          end: D.addDays(start, (rest.durationWeeks ?? 0) * 7 - 1),
          deadline: D.addDays(start, -21),
          capacity: t.capacity,
          seededTaken: 0,
        }
      }),
    }
  }

  function compute(delta: Delta): View {
    /* Applications: seed, replaced by any saved version, plus new ones. */
    const seedIds: Record<string, boolean> = {}
    const apps = demo.applications.map(function (a) {
      seedIds[a.id] = true
      return delta.apps[a.id] || a
    })
    Object.keys(delta.apps).forEach(function (id) {
      if (!seedIds[id]) apps.push(delta.apps[id])
    })

    /* Listings: catalog + host drafts, replaced by saved edits, plus new. */
    let rawListings: StoredListing[] = (
      catalog.listings as StoredListing[]
    ).concat(demo.hostListings.map(hostDraftToListing))
    const seenL: Record<string, boolean> = {}
    rawListings = rawListings.map(function (l) {
      seenL[l.id] = true
      return delta.listings[l.id] || l
    })
    Object.keys(delta.listings).forEach(function (id) {
      if (!seenL[id]) rawListings.push(delta.listings[id])
    })

    const listings = SEARCH.enrich(
      {
        academies: catalog.academies,
        orgs: catalog.orgs,
        listings: rawListings,
      },
      apps,
      today
    )
    const listingsById: Record<string, EnrichedListing> = {}
    listings.forEach(function (l) {
      listingsById[l.id] = l
    })

    const threads: Record<string, ThreadMessage[]> = {}
    Object.keys(demo.threads).forEach(function (k) {
      threads[k] = demo.threads[k].slice()
    })
    Object.keys(delta.messages).forEach(function (k) {
      threads[k] = (threads[k] || []).concat(delta.messages[k])
    })

    const players = demo.players.map(function (p) {
      return delta.players[p.id] || p
    })
    const documents = demo.documents.concat(delta.docs)

    const academyById: Record<string, Academy> = {}
    catalog.academies.forEach(function (a) {
      academyById[a.id] = a
    })
    const orgById: Record<string, Organization> = {}
    catalog.orgs.forEach(function (o) {
      orgById[o.id] = o
    })

    const familyApps = apps.filter(function (a) {
      return a.familyId === demo.parent.id
    })
    const hostListingIds = listings
      .filter(function (l) {
        return demo.host.academyIds.indexOf(l.academyId) > -1
      })
      .map(function (l) {
        return l.id
      })
    const hostApps = apps.filter(function (a) {
      return hostListingIds.indexOf(a.listingId) > -1 && a.status !== "draft"
    })

    /* Seeded notifications older than 4 days count as already read. */
    const familyNotifications = FLOW.notificationsFor(
      "family",
      familyApps,
      threads
    )
    const hostNotifications = FLOW.notificationsFor(
      "academy",
      hostApps,
      threads
    )
    const cutoff = D.addDays(today, -4)
    const reads: Record<string, boolean> = {}
    familyNotifications.concat(hostNotifications).forEach(function (n) {
      if (n.at.slice(0, 10) < cutoff) reads[n.id] = true
    })
    Object.keys(delta.reads).forEach(function (k) {
      reads[k] = true
    })

    const appsById: Record<string, Application> = {}
    apps.forEach(function (a) {
      appsById[a.id] = a
    })
    const playerById: Record<string, Player> = {}
    players.forEach(function (p) {
      playerById[p.id] = p
    })

    return {
      today: today,
      storage: adapter.mode,
      session: delta.session,
      saved: delta.saved.slice(),
      reads: reads,
      drafts: delta.drafts,
      catalog: catalog,
      academies: catalog.academies,
      academyById: academyById,
      orgById: orgById,
      reviews: catalog.reviews,
      listings: listings,
      publicListings: listings.filter(function (l) {
        return l.status === "published"
      }),
      listingsById: listingsById,
      apps: apps,
      appsById: appsById,
      threads: threads,
      parent: demo.parent,
      players: players,
      playerById: playerById,
      documents: documents,
      host: demo.host,
      familyApps: familyApps,
      hostListings: listings.filter(function (l) {
        return hostListingIds.indexOf(l.id) > -1
      }),
      hostApps: hostApps,
      familyNotifications: familyNotifications,
      hostNotifications: hostNotifications,
    }
  }

  /* One computed view per delta. Deltas are replaced, never mutated, so the
     snapshot is stable between commits (safe for useSyncExternalStore). */
  let cacheKey: Delta | null = null
  let cacheView: View | null = null
  function get(): View {
    const delta = store.getState().delta
    if (!cacheView || cacheKey !== delta) {
      cacheView = compute(delta)
      cacheKey = delta
    }
    return cacheView
  }

  /* Every action edits a copy and commits once (one notification per action). */
  function commit(mutate: (d: Delta) => void): void {
    const next = clone(store.getState().delta)
    mutate(next)
    store.setState((s) => ({ delta: next, version: s.version + 1 }))
  }
  function appCopy(id: string): Application | null {
    const a = get().appsById[id]
    return a ? clone(a) : null
  }
  function randomId(prefix: string): string {
    return prefix + "-" + Math.random().toString(36).slice(2, 9)
  }

  /* Pull the persisted delta in once, on the client. */
  function hydrate(): void {
    void store.persist.rehydrate()
    store.setState({ hydrated: true })
  }

  const api = {
    KEY,
    store,
    get,
    hydrate,
    version: () => store.getState().version,
    subscribe(fn: () => void) {
      return store.subscribe(() => {
        try {
          fn()
        } catch {
          /* listener errors never break the store */
        }
      })
    },
    /* reload from storage (another tab changed it) */
    refresh() {
      const d = adapter.read()
      if (d) store.setState((s) => ({ delta: d, version: s.version + 1 }))
    },

    setRole(role: DemoRole) {
      commit((d) => {
        d.session = { role }
      })
    },

    isSaved(id: string) {
      return store.getState().delta.saved.indexOf(id) > -1
    },
    toggleSave(id: string): boolean {
      const wasSaved = api.isSaved(id)
      commit((d) => {
        const i = d.saved.indexOf(id)
        if (i > -1) d.saved.splice(i, 1)
        else d.saved.unshift(id)
      })
      return !wasSaved
    },

    setDraft(key: string, value: Json | null | undefined) {
      commit((d) => {
        if (value == null) delete d.drafts[key]
        else d.drafts[key] = value
      })
    },

    /* Create or update a draft application from the apply flow. */
    saveApplication(draft: DraftApplication): string {
      const existing = draft.id ? appCopy(draft.id) : null
      const a: Application = existing || {
        id: randomId("app"),
        ref: null,
        familyId: get().parent.id,
        listingId: "",
        intakeId: "",
        playerId: null,
        applicant: null,
        status: "draft",
        events: [],
        createdAt: FLOW.nowStamp(),
        answers: {},
        documents: [],
        optional: [],
        payment: null,
        lastStep: null,
      }
      if (draft.listingId !== undefined) a.listingId = draft.listingId
      if (draft.intakeId !== undefined) a.intakeId = draft.intakeId
      if (draft.playerId !== undefined) a.playerId = draft.playerId
      if (draft.answers !== undefined) a.answers = clone(draft.answers)
      if (draft.documents !== undefined) a.documents = clone(draft.documents)
      if (draft.optional !== undefined) a.optional = clone(draft.optional)
      if (draft.lastStep !== undefined) a.lastStep = draft.lastStep
      commit((d) => {
        d.apps[a.id] = a
      })
      return a.id
    },

    submitApplication(id: string): string | null {
      const a = appCopy(id)
      if (!a || !FLOW.canTransition(a.status, "submitted", "family"))
        return null
      a.status = "submitted"
      a.ref =
        a.ref ||
        FLOW.makeRef("GFA", (D.parse(today) ?? new Date()).getFullYear())
      a.events.push({
        status: "submitted",
        at: FLOW.nowStamp(),
        by: "family",
        note: "",
      })
      commit((d) => {
        d.apps[a.id] = a
      })
      return a.ref
    },

    /* Move an application; returns false when the actor isn't allowed. */
    transition(
      id: string,
      to: AppStatus,
      actor: Actor,
      note?: string
    ): boolean {
      const a = appCopy(id)
      if (!a || !FLOW.canTransition(a.status, to, actor)) return false
      a.status = to
      a.events.push({
        status: to,
        at: FLOW.nowStamp(),
        by: actor,
        note: note || "",
      })
      if (to === "enrollment_pending" && !a.payment) {
        const l = get().listingsById[a.listingId]
        const intake =
          l.intakes.filter((i) => i.id === a.intakeId)[0] || l.intakes[0]
        a.payment = {
          items: FLOW.paymentPlan(l, intake, today, a.optional || []),
          createdAt: today,
        }
      }
      commit((d) => {
        d.apps[a.id] = a
      })
      return true
    },

    sendMessage(
      appId: string,
      from: Actor,
      author: string,
      text: string
    ): boolean {
      const t = String(text || "").trim()
      if (!t) return false
      commit((d) => {
        d.messages[appId] = (d.messages[appId] || []).concat([
          { from, author, at: FLOW.nowStamp(), text: t.slice(0, 2000) },
        ])
      })
      return true
    },

    /* Pay selected items; once the required items are paid an
       enrollment-pending application becomes Enrolled. */
    payItems(
      appId: string,
      itemIds: string[],
      method?: string
    ): AppStatus | false {
      const a = appCopy(appId)
      if (!a || !a.payment) return false
      a.payment.items.forEach(function (it) {
        if (itemIds.indexOf(it.id) > -1 && it.status !== "paid") {
          it.status = "paid"
          it.paidAt = today
          it.method = method || "card"
        }
      })
      if (
        a.status === "enrollment_pending" &&
        FLOW.requiredPaid(a.payment.items)
      ) {
        a.status = "enrolled"
        a.events.push({
          status: "enrolled",
          at: FLOW.nowStamp(),
          by: "family",
          note: "",
        })
      }
      commit((d) => {
        d.apps[a.id] = a
      })
      return a.status
    },

    /* Host marks a document as accepted / needs update. */
    setDocStatus(appId: string, type: string, status: AppDocStatus): boolean {
      const a = appCopy(appId)
      if (!a) return false
      a.documents = (a.documents || []).map(function (d) {
        if (d.type === type) d.status = status
        return d
      })
      commit((d) => {
        d.apps[a.id] = a
      })
      return true
    },

    /* Family uploads a file (mock: name + size only, nothing is sent). */
    uploadDocument(
      playerId: string,
      type: AppDoc["type"],
      file: { name: string; size?: number },
      appId?: string
    ): VaultDoc {
      const doc: VaultDoc = {
        id: randomId("doc"),
        playerId,
        type,
        name: file.name,
        sizeKb: Math.max(1, Math.round((file.size || 0) / 1024)),
        uploadedAt: today,
      }
      const a = appId ? appCopy(appId) : null
      if (a) {
        let found = false
        a.documents = (a.documents || []).map(function (d): AppDoc {
          if (d.type === type) {
            found = true
            return { docId: doc.id, type, status: "uploaded" }
          }
          return d
        })
        if (!found)
          a.documents.push({ docId: doc.id, type, status: "uploaded" })
      }
      commit((d) => {
        d.docs.push(doc)
        if (a) d.apps[a.id] = a
      })
      return doc
    },

    updatePlayer(id: string, patch: Partial<Player>): Player {
      const p: Player = { ...clone(get().playerById[id]), ...patch }
      commit((d) => {
        d.players[id] = p
      })
      return p
    },

    saveListing(listing: Omit<StoredListing, "id"> & { id?: string }): string {
      const l = clone(listing) as StoredListing
      if (!l.id) l.id = randomId("listing")
      commit((d) => {
        d.listings[l.id] = l
      })
      return l.id
    },
    rawListing(id: string): StoredListing | null {
      const saved = store.getState().delta.listings[id]
      if (saved) return clone(saved)
      const l = get().listingsById[id]
      if (!l) return null
      const {
        academy: _academy,
        org: _org,
        country: _country,
        crest: _crest,
        monthly: _monthly,
        total: _total,
        deposit: _deposit,
        nextIntake: _nextIntake,
        openCount: _openCount,
        bayes: _bayes,
        completeness: _completeness,
        haystack: _haystack,
        city: _city,
        verification: _verification,
        intakes,
        ...raw
      } = clone(l)
      void [
        _academy,
        _org,
        _country,
        _crest,
        _monthly,
        _total,
        _deposit,
        _nextIntake,
        _openCount,
        _bayes,
        _completeness,
        _haystack,
        _city,
        _verification,
      ]
      return {
        ...raw,
        intakes: intakes.map(function (i) {
          const { placesLeft: _placesLeft, open: _open, ...bare } = i
          void [_placesLeft, _open]
          return bare
        }),
      }
    },
    setListingStatus(id: string, status: StoredListing["status"]): boolean {
      const l = api.rawListing(id)
      if (!l) return false
      l.status = status
      commit((d) => {
        d.listings[id] = l
      })
      return true
    },

    markRead(ids?: string[]) {
      commit((d) => {
        ;(ids || []).forEach(function (id) {
          d.reads[id] = true
        })
      })
    },

    reset() {
      adapter.clear()
      store.setState((s) => ({ delta: emptyDelta(), version: s.version + 1 }))
    },
  }

  if (opts.hydrate) hydrate()
  return api
}
