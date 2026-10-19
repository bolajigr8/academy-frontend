import { apiClient } from "@/lib/api/client"
import type { ApiMoney, ApiPage, ApiResponse } from "@/lib/api/types"
import type {
  ApiAppDocument,
  ApiAppQuestion,
  ApiAppStatus,
  ApiTimelineEntry,
} from "@/features/family/api"

/*
 * Week 2 part 2, sections 11 and 12: the academy inbox, the applicant page,
 * document review and decisions (academy token). The only place these
 * endpoints are called.
 */

export type ApiInboxItem = {
  id: number
  reference: string | null
  status: Exclude<ApiAppStatus, "draft">
  applicant: { name: string; relationship: string }
  player: {
    first_name: string
    last_name: string
    date_of_birth: string | null
    primary_position: string | null
  }
  listing: { id: number; title: string }
  intake: { id: number; label: string | null; start_date: string }
  documents_count: number
  documents_accepted_count: number
  unread_messages: number
  /** the conversation preview (section 14), null before the first message */
  last_message: {
    body: string | null
    has_attachment: boolean
    sender_side: "applicant" | "academy"
    sent_at: string
  } | null
  submitted_at: string | null
  updated_at: string
}

export type ApiInboxPage = ApiPage<ApiInboxItem> & {
  meta: ApiPage<ApiInboxItem>["meta"] & {
    status_counts: Record<string, number>
  }
}

export type ApiApplicant = {
  id: number
  reference: string | null
  status: Exclude<ApiAppStatus, "draft">
  applicant: { name: string; email: string; relationship: string }
  /** the profile frozen when it was sent; no photo */
  player: Record<string, unknown> & {
    first_name: string
    last_name: string
    date_of_birth: string | null
  }
  listing: {
    id: number
    title: string
    age_min: number | null
    age_max: number | null
    price: ApiMoney | null
    payment_frequency: string | null
  }
  intake: {
    id: number
    label?: string | null
    start_date: string
    places_left?: number | null
  }
  questions: ApiAppQuestion[]
  required_documents: string[]
  documents: ApiAppDocument[]
  info_request_note: string | null
  decision_reason: string | null
  consent_at: string | null
  submitted_at: string | null
  decided_at: string | null
  timeline: ApiTimelineEntry[]
}

const path = (id: number) => `/academy/portal/applications/${id}`
const data = <T>(r: { data: ApiResponse<T> }) => r.data.data

/** GET /academy/portal/applications (status list, listing_id, intake_id, search; per_page <= 50) */
export async function listInbox(
  params: {
    status?: string[]
    listing_id?: number
    intake_id?: number
    search?: string
    page?: number
    per_page?: number
  },
  /** a background count (the Messages badge): a failure shows no toast */
  silent = false
): Promise<ApiInboxPage> {
  const res = await apiClient.get<ApiInboxPage>(
    "/academy/portal/applications",
    {
      params: {
        per_page: 50,
        ...params,
        status: params.status?.length ? params.status.join(",") : undefined,
      },
      ...(silent ? { headers: { "X-Silent-Error": "1" } } : {}),
    }
  )
  return res.data
}

/** GET …/{id}: opening a submitted application moves it to under_review (once) */
export async function getApplicant(id: number): Promise<ApiApplicant> {
  return data(await apiClient.get<ApiResponse<ApiApplicant>>(path(id)))
}

/** POST …/documents/{docId}/review {status: accepted | needs_update} */
export async function reviewDocument(
  id: number,
  documentId: number,
  status: "accepted" | "needs_update"
): Promise<ApiApplicant> {
  return data(
    await apiClient.post<ApiResponse<ApiApplicant>>(
      `${path(id)}/documents/${documentId}/review`,
      { status }
    )
  )
}

/** POST …/request-info {note, document_ids?} -> info_required */
export async function requestInfo(
  id: number,
  note: string,
  documentIds: number[]
): Promise<ApiApplicant> {
  return data(
    await apiClient.post<ApiResponse<ApiApplicant>>(
      `${path(id)}/request-info`,
      {
        note,
        ...(documentIds.length ? { document_ids: documentIds } : {}),
      }
    )
  )
}

/** POST …/accept {message?} (empty -> the backend stores nothing; the design's standard text is shown) */
export async function acceptApplication(
  id: number,
  message: string
): Promise<ApiApplicant> {
  return data(
    await apiClient.post<ApiResponse<ApiApplicant>>(
      `${path(id)}/accept`,
      message.trim() ? { message: message.trim() } : {}
    )
  )
}

/** POST …/reject {reason}: the chosen reason and the optional note as one text */
export async function rejectApplication(
  id: number,
  reason: string
): Promise<ApiApplicant> {
  return data(
    await apiClient.post<ApiResponse<ApiApplicant>>(`${path(id)}/reject`, {
      reason,
    })
  )
}
