import axios from "axios"

import { env } from "@/lib/env"

import { clearSession, getToken } from "./session"

/*
 * The one HTTP client. Every request sends Accept: application/json and, when
 * signed in, Authorization: Bearer <token> (contract section 1).
 */
export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 20_000,
  headers: { Accept: "application/json" },
})

/** Requests that carry files (multipart) get time to upload several photos over a slow link */
const UPLOAD_TIMEOUT_MS = 180_000

apiClient.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData)
    config.timeout = UPLOAD_TIMEOUT_MS
  const token = getToken()
  if (token) config.headers.set("Authorization", `Bearer ${token}`)
  return config
})

type ErrorListener = (error: unknown) => void
const errorListeners = new Set<ErrorListener>()

/**
 * Every failed request (except 401, which ends the session and goes to login)
 * is announced here; the app providers show it as an error toast. A request
 * can opt out with `{ headers: { "X-Silent-Error": "1" } }`.
 */
export function onApiError(listener: ErrorListener): () => void {
  errorListeners.add(listener)
  return () => errorListeners.delete(listener)
}

// A 401 (no token, or it expired) clears the session and nothing else. The
// session listeners (app shell) and src/proxy.ts send the person to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearSession()
    } else if (!(
      axios.isAxiosError(error) &&
      error.config?.headers?.get?.("X-Silent-Error")
    )) {
      errorListeners.forEach((l) => l(error))
    }
    return Promise.reject(error)
  }
)
