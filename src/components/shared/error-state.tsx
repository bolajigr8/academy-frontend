"use client"

import { Button } from "@/components/ui/button"
import { INFRA } from "@/data/copy"

import { EmptyState } from "./empty-state"

type Props = {
  /** The message to show (see getApiErrorMessage); defaults to the generic text. */
  message?: string
  onRetry?: () => void
}

/* Built on EmptyState (AmEmpty). Infrastructure, not in the prototype: see INFRA in data/copy.ts */
export function ErrorState({ message, onRetry }: Props) {
  return (
    <EmptyState
      icon="alert"
      title={INFRA.error.title}
      text={message ?? INFRA.error.text}
      cta={
        onRetry ? (
          <Button variant="primary" onClick={onRetry}>
            {INFRA.error.cta}
          </Button>
        ) : undefined
      }
    />
  )
}
