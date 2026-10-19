"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { Icon } from "@/components/icons/icon"
import { FieldError } from "@/components/shared/form-field"
import { notifyError } from "@/components/shared/notify"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { LIVE } from "@/data/live-copy"
import { fmtStamp, STATUS } from "@/features/applications/flow"
import { downloadPrivateFile } from "@/features/family/api"
import {
  getThread,
  sendMessage,
  type ApiThread,
  type ThreadSide,
} from "@/features/messages/api"
import { messagesKeys, stampOf } from "@/features/messages/conversations"
import { familyKeys } from "@/features/family/query-keys"
import { getApiFieldErrors, getApiStatus } from "@/lib/api/errors"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const t = LIVE.messages
/** A PDF or an image, as application documents (section 14) */
const FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"]
/** "poll the open thread every 5 to 10 seconds" (section 14) */
export const THREAD_POLL_MS = 7000

const lineIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: easeOut },
} as const

/*
 * One conversation in api mode (week 2 part 2, section 14), drawn like the
 * prototype's AmThread: status lines and bubbles in the backend's order
 * (oldest first). Opening it marks the other side's messages read, so the
 * lists and badges are refreshed after each read. Sending posts the body
 * and/or one attachment and replaces the thread with the answer.
 */
export function LiveThread({
  side,
  applicationId,
}: {
  side: ThreadSide
  applicationId: number
}) {
  const queryClient = useQueryClient()
  const mine = side === "me" ? "applicant" : "academy"
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLOListElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const thread = useQuery({
    queryKey: messagesKeys.thread(side, applicationId),
    queryFn: () => getThread(side, applicationId, true),
    refetchInterval: THREAD_POLL_MS,
    retry: false,
  })
  const items = thread.data?.items ?? []
  const count = items.length

  // reading marks the other side's messages read: refresh the lists and
  // badges when the thread opens and when a new line arrives (not every poll)
  const loaded = thread.data !== undefined
  useEffect(() => {
    if (!loaded) return
    void queryClient.invalidateQueries({ queryKey: messagesKeys.list(side) })
    if (side === "me")
      void queryClient.invalidateQueries({ queryKey: familyKeys.dashboard() })
  }, [loaded, count, side, queryClient])

  useEffect(() => {
    // keep the newest line visible by scrolling the list itself, never the page
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [count])

  if (thread.isPending)
    return (
      <p className="p-5 text-fs-14 text-fg-3" aria-busy="true">
        {t.loading}
      </p>
    )
  if (!thread.data)
    return (
      <p className="rounded-md border border-dashed border-border-2 p-5 text-center text-fs-14 text-fg-3">
        {getApiStatus(thread.error) === 422 ? t.notSent : LIVE.requestFailed}
      </p>
    )

  const data: ApiThread = thread.data
  const send = async (e: Pick<FormEvent, "preventDefault">) => {
    e.preventDefault()
    if ((!text.trim() && !file) || busy) return
    setBusy(true)
    setErrors({})
    try {
      const next = await sendMessage(side, applicationId, {
        body: text,
        attachment: file,
      })
      queryClient.setQueryData(messagesKeys.thread(side, applicationId), next)
      void queryClient.invalidateQueries({ queryKey: messagesKeys.list(side) })
      setText("")
      setFile(null)
    } catch (err) {
      // the toast shows the backend's message (429, thread_closed, …)
      setErrors(
        getApiFieldErrors(err, {
          body: `msg-body-${applicationId}`,
          attachment: `msg-body-${applicationId}`,
        }).byControl
      )
      // thread_closed: the application was cancelled meanwhile
      void thread.refetch()
    } finally {
      setBusy(false)
    }
  }
  const inputId = `msg-body-${applicationId}`

  return (
    <div className="grid min-w-0 gap-3">
      <ol
        ref={listRef}
        aria-live="polite"
        className="grid max-h-[520px] gap-3 overflow-y-auto p-1 pl-0 le-1024:max-h-none le-1024:overflow-visible"
      >
        {items.map((line, i) =>
          line.kind === "status" ? (
            <motion.li
              {...lineIn}
              key={`s${i}`}
              className="grid justify-items-center gap-1 text-center text-fs-12 text-fg-3"
            >
              <>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-[99px] border border-border-2 bg-bg-3 px-[10px] py-1 font-semibold text-fg-2">
                  <Icon name="flag" size={13} />
                  <>
                    {STATUS[line.to_status]?.label ?? line.to_status}
                    {line.note ? ` — ${line.note}` : ""}
                  </>
                </span>
                <small>
                  {line.actor_name ? `${line.actor_name} · ` : ""}
                  {fmtStamp(stampOf(line.at))}
                </small>
              </>
            </motion.li>
          ) : (
            <motion.li
              {...lineIn}
              key={`m${line.id}`}
              className={cn(
                "grid max-w-[82%] justify-items-start gap-1 le-480:max-w-[92%]",
                line.sender_side === mine &&
                  "justify-items-end justify-self-end"
              )}
            >
              <>
                <div
                  className={cn(
                    "grid gap-2 rounded-[14px_14px_14px_4px] border border-border-2 bg-bg-3 px-[14px] py-[10px] text-fs-14 leading-lh-relaxed [overflow-wrap:anywhere] text-fg-1",
                    line.sender_side === mine &&
                      "rounded-[14px_14px_4px_14px] border-fg-1 bg-fg-1 text-bg-0"
                  )}
                >
                  {line.body ? (
                    <p className="whitespace-pre-line">{line.body}</p>
                  ) : null}
                  {line.attachment ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "justify-self-start",
                        line.sender_side === mine && "text-bg-0"
                      )}
                      onClick={() =>
                        downloadPrivateFile(
                          line.attachment?.download_url ?? "",
                          line.attachment?.name ?? t.attachment
                        ).catch(() => undefined)
                      }
                    >
                      <Icon name="clip" size={14} /> {line.attachment.name}
                    </Button>
                  ) : null}
                </div>
                <small className="text-[11px] text-fg-3">
                  {line.sender_side === mine ? t.you : line.sender_name} ·{" "}
                  {fmtStamp(stampOf(line.at))}
                </small>
              </>
            </motion.li>
          )
        )}
        {!items.some((i) => i.kind === "message") ? (
          <li className="rounded-md border border-dashed border-border-2 p-5 text-center text-fs-14 text-fg-3">
            {t.empty}
          </li>
        ) : null}
      </ol>
      {data.can_send ? (
        <form onSubmit={send} className="grid gap-2" noValidate>
          {file ? (
            <span className="inline-flex max-w-full items-center gap-2 justify-self-start rounded-pill border border-border-2 px-3 py-1 text-fs-13">
              <Icon name="clip" size={14} />
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                aria-label={t.removeAttachment}
                onClick={() => setFile(null)}
                className="grid size-6 place-items-center rounded-full border-0 bg-transparent text-fg-3 hover:text-fg-1"
              >
                <Icon name="x" size={12} />
              </button>
            </span>
          ) : null}
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={FILE_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                e.target.value = ""
                if (f && !FILE_TYPES.includes(f.type)) {
                  notifyError(t.attachRefused)
                  return
                }
                setFile(f)
              }}
            />
            <Button
              variant="secondary"
              aria-label={`${t.attach} (${t.attachTypes})`}
              onClick={() => fileRef.current?.click()}
              className="min-h-[52px] px-3"
            >
              <Icon name="clip" size={18} />
            </Button>
            <label className="am-sr" htmlFor={inputId}>
              {t.message}
            </label>
            <Textarea
              id={inputId}
              rows={2}
              className="min-h-[52px]"
              placeholder={side === "me" ? t.writeAcademy : t.writeFamily}
              value={text}
              aria-invalid={errors[inputId] ? true : undefined}
              aria-describedby={errors[inputId] ? `${inputId}-err` : undefined}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send(e)
              }}
            />
            <Button
              type="submit"
              disabled={!text.trim() && !file}
              aria-busy={busy}
              className="min-h-[52px]"
            >
              <Icon name="send" size={16} />{" "}
              <span className="le-480:am-sr">{t.send}</span>
            </Button>
          </div>
          {errors[inputId] ? (
            <FieldError id={`${inputId}-err`}>{errors[inputId]}</FieldError>
          ) : null}
        </form>
      ) : (
        <p className="rounded-md bg-bg-2 p-3 text-center text-fs-13 text-fg-3">
          {t.closed}
        </p>
      )}
    </div>
  )
}
