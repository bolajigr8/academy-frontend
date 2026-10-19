import { env } from "@/lib/env"

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "0.0.0.0"])

/**
 * Backend file URLs (images, downloads) are absolute. When the backend builds
 * them from a local APP_URL (http://127.0.0.1:8000/…) but the app reaches it
 * through a public address (an ngrok tunnel, a server), those URLs point at the
 * viewer's own machine and fail. Such URLs are moved onto the configured API
 * origin. Any other URL is returned unchanged. (The real fix is the backend's
 * APP_URL; this keeps the app working meanwhile.)
 */
export function resolveBackendUrl(url: string): string {
  const api = env.NEXT_PUBLIC_API_URL
  if (!api || !/^https?:\/\//i.test(url)) return url
  try {
    const target = new URL(url)
    const base = new URL(api)
    if (!LOCAL_HOSTS.has(target.hostname) || LOCAL_HOSTS.has(base.hostname))
      return url
    return base.origin + target.pathname + target.search
  } catch {
    return url
  }
}
