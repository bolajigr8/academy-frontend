"use client"

import { motion } from "framer-motion"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { Icon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { fmtStamp, STATUS } from "@/features/applications/flow"
import { sendMessage } from "@/features/applications/actions"
import type {
  Actor,
  Application,
  ThreadMessage,
} from "@/features/applications/types"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Props = {
  app: Application
  messages: ThreadMessage[]
  /** which side is writing */
  me: Actor
  meName: string
}

type Line =
  | { kind: "msg"; at: string; message: ThreadMessage }
  | { kind: "event"; at: string; event: Application["events"][number] }

/* Each line slides in as it appears (a message just sent, a status change). */
const lineIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: easeOut },
} as const

/* AmThread + .amk-thread*, .amk-msg*: js/amk-shell.jsx, css/amk-app.css:144-158 and 392 */
export function MessageThread({ app, messages, me, meName }: Props) {
  const [text, setText] = useState("")
  const listRef = useRef<HTMLOListElement>(null)

  const lines: Line[] = [
    ...messages.map((m): Line => ({ kind: "msg", at: m.at, message: m })),
    ...(app.events ?? []).map((e): Line => ({
      kind: "event",
      at: e.at,
      event: e,
    })),
  ].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))

  useEffect(() => {
    /* Keep the newest line visible by scrolling the list itself. The prototype used
       scrollIntoView, which also scrolled the whole page down on load. */
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [lines.length])

  const send = (e: Pick<FormEvent, "preventDefault">) => {
    e.preventDefault()
    if (sendMessage(app.id, me, meName, text)) setText("")
  }
  const closed = app.status === "cancelled"
  const inputId = `amk-msg-${app.id}`

  return (
    <div className="grid min-w-0 gap-3">
      <ol
        ref={listRef}
        className="grid max-h-[520px] gap-3 overflow-y-auto overscroll-contain p-1 pl-0"
      >
        {lines.length === 0 ? (
          <li className="rounded-md border border-dashed border-border-2 p-5 text-center text-fs-14 text-fg-3">
            No messages yet. Questions about this application go here.
          </li>
        ) : null}
        {lines.map((line, i) =>
          line.kind === "event" ? (
            <motion.li
              {...lineIn}
              key={`e${i}`}
              className="flex flex-wrap justify-center gap-2 text-center text-fs-12 text-fg-3"
            >
              <>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-[99px] border border-border-2 bg-bg-3 px-[10px] py-1 font-semibold text-fg-2">
                  <Icon name="flag" size={13} />
                  {STATUS[line.event.status].label}
                  {line.event.note ? ` — ${line.event.note}` : ""}
                </span>
                <small>{fmtStamp(line.at)}</small>
              </>
            </motion.li>
          ) : (
            <motion.li
              {...lineIn}
              key={`m${i}`}
              className={cn(
                "grid max-w-[82%] justify-items-start gap-1 le-480:max-w-[92%]",
                line.message.from === me && "justify-items-end justify-self-end"
              )}
            >
              <>
                <div
                  className={cn(
                    "rounded-[14px_14px_14px_4px] border border-border-2 bg-bg-3 px-[14px] py-[10px] text-fs-14 leading-lh-relaxed text-fg-1",
                    line.message.from === me &&
                      "rounded-[14px_14px_4px_14px] border-fg-1 bg-fg-1 text-bg-0"
                  )}
                >
                  <p>{line.message.text}</p>
                </div>
                <small className="text-[11px] text-fg-3">
                  {line.message.from === me ? "You" : line.message.author} ·{" "}
                  {fmtStamp(line.at)}
                </small>
              </>
            </motion.li>
          )
        )}
      </ol>
      {!closed ? (
        <form
          onSubmit={send}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2"
        >
          <label className="am-sr" htmlFor={inputId}>
            Message
          </label>
          <Textarea
            id={inputId}
            rows={2}
            className="min-h-[52px]"
            placeholder={
              me === "family" ? "Write to the academy…" : "Write to the family…"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(e)
            }}
          />
          <Button type="submit" disabled={!text.trim()}>
            <Icon name="send" size={16} /> Send
          </Button>
        </form>
      ) : null}
    </div>
  )
}
