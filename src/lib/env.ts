import { z } from "zod"

const envSchema = z.object({
  /** Base URL of the backend, ending in /api/v1, e.g. http://127.0.0.1:8000/api/v1 */
  NEXT_PUBLIC_API_URL: z.url().optional(),
  /**
   * The general data toggle. "api" (the default) uses the backend for every
   * area whose endpoints exist; "mock" runs the whole app on the prototype's
   * demo data (design review, tests, working offline).
   */
  NEXT_PUBLIC_DATA_MODE: z.enum(["api", "mock"]).optional(),
})

// NEXT_PUBLIC_* values must be read as literal property accesses so Next can inline them.
export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
  NEXT_PUBLIC_DATA_MODE: process.env.NEXT_PUBLIC_DATA_MODE || undefined,
})
