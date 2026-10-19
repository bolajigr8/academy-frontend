"use client"

import { useEffect, useImperativeHandle, useRef, type Ref } from "react"

import { notifyError } from "./notify"

/** What a form calls after a failed submit: summaryRef.current?.focus() */
export type ErrorSummaryHandle = { focus: () => void }

type Props = {
  errors: Record<string, string>
  /** kept for the forms that pass it; the toast now shows the message itself */
  labels?: Record<string, string>
  ref?: Ref<ErrorSummaryHandle>
}

/*
 * AmErrorSummary (js/amk-core.jsx, css/amk-core.css:177-182).
 * Change requested by the team (Oct 2026): the red summary box is no longer
 * shown. A failed submit raises an error toast (top-right) that leads with
 * the first problem itself ("Give the program a name"), adds "and N more to
 * fix" when there are several, and moves focus to the first field to fix.
 * Each field keeps its own message.
 *
 * Forms with a ref call ref.focus() after every failed submit (so pressing
 * Save again repeats the toast). A form without a ref gets the toast when its
 * set of errors changes.
 */
export function ErrorSummary({ errors, ref }: Props) {
  const announce = () => {
    const keys = Object.keys(errors)
    const first = keys[0]
    if (first === undefined) return
    // the toast leads with the actual problem; more than one adds a count
    const rest = keys.length - 1
    notifyError(
      errors[first],
      rest > 0
        ? rest === 1
          ? "and 1 more to fix"
          : `and ${rest} more to fix`
        : undefined
    )
    const el =
      document.getElementById(first) ??
      document.getElementById(`${first}-first`)
    if (el) {
      el.focus({ preventScroll: true })
      el.scrollIntoView({ block: "center", behavior: "auto" })
    }
  }

  useImperativeHandle(ref, () => ({ focus: announce }))

  // forms without a ref: announce when the set of errors changes
  const signature = ref ? "" : JSON.stringify(errors)
  const last = useRef("{}")
  const announceRef = useRef(announce)
  useEffect(() => {
    announceRef.current = announce
  })
  useEffect(() => {
    if (ref || signature === last.current) return
    last.current = signature
    if (signature !== "{}") announceRef.current()
  }, [ref, signature])

  return null

  /* The summary box, kept for reference (no longer rendered):
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-sm border border-l-4 border-gf-danger bg-surface-elevated px-5 py-4"
    >
      <h2 className="mb-2 text-fs-16 font-bold text-fg-1">
        {title(keys.length)}
      </h2>
      <ul className="grid list-disc gap-1 pl-5">
        {keys.map((k) => (
          <li key={k}>
            <a href={`#${k}`} className="text-fs-14 text-fg-1 underline underline-offset-[3px]">
              {(labels?.[k] ? `${labels[k]}: ` : "") + errors[k]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
  */
}
