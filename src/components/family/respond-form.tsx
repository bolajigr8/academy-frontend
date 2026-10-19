"use client"

import { motion } from "framer-motion"
import { useState, type FormEvent } from "react"

import { Icon } from "@/components/icons/icon"
import { FieldError } from "@/components/shared/form-field"
import { notify } from "@/components/shared/notify"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DOC_TYPES } from "@/data/catalog"
import { FAMILY } from "@/data/family-copy"
import type { DocTypeId } from "@/data/types"
import { h4 } from "@/components/program/program-blocks"
import {
  sendMessage,
  transitionApplication,
  uploadDocument,
} from "@/features/applications/actions"
import { fmtStamp } from "@/features/applications/flow"
import type { Application } from "@/features/applications/types"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

/* Respond (account/application.html) + .amk-respond*: answer an information request */
export function RespondForm({
  app,
  academy,
  playerId,
  author,
}: {
  app: Application
  academy: string
  playerId: string
  author: string
}) {
  const t = FAMILY.respond
  const ev = app.events.filter((e) => e.status === "info_required").pop()
  const need = (app.documents ?? []).filter(
    (d) => d.status === "missing" || d.status === "needs_update"
  )
  const [text, setText] = useState("")
  const [files, setFiles] = useState<Partial<Record<DocTypeId, File>>>({})
  const [err, setErr] = useState("")

  const send = (e: FormEvent) => {
    e.preventDefault()
    const chosen = Object.entries(files) as [DocTypeId, File][]
    if (!text.trim() && !chosen.length) {
      setErr(t.error)
      return
    }
    chosen.forEach(([type, f]) => uploadDocument(playerId, type, f, app.id))
    sendMessage(app.id, "family", author, text.trim() || t.defaultMessage)
    transitionApplication(app.id, "under_review", "family", t.note)
    notify(t.done)
  }

  return (
    <motion.form
      id="respond"
      noValidate
      onSubmit={send}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="grid scroll-mt-24 gap-[14px] rounded-md border-2 border-gf-warning bg-surface-elevated p-[18px]"
    >
      <h2 className={h4}>{t.title(academy)}</h2>
      {ev ? (
        <p className="rounded-sm bg-bg-3 px-[14px] py-3 text-fs-14 text-fg-1">
          “{ev.note}”
          <small className="mt-1 block text-fs-12 text-fg-3">
            {t.requested} {fmtStamp(ev.at)}
          </small>
        </p>
      ) : null}
      {need.map((d) => {
        const f = files[d.type]
        return (
          <div
            key={d.type}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[14px] rounded-md border border-border-2 bg-surface-elevated px-4 py-[14px] le-720:grid-cols-[auto_minmax(0,1fr)]"
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-[42px] place-items-center rounded-[10px] bg-bg-3 text-fg-2",
                f && "bg-gf-neon text-text-on-neon"
              )}
            >
              <Icon name={f ? "checkcircle" : "doc"} size={20} />
            </span>
            <span className="grid min-w-0 gap-0.5">
              <b>{DOC_TYPES[d.type].label}</b>
              <small className="text-fs-13 [overflow-wrap:anywhere] text-fg-3">
                {f ? f.name : DOC_TYPES[d.type].hint}
              </small>
            </span>
            <span className="flex flex-wrap justify-end gap-1.5 le-720:col-[1/-1] le-720:justify-start">
              <input
                type="file"
                id={`amk-up-${d.type}`}
                accept=".pdf,.jpg,.jpeg,.png"
                className="peer am-sr"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setFiles({ ...files, [d.type]: file })
                    setErr("")
                  }
                }}
              />
              <label
                htmlFor={`amk-up-${d.type}`}
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amk-accent-ink"
                )}
              >
                <Icon name="upload" size={15} />
                {f ? t.replace : t.upload}
              </label>
            </span>
          </div>
        )
      })}
      <div className="grid gap-1.5">
        <Label htmlFor="amk-reply">{t.reply}</Label>
        <Textarea
          id="amk-reply"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setErr("")
          }}
          aria-describedby={err ? "amk-reply-err" : undefined}
          aria-invalid={err ? true : undefined}
        />
        <FieldError id="amk-reply-err">{err}</FieldError>
      </div>
      <Button type="submit" className="justify-self-start">
        <Icon name="send" size={16} /> {t.send}
      </Button>
    </motion.form>
  )
}
