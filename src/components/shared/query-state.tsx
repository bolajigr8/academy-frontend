"use client"

import type { ReactNode } from "react"

import { getApiErrorMessage } from "@/lib/api/errors"
import { cn } from "@/lib/utils"

import { ErrorState } from "./error-state"

type QueryLike<T> = {
  data: T | undefined
  error: unknown
  isPending: boolean
  isError: boolean
  isFetching: boolean
  refetch: () => unknown
}

type Props<T> = {
  query: QueryLike<T>
  /** Shown while the first load is pending. Give it the real height of the content. */
  skeleton: ReactNode
  /** Shown when the data is empty. */
  empty: ReactNode
  isEmpty?: (data: T) => boolean
  /** Used when the error carries no message of its own. */
  errorFallback: string
  children: (data: T) => ReactNode
}

/**
 * loading -> skeleton at real height, error -> message with retry, empty ->
 * empty state, data -> content. A background refetch ("updating") dims the
 * content a little and sets aria-busy, with no layout shift.
 */
export function QueryState<T>({
  query,
  skeleton,
  empty,
  isEmpty,
  errorFallback,
  children,
}: Props<T>) {
  if (query.isPending) {
    return (
      <div aria-busy="true" aria-live="polite">
        {skeleton}
      </div>
    )
  }
  if (query.isError || query.data === undefined) {
    return (
      <ErrorState
        message={getApiErrorMessage(query.error, errorFallback)}
        onRetry={() => void query.refetch()}
      />
    )
  }
  if (isEmpty?.(query.data)) return <>{empty}</>
  return (
    <div
      aria-busy={query.isFetching}
      className={cn(
        "transition-opacity duration-(--dur-base) ease-out",
        query.isFetching && "opacity-70"
      )}
    >
      {children(query.data)}
    </div>
  )
}
