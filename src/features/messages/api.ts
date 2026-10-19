import { apiClient } from "@/lib/api/client"
import type { ApiResponse } from "@/lib/api/types"
import type { ApiAppStatus } from "@/features/family/api"

/*
 * Week 2 part 2, section 14: one conversation per application, between the
 * family and every member of the academy. Both sides get the same shape:
 * status changes (kind "status", as the timeline) and messages (kind
 * "message") in one list, oldest first. There is no live connection: the open
 * thread is polled every 5 to 10 seconds. The only place these are called.
 */
export type ApiThreadStatus = {
  kind: "status"
  from_status: ApiAppStatus | null
  to_status: ApiAppStatus
  actor_type: "applicant" | "academy" | "admin" | "system"
  actor_name: string | null
  note: string | null
  at: string
}

export type ApiThreadMessage = {
  kind: "message"
  id: number
  /** compare with the reader's side to place the bubble */
  sender_side: "applicant" | "academy"
  sender_name: string
  body: string | null
  /** {name, download_url} (needs the token) or null */
  attachment: { name: string; download_url: string } | null
  /** when the other side read it; own messages are never marked */
  read_at: string | null
  at: string
}

export type ApiThreadItem = ApiThreadStatus | ApiThreadMessage

export type ApiThread = {
  application: { id: number; reference: string | null; status: ApiAppStatus }
  /** false once the application is cancelled: hide the message box */
  can_send: boolean
  items: ApiThreadItem[]
}

export type ThreadSide = "me" | "portal"

const threadPath = (side: ThreadSide, id: number) =>
  `/academy/${side}/applications/${id}/messages`

/**
 * GET …/applications/{id}/messages. Opening the thread marks the other side's
 * messages read. A draft answers 422 not_sent (silent: the page explains it).
 */
export async function getThread(
  side: ThreadSide,
  applicationId: number,
  silent = false
): Promise<ApiThread> {
  const res = await apiClient.get<ApiResponse<ApiThread>>(
    threadPath(side, applicationId),
    silent ? { headers: { "X-Silent-Error": "1" } } : undefined
  )
  return res.data.data
}

/**
 * POST …/applications/{id}/messages: a body (up to 2,000 characters), one
 * attachment (PDF or image), or both; multipart when there is a file.
 * Answers 201 with the whole thread. 20 messages a minute per account (429).
 */
export async function sendMessage(
  side: ThreadSide,
  applicationId: number,
  input: { body?: string; attachment?: File | null }
): Promise<ApiThread> {
  const body = input.body?.trim() ?? ""
  let payload: FormData | { body: string }
  if (input.attachment) {
    const form = new FormData()
    if (body) form.append("body", body)
    form.append("attachment", input.attachment)
    payload = form
  } else payload = { body }
  const res = await apiClient.post<ApiResponse<ApiThread>>(
    threadPath(side, applicationId),
    payload
  )
  return res.data.data
}
