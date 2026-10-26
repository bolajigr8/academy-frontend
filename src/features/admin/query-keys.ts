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
  // week 3 part 2
  reviews: (f: object) => [...adminKeys.all, "reviews", f] as const,
  enrollments: (f: object) => [...adminKeys.all, "enrollments", f] as const,
  enrollment: (id: number) => [...adminKeys.all, "enrollment", id] as const,
  settings: () => [...adminKeys.all, "settings"] as const,
  overview: (r: object) => [...adminKeys.all, "overview", r] as const,
}
