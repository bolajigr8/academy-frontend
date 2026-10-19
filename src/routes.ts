/*
 * The only place URL strings are written.
 * Public pages use slugs; portal pages use ids (sync guide, section 2).
 * Query semantics are the prototype's: ?intake=, ?next=, ?role=, ?app=, ?id=.
 */
type Query = Record<string, string | number | null | undefined>

const enc = encodeURIComponent

function withQuery(path: string, query?: Query): string {
  if (!query) return path
  const parts: string[] = []
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue
    parts.push(`${enc(key)}=${enc(String(value))}`)
  }
  return parts.length > 0 ? `${path}?${parts.join("&")}` : path
}

export type AuthRole = "family" | "academy"

export const routes = {
  home: "/",
  /** In-page anchors on the home page (#how-it-works, #verification, #for-academies) */
  homeSection: (id: string) => `/#${enc(id)}`,

  /** search.html: filters are query params (type, country, start, sort, ...) */
  academies: (query?: Query) => withQuery("/academies", query),
  /** listing.html?id=&intake= */
  academy: (slug: string, intake?: string) =>
    withQuery(`/academies/${enc(slug)}`, { intake }),
  /** api mode: an academy's public profile (week 1 part 2, section 15; no prototype page) */
  academyProfile: (slug: string) => `/academy/${enc(slug)}`,
  /** apply.html?listing=&intake= (a draft is resumed with ?app=) */
  apply: (slug: string, intake?: string, app?: string) =>
    withQuery(`/academies/${enc(slug)}/apply`, { intake, app }),

  /** login.html?next=&role= */
  login: (next?: string, role?: AuthRole) =>
    withQuery("/login", { next, role }),
  /** register.html?role=academy */
  register: (role?: AuthRole, next?: string) =>
    withQuery("/register", { role, next }),

  /*
   * Other Golafly sites. These are not routes of this app, so links to them are
   * plain <a href>. Golafly and Golafly Travel are the live domains. Help and
   * legal pages will live inside this app: they keep the prototype's paths
   * until those pages exist (to be updated by the team).
   */
  site: {
    golafly: "https://golafly.com",
    travel: "https://golaflytravel.com/",
    travelFlights: "https://golaflytravel.com/flights",
    travelStays: "https://golaflytravel.com/",
    travelEsim: "https://golaflytravel.com/esim",
    helpCentre: "/company/faq.html",
    terms: "/legal/terms-and-conditions.html",
    privacy: "/legal/privacy-policy.html",
  },

  /** account/* in the prototype */
  family: {
    dashboard: "/family/dashboard",
    players: (id?: string) => withQuery("/family/players", { id }),
    applications: "/family/applications",
    /** account/applications.html?player= */
    applicationsFor: (player: string) =>
      withQuery("/family/applications", { player }),
    application: (id: string) => `/family/applications/${enc(id)}`,
    saved: "/family/saved",
    payments: "/family/payments",
    /** account/messages.html?thread= */
    messages: (thread?: string) => withQuery("/family/messages", { thread }),
  },

  /** host/* in the prototype */
  /** Golafly admin (no prototype design; built from the design tokens) */
  admin: {
    login: (next?: string) =>
      `/admin/login${next ? `?next=${encodeURIComponent(next)}` : ""}`,
    overview: "/admin",
    verifications: "/admin/verifications",
    verification: (id: number | string) =>
      `/admin/verifications/${encodeURIComponent(String(id))}`,
    listings: "/admin/listings",
    listing: (id: number | string) =>
      `/admin/listings/${encodeURIComponent(String(id))}`,
    applications: "/admin/applications",
    application: (id: number | string) =>
      `/admin/applications/${encodeURIComponent(String(id))}`,
    organizations: "/admin/organizations",
    organization: (id: number | string) =>
      `/admin/organizations/${encodeURIComponent(String(id))}`,
    users: "/admin/users",
  },
  club: {
    dashboard: "/club/dashboard",
    listings: "/club/listings",
    newListing: "/club/listings/new",
    editListing: (id: string) => `/club/listings/${enc(id)}/edit`,
    applications: "/club/applications",
    applicant: (id: string) => `/club/applicants/${enc(id)}`,
    payments: "/club/payments",
    messages: "/club/messages",
    profile: "/club/profile",
    /** api mode only: organization + academy forms (no prototype page) */
    editProfile: "/club/profile/edit",
  },
} as const
