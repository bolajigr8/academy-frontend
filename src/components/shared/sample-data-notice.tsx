"use client"

import { usePathname } from "next/navigation"

import { Notice } from "@/components/shared/notice"
import { LIVE } from "@/data/live-copy"
import { API_MODE, pageOnSampleData } from "@/lib/data-source"

/**
 * api mode only: a clear notice on pages that still show sample data, so the
 * demo never presents made-up data as real. `force` marks a page whose data is
 * sample data for another reason (a demo listing opened from a demo card).
 */
export function SampleDataNotice({
  force = false,
  className,
}: {
  force?: boolean
  className?: string
}) {
  const pathname = usePathname()
  if (!API_MODE || !(force || pageOnSampleData(pathname))) return null
  return (
    <Notice tone="warning" icon="info" className={className}>
      {LIVE.sampleData}
    </Notice>
  )
}
