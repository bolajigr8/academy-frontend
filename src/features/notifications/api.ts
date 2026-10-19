import { apiClient } from "@/lib/api/client"
import type { ApiPage, ApiResponse } from "@/lib/api/types"

/*
 * The bell (week 2 part 2, section 15). Any logged-in family or academy
 * account. Newest first; meta.unread_count is the badge.
 */
export type ApiNotificationType =
  | "application_submitted"
  | "application_under_review"
  | "information_requested"
  | "family_replied"
  | "application_accepted"
  | "application_not_successful"
  | "application_withdrawn"
  | "new_message"
  | "listing_approved"
  | "listing_changes_needed"
  | "listing_taken_down"
  | "academy_verified"
  | "academy_verification_needs_attention"

export type ApiNotification = {
  id: string
  /** a known type, or a newer one the app shows with the bell icon */
  type: ApiNotificationType | (string & {})
  /** the bell's wording, written by the backend */
  title: string
  /** what it is about: the academy and listing (family), the player and listing (academy) */
  text: string | null
  /** the screen to open */
  target: {
    type: "application" | "listing" | "academy" | (string & {})
    id: number
  } | null
  read_at: string | null
  created_at: string
}

export type ApiNotificationsPage = ApiPage<ApiNotification> & {
  meta: ApiPage<ApiNotification>["meta"] & { unread_count: number }
}

/** GET /academy/me/notifications (per_page 1 to 50). Silent: a failing badge never toasts. */
export async function listNotifications(
  perPage = 20,
  page = 1
): Promise<ApiNotificationsPage> {
  const res = await apiClient.get<ApiNotificationsPage>(
    "/academy/me/notifications",
    {
      params: { per_page: perPage, page },
      headers: { "X-Silent-Error": "1" },
    }
  )
  return res.data
}

/** POST /academy/me/notifications/{id}/read (someone else's: 404) */
export async function markNotificationRead(
  id: string
): Promise<ApiNotification> {
  const res = await apiClient.post<ApiResponse<ApiNotification>>(
    `/academy/me/notifications/${encodeURIComponent(id)}/read`
  )
  return res.data.data
}

/** POST /academy/me/notifications/read-all: the bell's "Mark all as read" */
export async function markAllNotificationsRead(): Promise<{
  unread_count: number
}> {
  const res = await apiClient.post<ApiResponse<{ unread_count: number }>>(
    "/academy/me/notifications/read-all"
  )
  return res.data.data
}

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
}
