import * as CAT from "@/data/catalog"
import type { Listing } from "@/data/types"
import type {
  Actor,
  AppEvent,
  AppStatus,
  Eligibility,
  HostKpis,
  Intake,
  Message,
  Notification,
  PlanItem,
  PlayerBasics,
  Role,
  StatusGroup,
  StatusMeta,
  TimelineStep,
  Transition,
} from "@/features/applications/types"

const D = CAT.DATES

type FeeL = Pick<Listing, "fees" | "durationWeeks" | "optional" | "rolling">
type KpiApp = { status: AppStatus; payment?: { items?: PlanItem[] } | null }
type NotifApp = { id: string; events?: AppEvent[] }

/* ---------------- Statuses (PRD §9.2, exact labels) ---------------- */
export const STATUS_ORDER: AppStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "info_required",
  "accepted",
  "rejected",
  "enrollment_pending",
  "enrolled",
  "cancelled",
]

export const STATUS: Record<AppStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    tone: "ghost",
    final: false,
    group: "action",
    family:
      "Not sent yet. Finish the remaining steps and submit when you’re ready.",
    host: "The family hasn’t submitted this application yet.",
    next: "Continue application",
  },
  submitted: {
    label: "Submitted",
    tone: "info",
    final: false,
    group: "progress",
    family: "Sent to the academy. Most academies reply within a few days.",
    host: "New application. Open it to start your review.",
    next: null,
  },
  under_review: {
    label: "Under Review",
    tone: "info",
    final: false,
    group: "progress",
    family: "The academy is reviewing the player’s profile and documents.",
    host: "You’re reviewing this application. Accept, decline or ask for more information.",
    next: null,
  },
  info_required: {
    label: "Additional Information Required",
    tone: "warning",
    final: false,
    group: "action",
    family:
      "The academy needs more information before it can decide. Reply to keep the application moving.",
    host: "Waiting for the family to reply to your request.",
    next: "Reply to the academy",
  },
  accepted: {
    label: "Accepted",
    tone: "success",
    final: false,
    group: "progress",
    family:
      "Good news: the academy has offered a place. They’ll send the enrollment payment request next.",
    host: "You’ve offered a place. Move the player to enrollment to request payment.",
    next: null,
  },
  rejected: {
    label: "Rejected",
    tone: "ghost",
    final: true,
    group: "closed",
    family:
      "The academy decided not to offer a place this time. You can still apply to other programs.",
    host: "You declined this application.",
    next: "Find similar programs",
  },
  enrollment_pending: {
    label: "Enrollment Pending",
    tone: "warning",
    final: false,
    group: "action",
    family: "Pay the registration fee and deposit to confirm the place.",
    host: "Waiting for the family’s enrollment payment.",
    next: "Pay to confirm the place",
  },
  enrolled: {
    label: "Enrolled",
    tone: "success",
    final: true,
    group: "enrolled",
    family:
      "Enrollment confirmed. The academy will share the welcome pack before the first day.",
    host: "Enrollment confirmed and paid.",
    next: null,
  },
  cancelled: {
    label: "Cancelled",
    tone: "ghost",
    final: true,
    group: "closed",
    family: "This application was withdrawn.",
    host: "The family withdrew this application.",
    next: null,
  },
}

export const GROUPS: { id: "all" | StatusGroup; label: string }[] = [
  { id: "all", label: "All" },
  { id: "action", label: "Needs action" },
  { id: "progress", label: "In progress" },
  { id: "enrolled", label: "Enrolled" },
  { id: "closed", label: "Closed" },
]

/* Who may move an application from → to. `family` and `academy` are the
   two marketplace sides; `system` records automatic steps. */
export const TRANSITIONS: Transition[] = [
  {
    from: "draft",
    to: "submitted",
    actor: "family",
    verb: "Submit application",
  },
  {
    from: "submitted",
    to: "under_review",
    actor: "academy",
    verb: "Start review",
  },
  {
    from: "under_review",
    to: "info_required",
    actor: "academy",
    verb: "Request information",
  },
  { from: "under_review", to: "accepted", actor: "academy", verb: "Accept" },
  { from: "under_review", to: "rejected", actor: "academy", verb: "Decline" },
  {
    from: "info_required",
    to: "under_review",
    actor: "family",
    verb: "Send reply",
  },
  {
    from: "accepted",
    to: "enrollment_pending",
    actor: "academy",
    verb: "Move to enrollment",
  },
  {
    from: "enrollment_pending",
    to: "enrolled",
    actor: "family",
    verb: "Pay and confirm",
  },
]
STATUS_ORDER.forEach(function (s) {
  if (!STATUS[s].final)
    TRANSITIONS.push({
      from: s,
      to: "cancelled",
      actor: "family",
      verb: "Withdraw application",
    })
})

export function canTransition(
  from: AppStatus,
  to: AppStatus,
  actor: Actor
): boolean {
  return TRANSITIONS.some(function (t) {
    return t.from === from && t.to === to && t.actor === actor
  })
}
export function actionsFor(status: AppStatus, actor: Actor): Transition[] {
  return TRANSITIONS.filter(function (t) {
    return t.from === status && t.actor === actor
  })
}

/* Canonical path shown as the application timeline. info_required appears
   only if it happened; rejected / cancelled end the path. */
export const PATH: AppStatus[] = [
  "submitted",
  "under_review",
  "accepted",
  "enrollment_pending",
  "enrolled",
]
const PATH_LABEL: Partial<Record<AppStatus, string>> = {
  submitted: "Submitted",
  under_review: "Academy review",
  accepted: "Decision",
  enrollment_pending: "Enrollment payment",
  enrolled: "Enrolled",
}

export function timeline(app: {
  status: AppStatus
  events?: AppEvent[]
}): TimelineStep[] {
  const reached: Partial<Record<AppStatus, string>> = {}
  ;(app.events || []).forEach(function (e) {
    reached[e.status] = reached[e.status] || e.at
  })
  const cur = app.status
  const steps: TimelineStep[] = []

  if (cur === "rejected" || cur === "cancelled") {
    PATH.forEach(function (key) {
      if (key === "accepted" && cur === "rejected") {
        steps.push({
          key: "rejected",
          label: "Declined",
          state: "done",
          at: reached.rejected,
          tone: "ghost",
        })
        return
      }
      steps.push({
        key: key,
        label: PATH_LABEL[key] ?? key,
        state: reached[key] ? "done" : "skipped",
        at: reached[key] || null,
      })
      if (key === "under_review" && reached.info_required) {
        steps.push({
          key: "info_required",
          label: "Information requested",
          state: "done",
          at: reached.info_required,
        })
      }
    })
    if (cur === "cancelled")
      steps.push({
        key: "cancelled",
        label: "Withdrawn",
        state: "done",
        at: reached.cancelled,
        tone: "ghost",
      })
    return steps
  }

  const curIdx = PATH.indexOf(cur === "info_required" ? "under_review" : cur)
  PATH.forEach(function (key, i) {
    let state: TimelineStep["state"] =
      i < curIdx ? "done" : i === curIdx ? "current" : "upcoming"
    if (cur === "enrolled" && key === "enrolled") state = "done"
    if (cur === "info_required" && key === "under_review") state = "done"
    steps.push({
      key: key,
      label: PATH_LABEL[key] ?? key,
      state: state,
      at: state === "upcoming" ? null : reached[key] || null,
    })
    if (
      key === "under_review" &&
      (reached.info_required || cur === "info_required")
    ) {
      steps.push({
        key: "info_required",
        label: "Information requested",
        state: cur === "info_required" ? "current" : "done",
        at: reached.info_required || null,
      })
    }
  })
  return steps
}

/* ---------------- Fees (PRD §13) ---------------- */
const round = Math.round

export function programTotal(l: FeeL): number | null {
  const f = l.fees
  if (f.per === "month") return null // rolling: billed monthly, no fixed total
  if (f.per === "week") return f.amount * (l.durationWeeks ?? 0)
  return f.amount // season / term / program
}
/* Monthly equivalent, so a season fee and a monthly fee can be compared. */
export function monthlyEquivalent(l: FeeL): number {
  const f = l.fees
  if (f.per === "month") return f.amount
  if (f.per === "week") return round((f.amount * 52) / 12)
  return round(((programTotal(l) ?? 0) * 52) / (12 * (l.durationWeeks ?? 0)))
}
export function depositOf(l: FeeL): number {
  const dep = l.fees.deposit
  const total = programTotal(l)
  if (!dep || total == null) return 0
  return dep.kind === "percent" ? round((total * dep.value) / 100) : dep.value
}
export function balanceOf(l: FeeL): number {
  const total = programTotal(l)
  return total == null ? 0 : total - depositOf(l)
}
export function extrasTotal(l: FeeL, optionalIds?: string[]): number {
  const weeks = l.durationWeeks || 12
  return (l.optional || [])
    .filter(function (o) {
      return (optionalIds || []).indexOf(o.id) > -1
    })
    .reduce(function (sum, o) {
      if (o.per === "month")
        return sum + (l.rolling ? o.price : round((o.price * weeks * 12) / 52))
      return sum + o.price // once / program / season
    }, 0)
}
export function totalPayable(l: FeeL, optionalIds?: string[]): number | null {
  const total = programTotal(l)
  if (total == null) return null
  return l.fees.registrationFee + total + extrasTotal(l, optionalIds)
}
export const COMMISSION_RATE = 0.05
export function commission(amount: number, rate?: number | null): number {
  return round(amount * (rate == null ? COMMISSION_RATE : rate))
}

/* Payment plan created when the academy moves an accepted player to
   enrollment. `required` items must be paid to become Enrolled. */
export function paymentPlan(
  l: FeeL,
  intake: Intake,
  fromISO: string,
  optionalIds?: string[]
): PlanItem[] {
  const reg = l.fees.registrationFee
  const dueSoon = D.addDays(fromISO, 7)
  const items: Omit<PlanItem, "status" | "paidAt">[] = []
  const extras = extrasTotal(l, optionalIds)
  if (l.fees.schedule === "monthly") {
    items.push({
      id: "registration",
      label: "Registration fee",
      amount: reg,
      due: dueSoon,
      required: true,
    })
    for (let m = 0; m < 3; m++) {
      const due = m === 0 ? dueSoon : D.addDays(intake.start, 30 * m)
      items.push({
        id: "month-" + (m + 1),
        label: "Month " + (m + 1) + " fee",
        amount: l.fees.amount + (m === 0 ? extras : 0),
        due: due,
        required: m === 0,
      })
    }
  } else if (l.fees.schedule === "full" || !l.fees.deposit) {
    items.push({
      id: "registration",
      label: "Registration fee",
      amount: reg,
      due: dueSoon,
      required: true,
    })
    items.push({
      id: "program",
      label: "Program fee",
      amount: (programTotal(l) ?? 0) + extras,
      due: dueSoon,
      required: true,
    })
  } else {
    let balanceDue = D.addDays(intake.start, -l.fees.balanceDueDays)
    if (balanceDue < dueSoon) balanceDue = dueSoon
    items.push({
      id: "registration",
      label: "Registration fee",
      amount: reg,
      due: dueSoon,
      required: true,
    })
    items.push({
      id: "deposit",
      label: "Deposit",
      amount: depositOf(l),
      due: dueSoon,
      required: true,
    })
    items.push({
      id: "balance",
      label: "Remaining balance",
      amount: balanceOf(l) + extras,
      due: balanceDue,
      required: false,
    })
  }
  return items.map(function (it): PlanItem {
    return { ...it, status: "due", paidAt: null }
  })
}
export function planTotals(items?: PlanItem[]): {
  total: number
  paid: number
  due: number
  requiredDue: number
} {
  const t = { total: 0, paid: 0, due: 0, requiredDue: 0 }
  ;(items || []).forEach(function (it) {
    t.total += it.amount
    if (it.status === "paid") t.paid += it.amount
    else t.due += it.amount
    if (it.required && it.status !== "paid") t.requiredDue += it.amount
  })
  return t
}
export function requiredPaid(items?: PlanItem[]): boolean {
  return (items || [])
    .filter(function (i) {
      return i.required
    })
    .every(function (i) {
      return i.status === "paid"
    })
}

/* ---------------- Intakes & eligibility ---------------- */
export function placesLeft(
  intake: Intake,
  apps?: { intakeId: string; status: AppStatus }[]
): number {
  const taken =
    intake.seededTaken +
    (apps || []).filter(function (a) {
      return a.intakeId === intake.id && a.status === "enrolled"
    }).length
  return Math.max(0, intake.capacity - taken)
}
export function isOpen(intake: { deadline: string }, today: string): boolean {
  return intake.deadline >= today
}
export function openIntakes<T extends { deadline: string }>(
  l: { intakes: T[] },
  today: string
): T[] {
  return l.intakes.filter(function (i) {
    return isOpen(i, today)
  })
}
export function nextIntake<T extends { deadline: string }>(
  l: { intakes: T[] },
  today: string
): T | null {
  return openIntakes(l, today)[0] || null
}

export function eligibility(
  player: PlayerBasics | null | undefined,
  l: Pick<Listing, "ageMin" | "ageMax" | "gender">,
  intake: Intake | null | undefined,
  today: string,
  apps?: { intakeId: string; status: AppStatus }[]
): Eligibility {
  const reasons: string[] = []
  if (!player) return { ok: false, reasons: ["Choose a player first."] }
  const at = intake ? intake.start : today
  const age = D.ageOn(player.dob, at)
  if (age !== null && (age < l.ageMin || age > l.ageMax)) {
    reasons.push(
      player.firstName +
        " will be " +
        age +
        " on the start date. This program is for ages " +
        l.ageMin +
        "–" +
        l.ageMax +
        "."
    )
  }
  if (l.gender === "boys" && player.gender !== "male")
    reasons.push("This program is for boys.")
  if (l.gender === "girls" && player.gender !== "female")
    reasons.push("This program is for girls.")
  if (intake && !isOpen(intake, today))
    reasons.push("Applications for this start date have closed.")
  if (intake && placesLeft(intake, apps) === 0)
    reasons.push("This start date is full.")
  return { ok: reasons.length === 0, reasons: reasons, age: age ?? undefined }
}

/* ---------------- Validators (ported from ui_kits/academy/academies.js) ---------------- */
export function isEmail(s: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || "").trim())
}
export function isPhone(s: unknown): boolean {
  const v = String(s || "").trim()
  return /^\+?[\d\s()-]+$/.test(v) && v.replace(/\D/g, "").length >= 7
}
export function isUrl(s: unknown): boolean {
  return /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(String(s || "").trim())
}
export function needsGuardian(dob: string, today: string): boolean {
  const a = D.ageOn(dob, today)
  return a != null && a < 18
}
export function passwordScore(input: unknown): number {
  let s = 0
  const p = String(input || "")
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  if (/\d/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++
  return s // 0–4
}

/* Reference like GFA-2026-7KQ2M (no 0/O/1/I to avoid misreading). */
const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export function makeRef(
  prefix: string,
  year: number | string,
  rand?: () => number
): string {
  const r = rand || Math.random
  let s = ""
  for (let i = 0; i < 5; i++) s += REF_CHARS[Math.floor(r() * REF_CHARS.length)]
  return prefix + "-" + year + "-" + s
}

/* ---------------- Host KPIs (PRD §11.1) ---------------- */
export function kpis(
  apps: KpiApp[],
  listings: Pick<Listing, "views30d" | "status">[]
): HostKpis {
  const sent = apps.filter(function (a) {
    return a.status !== "draft"
  })
  const count = function (list: AppStatus[]) {
    return sent.filter(function (a) {
      return list.indexOf(a.status) > -1
    }).length
  }
  const views = listings.reduce(function (s, l) {
    return s + (l.views30d || 0)
  }, 0)
  const revenue = sent.reduce(function (s, a) {
    return (
      s +
      ((a.payment && a.payment.items) || [])
        .filter(function (i) {
          return i.status === "paid"
        })
        .reduce(function (t, i) {
          return t + i.amount
        }, 0)
    )
  }, 0)
  return {
    received: sent.length,
    pending: count(["submitted", "under_review", "info_required"]),
    accepted: count(["accepted", "enrollment_pending", "enrolled"]),
    enrolled: count(["enrolled"]),
    activeListings: listings.filter(function (l) {
      return l.status === "published"
    }).length,
    views: views,
    conversion: views ? Math.round((sent.length / views) * 1000) / 10 : 0,
    revenue: revenue,
    commission: commission(revenue),
  }
}

/* ---------------- Notifications (PRD §14.2), derived from events ---------------- */
const NOTIF: Record<Role, Partial<Record<AppStatus | "message", string>>> = {
  family: {
    under_review: "Application under review",
    info_required: "Additional information requested",
    accepted: "Application accepted",
    rejected: "Application not successful",
    enrollment_pending: "Enrollment payment due",
    enrolled: "Enrollment confirmed",
    message: "New message from the academy",
  },
  academy: {
    submitted: "New application received",
    under_review: "Family replied to your request",
    cancelled: "Application withdrawn",
    enrolled: "Enrollment payment received",
    message: "New message from a family",
  },
}

export function notificationsFor(
  role: Role,
  apps: NotifApp[],
  threads?: Record<string, Message[]>
): Notification[] {
  const out: Notification[] = []
  const other = role === "family" ? ["academy", "system"] : ["family"]
  apps.forEach(function (a) {
    ;(a.events || []).forEach(function (e, i) {
      if (other.indexOf(e.by) === -1) return
      const title = NOTIF[role][e.status]
      if (!title) return
      out.push({
        id: a.id + ":e" + i,
        appId: a.id,
        type: e.status,
        title: title,
        at: e.at,
        note: e.note || "",
      })
    })
    ;((threads && threads[a.id]) || []).forEach(function (m, i) {
      if (other.indexOf(m.from) === -1 || m.from === "system") return
      out.push({
        id: a.id + ":m" + i,
        appId: a.id,
        type: "message",
        title: NOTIF[role].message ?? "",
        at: m.at,
        note: m.text,
      })
    })
  })
  return out.sort(function (x, y) {
    return x.at < y.at ? 1 : x.at > y.at ? -1 : 0
  })
}

/* 'YYYY-MM-DD HH:MM' stamps sort as strings. */
export function stamp(isoDate: string, hhmm?: string): string {
  return isoDate + " " + (hhmm || "09:00")
}
export function nowStamp() {
  const d = new Date()
  const p = function (n: number) {
    return (n < 10 ? "0" : "") + n
  }
  return D.iso(d) + " " + p(d.getHours()) + ":" + p(d.getMinutes())
}
export function fmtStamp(s?: string | null): string {
  if (!s) return "—"
  const parts = String(s).split(" ")
  return D.fmt(parts[0]) + (parts[1] ? " · " + parts[1] : "")
}
