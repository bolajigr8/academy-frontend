import type { ApiMoney } from "@/lib/api/types"
import { apiClient } from "@/lib/api/client"
import type { ApiResponse } from "@/lib/api/types"

/*
 * Week 3 part 2, sections 13 and 16: the academy dashboard and Golafly's
 * marketplace overview. Percentages are numbers (100, 12.5); revenue is one
 * line per currency (never added together). The only place these are called.
 */

export type DateRange = { from?: string; to?: string }

export type ApiDashboard = {
  range: { from: string; to: string }
  period: {
    applications_received: number
    accepted_applications: number
    enrolled_players: number
    listing_views: number
    view_to_application: {
      applications: number
      views: number
      rate: number | null
    }
    application_to_enrollment: {
      submitted: number
      enrolled: number
      rate: number | null
    }
    revenue: {
      currency: string
      gross_minor: number
      commission_minor: number
      net_minor: number
    }[]
  }
  snapshot: {
    pending_applications: number
    active_listings: number
    not_published_listings: number
  }
  views_by_week: { week_start: string; views: number }[]
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
  academy: (r: DateRange) => [...dashboardKeys.all, "academy", r] as const,
  overview: (r: DateRange) => [...dashboardKeys.all, "overview", r] as const,
}

/** GET /academy/portal/dashboard?from&to (default: the last 30 days) */
export async function getPortalDashboard(
  range: DateRange
): Promise<ApiDashboard> {
  const res = await apiClient.get<ApiResponse<ApiDashboard>>(
    "/academy/portal/dashboard",
    { params: range }
  )
  return res.data.data
}

export type ApiOverview = {
  range: { from: string; to: string }
  period: {
    applications_submitted: number
    application_response_rate: {
      measured: number
      answered: number
      rate: number | null
    }
    repeat_applications: { applications: number; applicants: number }
    searches: number
    listing_views: number
    new_players_and_parents: number
    saved_listings_added: number
    verified_reviews_added: number
    revenue: {
      currency: string
      gmv_minor: number
      commission_minor: number
      unconverted: {
        currency: string
        paid_rows: number
        gross_minor: number
        commission_minor: number
      }[]
    }
  }
  snapshot: {
    verified_academies: number
    active_listings: number
    registered_players_and_parents: number
    saved_listings: number
    verified_reviews: number
  }
}

/** GET /academy/admin/overview?from&to (same range rules as the dashboard) */
export async function getAdminOverview(range: DateRange): Promise<ApiOverview> {
  const res = await apiClient.get<ApiResponse<ApiOverview>>(
    "/academy/admin/overview",
    { params: range }
  )
  return res.data.data
}

export type { ApiMoney }
