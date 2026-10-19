/** react-query keys for the admin area */
export const adminKeys = {
  all: ["admin"] as const,
  verifications: (f: object) => [...adminKeys.all, "verifications", f] as const,
  verification: (id: number) => [...adminKeys.all, "verification", id] as const,
  listings: (f: object) => [...adminKeys.all, "listings", f] as const,
  listing: (id: number) => [...adminKeys.all, "listing", id] as const,
  organizations: (f: object) => [...adminKeys.all, "organizations", f] as const,
  organization: (id: number) => [...adminKeys.all, "organization", id] as const,
  users: (f: object) => [...adminKeys.all, "users", f] as const,
  applications: (f: object) => [...adminKeys.all, "applications", f] as const,
  application: (id: number) => [...adminKeys.all, "application", id] as const,
}
