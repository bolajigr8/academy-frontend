import { createAppStore, type AppStoreApi } from "./app-store"

let instance: AppStoreApi | null = null

/**
 * The browser singleton, created on first use so nothing runs at module load
 * (and never on the server unless a component asks for it). Tests build their
 * own stores with createAppStore().
 */
export function getAppStore(): AppStoreApi {
  if (!instance) instance = createAppStore()
  return instance
}
