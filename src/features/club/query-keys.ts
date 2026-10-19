/** react-query keys for the academy portal. One key per endpoint. */
export const clubKeys = {
  all: ["club"] as const,
  organization: () => [...clubKeys.all, "organization"] as const,
  academies: () => [...clubKeys.all, "academies"] as const,
  academy: (id: number) => [...clubKeys.all, "academy", id] as const,
  options: () => [...clubKeys.all, "options"] as const,
  listings: () => [...clubKeys.all, "listings"] as const,
  listing: (id: number) => [...clubKeys.all, "listing", id] as const,
  inbox: (filters: object = {}) => [...clubKeys.all, "inbox", filters] as const,
  applicant: (id: number) => [...clubKeys.all, "applicant", id] as const,
  verification: (academyId: number) =>
    [...clubKeys.all, "verification", academyId] as const,
}
