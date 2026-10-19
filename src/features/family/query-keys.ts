/** react-query keys for the family (applicant) area */
export const familyKeys = {
  all: ["family"] as const,
  options: () => [...familyKeys.all, "options"] as const,
  players: () => [...familyKeys.all, "players"] as const,
  applications: (filters: object = {}) =>
    [...familyKeys.all, "applications", filters] as const,
  application: (id: number) => [...familyKeys.all, "application", id] as const,
  dashboard: () => [...familyKeys.all, "dashboard"] as const,
}
