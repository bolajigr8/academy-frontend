"use client"

import { toast } from "sonner"

type NotifyAction = {
  label: string
  run: () => void
}

type Tone = "success" | "error" | "info"

/* Durations from useAmToast (js/amk-core.jsx): 6000ms with an action, else 3800ms. */
const DURATION_WITH_ACTION = 6000
const DURATION = 3800

/*
 * Every error shares one toast id, so a newer error replaces the previous one
 * instead of stacking (for example the generic "request failed" toast is
 * replaced by the form's own "There are 2 things to fix").
 */
const ERROR_ID = "gf-error"

/**
 * Shows a shadcn Sonner toast (top-right). Confirmations ("Changes saved.")
 * are success toasts; an optional action button (for example "Undo") keeps
 * the toast a little longer.
 */
export function notify(
  message: string,
  action?: NotifyAction,
  tone: Tone = "success",
  description?: string
) {
  const options = {
    description,
    duration: action || tone === "error" ? DURATION_WITH_ACTION : DURATION,
    action: action
      ? { label: action.label, onClick: () => action.run() }
      : undefined,
  }
  if (tone === "error") toast.error(message, { ...options, id: ERROR_ID })
  else if (tone === "info") toast.info(message, options)
  else toast.success(message, options)
}

/** A failed request or a form that cannot be sent: an error toast (stays a little longer). */
export function notifyError(message: string, description?: string) {
  notify(message, undefined, "error", description)
}
