"use client"

import { useState } from "react"

import { CheckGrid } from "@/components/shared/check-grid"
import { FormField } from "@/components/shared/form-field"
import { Kv, KvLines } from "@/components/shared/key-value"
import { Modal } from "@/components/shared/modal"
import { NativeSelect } from "@/components/shared/native-select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DATES, DOC_TYPES } from "@/data/catalog"
import { CLUB } from "@/data/club-copy"
import { fmtEuro, placesLabel } from "@/features/academies/search"
import type {
  EnrichedIntake,
  EnrichedListing,
} from "@/features/academies/types"
import {
  sendMessage,
  setDocumentStatus,
  transitionApplication,
} from "@/features/applications/actions"
import type { ApplicantView } from "@/features/applications/applicant"
import {
  COMMISSION_RATE,
  commission,
  paymentPlan,
  planTotals,
} from "@/features/applications/flow"
import type { Application } from "@/features/applications/types"

export type DecisionKind = "info" | "accept" | "decline" | "enroll"

type Props = {
  kind: DecisionKind | null
  onClose: () => void
  app: Application
  who: ApplicantView
  listing: EnrichedListing
  intake: EnrichedIntake
  today: string
  author: string
  onDone: (message: string) => void
}

/* AmDecision (js/amk-host.jsx): request information, accept, decline, move to enrollment. */
export function DecisionDialog(props: Props) {
  const { kind, onClose } = props
  return kind ? (
    <DecisionForm key={kind} {...props} kind={kind} onClose={onClose} />
  ) : null
}

/* Mounted fresh each time a decision opens, so its fields always start empty. */
function DecisionForm({
  kind,
  onClose,
  app,
  who,
  listing: l,
  intake,
  today,
  author,
  onDone,
}: Props & { kind: DecisionKind }) {
  const t = CLUB.decision
  const [note, setNote] = useState("")
  const [docs, setDocs] = useState<string[]>([])
  const [reason, setReason] = useState("")
  const [err, setErr] = useState("")
  const first = who.name.split(" ")[0]
  const plan =
    kind === "enroll" ? paymentPlan(l, intake, today, app.optional ?? []) : []
  const planTotal = planTotals(plan).total

  const cfg: Record<
    DecisionKind,
    { title: string; cta: string; run: () => string | false }
  > = {
    info: {
      title: t.info.title,
      cta: t.info.cta,
      run: () => {
        if (!note.trim()) {
          setErr(t.info.error)
          return false
        }
        docs.forEach((type) => setDocumentStatus(app.id, type, "needs_update"))
        transitionApplication(app.id, "info_required", "academy", note.trim())
        sendMessage(app.id, "academy", author, note.trim())
        return t.info.done
      },
    },
    accept: {
      title: `Accept ${who.name}?`,
      cta: t.accept.cta,
      run: () => {
        transitionApplication(app.id, "accepted", "academy", "")
        sendMessage(
          app.id,
          "academy",
          author,
          note.trim() ||
            `We’re pleased to offer ${first} a place. We’ll send the enrollment payment request shortly.`
        )
        return `${who.name} accepted. Move them to enrollment to request payment.`
      },
    },
    decline: {
      title: `Decline ${who.name}’s application?`,
      cta: t.decline.cta,
      run: () => {
        if (!reason) {
          setErr(t.decline.error)
          return false
        }
        const text = reason + (note.trim() ? ` ${note.trim()}` : "")
        transitionApplication(app.id, "rejected", "academy", text)
        return t.decline.done
      },
    },
    enroll: {
      title: t.enroll.title,
      cta: t.enroll.cta,
      run: () => {
        transitionApplication(app.id, "enrollment_pending", "academy", "")
        sendMessage(
          app.id,
          "academy",
          author,
          note.trim() || t.enroll.defaultMessage
        )
        return t.enroll.done
      },
    },
  }
  const c = cfg[kind]
  const submit = () => {
    const msg = c.run()
    if (msg) {
      onClose()
      onDone(msg)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={c.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button
            variant={kind === "decline" ? "danger" : "primary"}
            onClick={submit}
          >
            {c.cta}
          </Button>
        </>
      }
    >
      {kind === "info" ? (
        <>
          <FormField id="amk-d-note" label={t.info.label} required error={err}>
            {(p) => (
              <Textarea
                {...p}
                data-autofocus
                value={note}
                placeholder={t.info.placeholder}
                onChange={(e) => {
                  setNote(e.target.value)
                  setErr("")
                }}
              />
            )}
          </FormField>
          <fieldset className="m-0 grid min-w-0 gap-1.5 border-0 p-0">
            <legend className="p-0 text-fs-14 font-semibold text-fg-1">
              {t.info.docsLegend}
              <span className="ml-1 text-fs-12 font-medium text-fg-3">
                {t.info.optional}
              </span>
            </legend>
            <CheckGrid
              options={(app.documents ?? []).map((d) => ({
                value: d.type,
                label: DOC_TYPES[d.type].label,
              }))}
              value={docs}
              onChange={setDocs}
            />
          </fieldset>
        </>
      ) : null}
      {kind === "accept" ? (
        <>
          <p className="text-fs-16 leading-lh-relaxed text-fg-2">
            {who.name} will be offered a place in <b>{l.title}</b>, starting{" "}
            {DATES.fmt(intake.start)}. {placesLabel(intake.placesLeft)} before
            this offer.
          </p>
          <FormField
            id="amk-d-welcome"
            label={t.accept.label}
            hint={t.accept.hint}
          >
            {(p) => (
              <Textarea
                {...p}
                data-autofocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </FormField>
        </>
      ) : null}
      {kind === "decline" ? (
        <>
          <FormField
            id="amk-d-reason"
            label={t.decline.reason}
            required
            error={err}
            hint={t.decline.reasonHint}
          >
            {(p) => (
              <NativeSelect
                {...p}
                data-autofocus
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  setErr("")
                }}
              >
                <option value="">{t.decline.choose}</option>
                {t.decline.reasons.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField id="amk-d-extra" label={t.decline.note}>
            {(p) => (
              <Textarea
                {...p}
                value={note}
                placeholder={t.decline.notePlaceholder}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </FormField>
        </>
      ) : null}
      {kind === "enroll" ? (
        <>
          <p className="text-fs-16 leading-lh-relaxed text-fg-2">
            The family receives this payment schedule. Paying the items that
            confirm the place enrolls {first}.
          </p>
          <KvLines>
            {plan.map((i) => (
              <Kv
                key={i.id}
                label={`${i.label}${i.required ? ` · ${t.enroll.confirmsPlace}` : ""} — due ${DATES.fmt(i.due)}`}
              >
                {fmtEuro(i.amount)}
              </Kv>
            ))}
            <Kv label={t.enroll.total} total>
              {fmtEuro(planTotal)}
            </Kv>
          </KvLines>
          <p className="text-fs-14 text-fg-3">
            Golafly marketplace commission: {Math.round(COMMISSION_RATE * 100)}%
            of collected payments ({fmtEuro(commission(planTotal))} on this
            plan).
          </p>
          <FormField id="amk-d-enroll" label={t.enroll.label}>
            {(p) => (
              <Textarea
                {...p}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </FormField>
        </>
      ) : null}
    </Modal>
  )
}
