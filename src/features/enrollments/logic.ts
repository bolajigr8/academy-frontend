import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import type { ApiMoney } from "@/lib/api/types"
import { addDays } from "@/lib/date"
import { formatMoney, majorToMinor } from "@/lib/money"

import type {
  ApiEnrollmentPayment,
  EnrollmentPlan,
  EnrollmentStatus,
  MoveToEnrollmentBody,
  PaymentKind,
  PaymentStatus,
} from "./api"

const t = LIVE.enrollment

/** A schedule line's name: the extra's own label, else the kind's (instalments numbered) */
export function paymentLabel(
  p: Pick<ApiEnrollmentPayment, "kind" | "label">,
  installmentNo?: number
): string {
  if (p.kind === "extra") return p.label ?? t.kinds.extra
  if (p.kind === "installment" && installmentNo)
    return `${t.kinds.installment} ${installmentNo}`
  return t.kinds[p.kind as PaymentKind]
}

/**
 * Numbers the instalments 1, 2, 3 in schedule order, per enrollment (the
 * family's payments list mixes several enrollments' lines).
 */
export function withLabels<
  T extends Pick<ApiEnrollmentPayment, "kind" | "label"> & {
    enrollment_id?: number
  },
>(rows: T[]): (T & { name: string })[] {
  const count = new Map<number, number>()
  return rows.map((r) => {
    if (r.kind !== "installment") return { ...r, name: paymentLabel(r) }
    const key = r.enrollment_id ?? 0
    const n = (count.get(key) ?? 0) + 1
    count.set(key, n)
    return { ...r, name: paymentLabel(r, n) }
  })
}

export const PAYMENT_TONE: Record<
  PaymentStatus,
  "success" | "warning" | "info" | "ghost"
> = {
  paid: "success",
  due: "warning",
  overdue: "warning",
  scheduled: "ghost",
  cancelled: "ghost",
}

export const ENROLLMENT_TONE: Record<
  EnrollmentStatus,
  "success" | "warning" | "ghost"
> = { confirmed: "success", pending: "warning", cancelled: "ghost" }

/** Money in more than one currency is never added up: "€1,870 + £400" */
export function sumByCurrency(items: ApiMoney[]): string {
  const by = new Map<string, number>()
  for (const m of items)
    by.set(m.currency, (by.get(m.currency) ?? 0) + m.amount_minor)
  if (!by.size)
    return formatMoney({ amount_minor: 0, amount: "0.00", currency: "EUR" })
  return [...by.entries()]
    .map(([currency, minor]) =>
      formatMoney({
        amount_minor: minor,
        amount: (minor / 100).toFixed(2),
        currency,
      })
    )
    .join(" + ")
}

/* ---------------- moving to enrollment (week 3 part 1, section 2) ---------------- */

/** What the listing sets (the academy chooses only the plan, the dates and extras) */
export type PlanListing = {
  currency: string
  /** minor units; 0 or null = no price */
  price: number
  deposit: number
  registrationFee: number
  /** the intake's end date: later dates may not be after it */
  intakeEnd: string | null
}

export type PlanDraft = {
  plan: EnrollmentPlan
  balanceDate: string
  installments: { key: string; amount: string; date: string }[]
  extras: { key: string; label: string; amount: string }[]
}

export type PreviewLine = {
  name: string
  amount: number
  /** "now" = by the first-payment deadline; else a date */
  due: "now" | string
  required: boolean
}

/** A plan with a deposit needs a deposit above 0 and below the price (else plan_not_available) */
export const depositPlansAvailable = (l: PlanListing) =>
  l.deposit > 0 && l.deposit < l.price

/** Nothing to pay at all: enrolled at once, no schedule, no deadline */
export const isFree = (l: PlanListing, d: PlanDraft) =>
  l.price === 0 &&
  l.registrationFee === 0 &&
  extrasMinor(l, d).every((x) => x.amount === 0)

const toMinor = (major: string, currency: string): number | null => {
  const v = major.trim().replace(",", ".")
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null
  return majorToMinor(Number(v), currency)
}

function extrasMinor(l: PlanListing, d: PlanDraft) {
  return d.extras
    .filter((x) => x.label.trim() || x.amount.trim())
    .map((x) => ({
      label: x.label.trim(),
      amount: toMinor(x.amount, l.currency) ?? 0,
    }))
}

/**
 * The schedule the backend will build, for the preview: due now (registration
 * fee, the price or the deposit, the extras) and the later lines.
 */
export function previewSchedule(
  l: PlanListing,
  d: PlanDraft
): { lines: PreviewLine[]; total: number; dueNow: number } {
  const lines: PreviewLine[] = []
  if (l.registrationFee > 0)
    lines.push({
      name: t.kinds.registration_fee,
      amount: l.registrationFee,
      due: "now",
      required: true,
    })
  if (d.plan === "full") {
    if (l.price > 0)
      lines.push({
        name: t.kinds.full,
        amount: l.price,
        due: "now",
        required: true,
      })
  } else {
    lines.push({
      name: t.kinds.deposit,
      amount: l.deposit,
      due: "now",
      required: true,
    })
  }
  for (const x of extrasMinor(l, d))
    if (x.amount > 0)
      lines.push({
        name: x.label || t.kinds.extra,
        amount: x.amount,
        due: "now",
        required: true,
      })
  if (d.plan === "deposit_balance")
    lines.push({
      name: t.kinds.balance,
      amount: Math.max(0, l.price - l.deposit),
      due: d.balanceDate || "",
      required: false,
    })
  if (d.plan === "installments")
    d.installments.forEach((r, i) =>
      lines.push({
        name: `${t.kinds.installment} ${i + 1}`,
        amount: toMinor(r.amount, l.currency) ?? 0,
        due: r.date,
        required: false,
      })
    )
  const total = lines.reduce((s, x) => s + x.amount, 0)
  const dueNow = lines
    .filter((x) => x.due === "now")
    .reduce((s, x) => s + x.amount, 0)
  return { lines, total, dueNow }
}

/** Left to schedule in instalments: the price minus the deposit and the rows so far */
export function installmentsLeft(l: PlanListing, d: PlanDraft): number {
  const planned = d.installments.reduce(
    (s, r) => s + (toMinor(r.amount, l.currency) ?? 0),
    0
  )
  return l.price - l.deposit - planned
}

/**
 * The backend's rules, checked before sending (each message keyed to its
 * field). The first-payment deadline is 7 days after the move; later dates
 * must be after its date and, when the intake ends, not after the end.
 */
export function validatePlan(
  l: PlanListing,
  d: PlanDraft,
  today: string
): Record<string, string> {
  const e: Record<string, string> = {}
  const deadline = addDays(today, 7)
  const dateOk = (date: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    date > deadline &&
    (!l.intakeEnd || date <= l.intakeEnd)
  // dates in messages read like every other date in the app ("Oct 26, 2026")
  const dateMsg = t.errors.date(
    DATES.fmt(deadline),
    l.intakeEnd ? DATES.fmt(l.intakeEnd) : null
  )
  if (d.plan !== "full" && !depositPlansAvailable(l))
    e["enr-plan"] = t.errors.planNotAvailable
  if (d.plan === "deposit_balance" && !e["enr-plan"]) {
    if (!d.balanceDate) e["enr-balance-date"] = t.errors.balanceDate
    else if (!dateOk(d.balanceDate)) e["enr-balance-date"] = dateMsg
  }
  if (d.plan === "installments" && !e["enr-plan"]) {
    if (d.installments.length === 0) e["enr-inst"] = t.errors.installmentsNone
    if (d.installments.length > 24) e["enr-inst"] = t.errors.installmentsMax
    d.installments.forEach((r, i) => {
      const minor = toMinor(r.amount, l.currency)
      if (minor === null || minor < 1)
        e[`enr-inst-${i}-amount`] = t.errors.amount
      if (!r.date) e[`enr-inst-${i}-date`] = t.errors.installmentDate
      else if (!dateOk(r.date)) e[`enr-inst-${i}-date`] = dateMsg
    })
    if (!Object.keys(e).length && installmentsLeft(l, d) !== 0)
      e["enr-inst"] = t.errors.mustAddUp(
        formatMoney({
          amount_minor: l.price - l.deposit,
          amount: "",
          currency: l.currency,
        })
      )
  }
  if (d.extras.length > 10) e["enr-extras"] = t.errors.extrasMax
  d.extras.forEach((x, i) => {
    const used = x.label.trim() || x.amount.trim()
    if (!used) return
    if (!x.label.trim()) e[`enr-extra-${i}-label`] = t.errors.extraLabel
    else if (x.label.trim().length > 100)
      e[`enr-extra-${i}-label`] = t.errors.extraLabelLong
    const minor = toMinor(x.amount, l.currency)
    if (minor === null || minor < 1)
      e[`enr-extra-${i}-amount`] = t.errors.amount
  })
  return e
}

/** The request body, exactly as section 2 describes it (amounts in minor units) */
export function planBody(l: PlanListing, d: PlanDraft): MoveToEnrollmentBody {
  const body: MoveToEnrollmentBody = { plan: d.plan }
  if (d.plan === "deposit_balance") body.balance_due_date = d.balanceDate
  if (d.plan === "installments")
    body.installments = d.installments.map((r) => ({
      amount: toMinor(r.amount, l.currency) ?? 0,
      due_date: r.date,
    }))
  const extras = extrasMinor(l, d).filter((x) => x.label && x.amount >= 1)
  if (extras.length) body.extras = extras
  return body
}

/** The backend's field keys mapped to the dialog's inputs */
export function planFieldMap(d: PlanDraft): Record<string, string> {
  const map: Record<string, string> = {
    plan: "enr-plan",
    balance_due_date: "enr-balance-date",
    installments: "enr-inst",
    extras: "enr-extras",
  }
  d.installments.forEach((_, i) => {
    map[`installments.${i}.amount`] = `enr-inst-${i}-amount`
    map[`installments.${i}.due_date`] = `enr-inst-${i}-date`
  })
  d.extras.forEach((_, i) => {
    map[`extras.${i}.label`] = `enr-extra-${i}-label`
    map[`extras.${i}.amount`] = `enr-extra-${i}-amount`
  })
  return map
}
