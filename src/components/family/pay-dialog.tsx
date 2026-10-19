"use client"

import { useState } from "react"

import { ChoiceGroup } from "@/components/shared/choice-group"
import { Modal } from "@/components/shared/modal"
import { Notice } from "@/components/shared/notice"
import { Button } from "@/components/ui/button"
import { DATES } from "@/data/catalog"
import { DEMO_NOTE } from "@/data/copy"
import { FAMILY } from "@/data/family-copy"
import { fmtEuro } from "@/features/academies/search"
import { payItems } from "@/features/applications/actions"
import type { AppStatus } from "@/features/applications/types"
import { usePayDialog } from "@/features/family/hooks"
import { cn } from "@/lib/utils"

type Props = {
  /** the application to pay for; null keeps the dialog closed */
  appId: string | null
  /** item ids to tick on open; empty ticks the items that confirm the place */
  preselect: string[]
  onClose: () => void
  onPaid: (status: AppStatus | false) => void
}

/* AmPayModal (js/amk-shell.jsx:463): choose items and a demo method. No card fields. */
export function PayDialog(props: Props) {
  const data = usePayDialog(props.appId)
  return data ? <PayForm key={props.appId} {...props} data={data} /> : null
}

/* Mounted fresh on each open, so the ticked items start from the preselection. */
function PayForm({
  onClose,
  onPaid,
  preselect,
  data,
}: Props & { data: NonNullable<ReturnType<typeof usePayDialog>> }) {
  const { app, listing: l, items } = data
  const t = FAMILY.pay
  const [sel, setSel] = useState<string[]>(() =>
    preselect.length
      ? preselect
      : items.filter((i) => i.required).map((i) => i.id)
  )
  const [method, setMethod] = useState<"card" | "bank">("card")
  const total = items
    .filter((i) => sel.includes(i.id))
    .reduce((s, i) => s + i.amount, 0)
  const pay = () => {
    const status = payItems(app.id, sel, method)
    onClose()
    onPaid(status)
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={t.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button onClick={pay} disabled={!sel.length}>
            {t.pay(fmtEuro(total))}
          </Button>
        </>
      }
    >
      <p className="text-fs-16 leading-lh-relaxed text-fg-2">
        {l.title} · {l.academy.name}
      </p>
      <fieldset className="m-0 grid min-w-0 gap-1.5 border-0 p-0">
        <legend className="p-0 text-fs-14 font-semibold text-fg-1">
          {t.what}
        </legend>
        <div className="grid overflow-hidden rounded-md border border-border-2">
          {items.map((i) => {
            const on = sel.includes(i.id)
            return (
              <label
                key={i.id}
                className={cn(
                  "grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border-1 bg-surface-elevated px-4 py-3 text-fs-14 last:border-b-0",
                  on && "bg-tint-neon-1"
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  className="m-0 size-[18px] accent-gf-neon"
                  onChange={(e) =>
                    setSel(
                      e.target.checked
                        ? sel.concat(i.id)
                        : sel.filter((x) => x !== i.id)
                    )
                  }
                />
                <span>
                  {i.label}
                  <small className="font-medium text-fg-3">
                    {" "}
                    · {t.due} {DATES.fmt(i.due)}
                    {i.required ? t.confirms : ""}
                  </small>
                </span>
                <b>{fmtEuro(i.amount)}</b>
              </label>
            )
          })}
        </div>
      </fieldset>
      <ChoiceGroup
        id="amk-pay-method"
        name="amk-pay-method"
        legend={t.method}
        value={method}
        onChange={setMethod}
        options={t.methods.map(([value, label, sub]) => ({
          value,
          label,
          sub,
        }))}
      />
      <Notice tone="neutral" icon="info">
        {DEMO_NOTE}
      </Notice>
    </Modal>
  )
}
