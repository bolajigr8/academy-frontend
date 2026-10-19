"use client"

import { ErrorState } from "@/components/shared/error-state"

/* Infrastructure, not in the prototype. */
export default function Error({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <main id="main" className="am-container py-16">
      <ErrorState onRetry={() => retry()} />
    </main>
  )
}
