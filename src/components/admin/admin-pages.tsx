"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"

import { PasswordInput } from "@/components/auth/password-input"
import { Icon } from "@/components/icons/icon"
import { CardBlock } from "@/components/shared/card-block"
import { CheckField } from "@/components/shared/check-field"
import { DocItem, DocList } from "@/components/shared/doc-list"
import { ErrorSummary } from "@/components/shared/error-summary"
import { FormField } from "@/components/shared/form-field"
import { Kv, KvLines } from "@/components/shared/key-value"
import { KpiCard } from "@/components/shared/kpi-card"
import { Logo } from "@/components/shared/logo"
import { Modal } from "@/components/shared/modal"
import { NativeSelect } from "@/components/shared/native-select"
import { Notice } from "@/components/shared/notice"
import { notify } from "@/components/shared/notify"
import { Grid2, Stack } from "@/components/shared/page-grid"
import { QueryState } from "@/components/shared/query-state"
import { SectionHead } from "@/components/shared/section-head"
import { StatusPill } from "@/components/shared/status-pill"
import { Timeline } from "@/components/shared/timeline"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ADMIN } from "@/data/admin-copy"
import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import type { StatusTone } from "@/features/applications/types"
import type { AppEvent } from "@/features/applications/types"
import {
  adminLogin,
  approveListing,
  approveVerification,
  deleteAcademy,
  getAdminApplication,
  getModerationListing,
  getOrganization,
  getVerification,
  listAdminApplications,
  listModeration,
  listOrganizations,
  listUsers,
  listVerifications,
  rejectListing,
  rejectVerification,
  unpublishListing,
  adminAttachmentPath,
  adminVerificationDocumentPath,
  type AdminListingStatus,
  type VerificationStatus,
} from "@/features/admin/api"
import { adminKeys } from "@/features/admin/query-keys"
import { startAdminSession } from "@/features/auth/session"
import { downloadPrivateFile } from "@/features/family/api"
import { apiFeeLabel } from "@/features/club/view-models"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

/* ---------------- shared admin pieces ---------------- */

const C = ADMIN.common
const date = (iso: string | null | undefined) =>
  iso ? DATES.fmt(iso.slice(0, 10)) : C.none

const TONE: Record<string, StatusTone> = {
  pending: "warning",
  verified: "success",
  club_academy: "success",
  rejected: "warning",
  draft: "ghost",
  pending_review: "info",
  published: "success",
  paused: "ghost",
  archived: "ghost",
  submitted: "info",
  under_review: "info",
  info_required: "warning",
  accepted: "success",
  enrollment_pending: "info",
  enrolled: "success",
  cancelled: "ghost",
}

const ADMIN_PAGES =
  /^\/admin(\/(verifications|listings|applications|organizations)(\/\d+)?|\/users)?\/?(\?.*)?$/

/** A ?next= address after admin sign-in: only the admin's own pages */
export function safeAdminNext(next: string | null | undefined): string | null {
  if (!next || !ADMIN_PAGES.test(next)) return null
  return next
}

/** A verification document type from the options, as words */
const docTypeLabel = (type: string) =>
  LIVE.verificationDocs.types[type] ??
  type.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())

/** The row's way in: "Review" (highlighted) while a decision waits, else "Open" */
function RowAction({ href, waiting }: { href: string; waiting: boolean }) {
  return (
    <ButtonLink
      href={href}
      variant={waiting ? "primary" : "secondary"}
      size="sm"
      className="whitespace-nowrap"
    >
      {waiting ? C.review : C.open} <Icon name="arrow" size={14} />
    </ButtonLink>
  )
}

export function StatusTag({ status }: { status: string }) {
  return (
    <StatusPill tone={TONE[status] ?? "ghost"}>
      {ADMIN.status[status] ?? status}
    </StatusPill>
  )
}

export function AdminHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="grid gap-1">
        <h1 className="font-display text-[clamp(24px,2.6vw,32px)] leading-none font-bold uppercase">
          {title}
        </h1>
        {subtitle ? <p className="text-fs-14 text-fg-3">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  )
}

function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-fs-13 font-semibold text-fg-3 hover:text-fg-1"
    >
      <Icon name="arrowl" size={14} /> {C.back}
    </Link>
  )
}

/** Previous / next with "Page 2 of 5 · 93 in total" (lists use page + meta) */
function Pager({
  meta,
  page,
  setPage,
}: {
  meta?: { current_page: number; last_page: number; total: number }
  page: number
  setPage: (p: number) => void
}) {
  if (!meta || meta.last_page <= 1)
    return meta ? (
      <p className="text-fs-13 text-fg-3">
        {C.page(meta.current_page, meta.last_page, meta.total)}
      </p>
    ) : null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-fs-13 text-fg-3">
        {C.page(meta.current_page, meta.last_page, meta.total)}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          {C.prev}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= meta.last_page}
          onClick={() => setPage(page + 1)}
        >
          {C.next}
        </Button>
      </div>
    </div>
  )
}

/** A text box that searches a moment after typing stops */
function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [text, setText] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => onChange(text.trim()), 350)
    return () => clearTimeout(id)
  }, [text, onChange])
  return (
    <Input
      aria-label={C.search}
      placeholder={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      className="w-auto min-w-[240px]"
    />
  )
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T | ""
  onChange: (v: T | "") => void
  options: { value: T; label: string }[]
}) {
  return (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T | "")}
      className="w-auto min-w-[200px]"
    >
      <option value="">
        {C.all} · {label}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </NativeSelect>
  )
}

/** Confirm a decision; `reason` asks for required text (reject note, unpublish reason) */
function Confirm({
  title,
  text,
  cta,
  danger,
  reason,
  onConfirm,
  onClose,
}: {
  title: string
  text: string
  cta: string
  danger?: boolean
  reason?: { label: string; error: string }
  onConfirm: (reason: string) => Promise<unknown>
  onClose: () => void
}) {
  const [value, setValue] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const go = async () => {
    if (reason && !value.trim()) return setError(reason.error)
    setBusy(true)
    try {
      await onConfirm(value.trim())
      onClose()
    } catch {
      // the backend's message is shown by the error toast
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {C.cancel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={() => go()}
            disabled={busy}
            aria-busy={busy}
            data-autofocus
          >
            {cta}
          </Button>
        </>
      }
    >
      <p className="text-fs-15 leading-lh-relaxed text-fg-2">{text}</p>
      {reason ? (
        <FormField
          id="admin-reason"
          label={reason.label}
          required
          error={error || undefined}
        >
          {(p) => (
            <Textarea
              {...p}
              value={value}
              maxLength={2000}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
        </FormField>
      ) : null}
    </Modal>
  )
}

function useAdminMutation() {
  const queryClient = useQueryClient()
  return async <T,>(job: () => Promise<T>, done: string) => {
    const result = await job()
    await queryClient.invalidateQueries({ queryKey: adminKeys.all })
    notify(done)
    return result
  }
}

/* ---------------- login ---------------- */

export function AdminLoginClient({ next }: { next: string | null }) {
  const t = ADMIN.login
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    const e: Record<string, string> = {}
    if (!email.trim()) e["admin-email"] = t.errorEmail
    if (!password) e["admin-password"] = t.errorPassword
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      const data = await adminLogin(email.trim(), password)
      startAdminSession(data.token, data.expires_in, email.trim(), remember)
      // follow ?next= only to a real admin page; anything else opens the overview
      router.push(safeAdminNext(next) ?? routes.admin.overview)
    } catch {
      // wrong credentials: the backend's message is shown by the error toast
      setBusy(false)
    }
  }
  return (
    <main id="main" className="grid min-h-screen place-items-center p-6">
      <div className="grid w-full max-w-[420px] gap-5 rounded-lg border border-border-1 bg-surface-elevated p-[clamp(20px,3vw,32px)]">
        <Logo size="sm" />
        <div className="grid gap-1.5">
          <h1 className="font-display text-fs-32 leading-none font-bold uppercase">
            {t.title}
          </h1>
          <p className="text-fs-14 text-fg-3">{t.lead}</p>
        </div>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <ErrorSummary
            errors={errors}
            labels={{ "admin-email": t.email, "admin-password": t.password }}
          />
          <FormField
            id="admin-email"
            label={t.email}
            required
            error={errors["admin-email"]}
          >
            {(p) => (
              <Input
                {...p}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            id="admin-password"
            label={t.password}
            required
            error={errors["admin-password"]}
          >
            {(p) => (
              <PasswordInput
                {...p}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </FormField>
          <CheckField
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          >
            {t.remember}
          </CheckField>
          <Button
            type="submit"
            size="lg"
            block
            disabled={busy}
            aria-busy={busy}
          >
            {t.submit}
          </Button>
        </form>
      </div>
    </main>
  )
}

/* ---------------- overview ---------------- */

export function AdminOverviewClient() {
  const t = ADMIN.overview
  // the first three of each queue are named on the cards
  const pendingV = useQuery({
    queryKey: adminKeys.verifications({ status: "pending", per_page: 3 }),
    queryFn: () => listVerifications({ status: "pending", per_page: 3 }),
  })
  const pendingL = useQuery({
    queryKey: adminKeys.listings({ status: "pending_review", per_page: 3 }),
    queryFn: () => listModeration({ status: "pending_review", per_page: 3 }),
  })
  const orgs = useQuery({
    queryKey: adminKeys.organizations({ per_page: 1 }),
    queryFn: () => listOrganizations({ per_page: 1 }),
  })
  const users = useQuery({
    queryKey: adminKeys.users({ per_page: 1 }),
    queryFn: () => listUsers({ per_page: 1 }),
  })
  const apps = useQuery({
    queryKey: adminKeys.applications({ per_page: 1 }),
    queryFn: () => listAdminApplications({ per_page: 1 }),
  })
  const n = (q: { data?: { meta?: { total: number } } }) =>
    q.data?.meta?.total ?? "…"
  const counts = apps.data?.meta?.status_counts ?? {}

  const queue = (
    id: string,
    title: string,
    lead: string,
    total: number | "…",
    names: { key: number; label: string; sub: string; href: string }[],
    cta: string,
    href: string
  ) => (
    <CardBlock aria-labelledby={id} className="grid content-start gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 id={id} className="text-fs-16 font-bold text-fg-1">
            {title}
          </h2>
          <p className="text-fs-13 text-fg-3">{lead}</p>
        </div>
        <span
          className={cn(
            "grid h-11 min-w-11 place-items-center rounded-pill px-3 font-display text-fs-24 font-bold tabular-nums",
            total && total !== "…"
              ? "bg-gf-neon text-text-on-neon"
              : "bg-bg-3 text-fg-2"
          )}
        >
          {total}
        </span>
      </div>
      {names.length ? (
        <ul className="grid gap-1.5">
          {names.map((x) => (
            <li key={x.key}>
              <Link
                href={x.href}
                className="grid rounded-sm border border-border-1 px-3 py-2 hover:border-border-accent"
              >
                <b className="truncate text-fs-14">{x.label}</b>
                <small className="truncate text-fs-12 text-fg-3">{x.sub}</small>
              </Link>
            </li>
          ))}
          {typeof total === "number" && total > names.length ? (
            <li className="text-fs-13 text-fg-3">
              {t.more(total - names.length)}
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="text-fs-14 text-fg-3">{total === "…" ? "" : t.nothing}</p>
      )}
      <ButtonLink
        href={href}
        variant={
          typeof total === "number" && total > 0 ? "primary" : "secondary"
        }
        size="sm"
        className="justify-self-start"
      >
        {cta} <Icon name="arrow" size={14} />
      </ButtonLink>
    </CardBlock>
  )

  return (
    <>
      <AdminHeader title={t.title} subtitle={t.subtitle} />
      <section aria-label={t.attention} className="grid gap-3">
        <h2 className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
          {t.attention}
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-4">
          {queue(
            "h-q-verify",
            t.pendingVerifications,
            t.verifyLead,
            n(pendingV),
            (pendingV.data?.data ?? []).map((v) => ({
              key: v.academy_id,
              label: v.academy_name,
              sub: [v.organization?.name, v.city].filter(Boolean).join(" · "),
              href: routes.admin.verification(String(v.academy_id)),
            })),
            t.reviewVerifications,
            routes.admin.verifications
          )}
          {queue(
            "h-q-listings",
            t.pendingListings,
            t.listingsLead,
            n(pendingL),
            (pendingL.data?.data ?? []).map((l) => ({
              key: l.id,
              label: l.title,
              sub: l.academy?.name ?? "",
              href: routes.admin.listing(String(l.id)),
            })),
            t.reviewListings,
            routes.admin.listings
          )}
        </div>
      </section>

      <section aria-label={t.totals} className="grid gap-3">
        <h2 className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
          {t.totals}
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
          <Link href={routes.admin.organizations}>
            <KpiCard label={t.organizations} value={n(orgs)} />
          </Link>
          <Link href={routes.admin.users}>
            <KpiCard label={t.users} value={n(users)} />
          </Link>
          <Link href={routes.admin.applications}>
            <KpiCard label={t.applications} value={n(apps)} />
          </Link>
        </div>
      </section>

      <CardBlock aria-labelledby="h-by-status" className="grid gap-4">
        <SectionHead
          id="h-by-status"
          title={t.byStatus}
          sub={t.byStatusSub(n(apps))}
        />
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-2.5">
          {Object.entries(counts).map(([status, count]) => (
            <li key={status}>
              <Link
                href={`${routes.admin.applications}?status=${status}`}
                className={cn(
                  "grid h-full min-w-0 content-between justify-items-start gap-3 rounded-md border border-border-1 bg-bg-2 p-3.5 hover:border-border-accent",
                  !count && "opacity-60"
                )}
              >
                {/* long labels ("Additional Information Required") wrap inside the tile */}
                <span className="min-w-0 [&>*]:max-w-full [&>*]:whitespace-normal">
                  <StatusTag status={status} />
                </span>
                <b className="font-display text-[28px] leading-none tabular-nums">
                  {count}
                </b>
              </Link>
            </li>
          ))}
        </ul>
      </CardBlock>
      <p className="text-fs-13 text-fg-3">{t.note}</p>
    </>
  )
}

/* ---------------- verifications ---------------- */

const V_STATUSES: VerificationStatus[] = [
  "pending",
  "verified",
  "club_academy",
  "rejected",
]

export function AdminVerificationsClient() {
  const t = ADMIN.verifications
  const [status, setStatus] = useState<VerificationStatus | "">("pending")
  const [page, setPage] = useState(1)
  const params = { status: status || undefined, page }
  const query = useQuery({
    queryKey: adminKeys.verifications(params),
    queryFn: () => listVerifications(params),
  })
  return (
    <>
      <AdminHeader title={t.title} subtitle={t.subtitle} />
      <div className="flex flex-wrap gap-2">
        <Select
          label={t.status}
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          options={V_STATUSES.map((s) => ({
            value: s,
            label: ADMIN.status[s],
          }))}
        />
      </div>
      <QueryState
        query={{ ...query, data: query.data?.data }}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[320px] animate-pulse rounded-lg bg-bg-2" />
        }
        isEmpty={(r) => r.length === 0}
        empty={<p className="text-fs-14 text-fg-3">{C.empty}</p>}
      >
        {(rows) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.academy}</TableHead>
                <TableHead>{t.organization}</TableHead>
                <TableHead>{t.city}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.lastDecision}</TableHead>
                <TableHead>
                  <span className="am-sr">{C.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((v) => (
                <TableRow key={v.academy_id}>
                  <TableCell>
                    <Link
                      className="am-link font-semibold"
                      href={routes.admin.verification(v.academy_id)}
                    >
                      {v.academy_name}
                    </Link>
                  </TableCell>
                  <TableCell>{v.organization.name}</TableCell>
                  <TableCell>{v.city}</TableCell>
                  <TableCell>
                    <StatusTag status={v.verification_status} />
                  </TableCell>
                  <TableCell>
                    {v.verification_reviewed_at
                      ? `${date(v.verification_reviewed_at)}${v.verification_reviewed_by ? ` ${C.by} ${v.verification_reviewed_by.name}` : ""}`
                      : C.none}
                  </TableCell>
                  <TableCell>
                    <RowAction
                      href={routes.admin.verification(v.academy_id)}
                      waiting={v.verification_status === "pending"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryState>
      <Pager meta={query.data?.meta} page={page} setPage={setPage} />
    </>
  )
}

export function AdminVerificationClient({ id }: { id: string }) {
  const t = ADMIN.verifications
  const n = Number(id)
  const query = useQuery({
    queryKey: adminKeys.verification(n),
    queryFn: () => getVerification(n),
    enabled: Number.isFinite(n),
  })
  const mutate = useAdminMutation()
  const [dialog, setDialog] = useState<
    null | "verified" | "club_academy" | "reject"
  >(null)
  return (
    <>
      <BackLink href={routes.admin.verifications} />
      <QueryState
        query={query}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[420px] animate-pulse rounded-lg bg-bg-2" />
        }
        empty={null}
      >
        {(v) => {
          const approved =
            v.verification_status === "verified" ||
            v.verification_status === "club_academy"
          const o = v.organization
          return (
            <div className="grid gap-[clamp(18px,2.2vw,26px)]">
              <AdminHeader
                title={v.academy_name}
                subtitle={`${v.city} · ${o.name}`}
                actions={
                  <div className="flex flex-wrap gap-2">
                    {v.verification_status !== "verified" ? (
                      <Button size="sm" onClick={() => setDialog("verified")}>
                        {approved ? t.switchToVerified : t.approveVerified}
                      </Button>
                    ) : null}
                    {v.verification_status !== "club_academy" ? (
                      <Button
                        size="sm"
                        variant={approved ? "primary" : "secondary"}
                        onClick={() => setDialog("club_academy")}
                      >
                        {approved ? t.switchToClub : t.approveClub}
                      </Button>
                    ) : null}
                    {!approved ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setDialog("reject")}
                      >
                        {t.reject}
                      </Button>
                    ) : null}
                  </div>
                }
              />
              {approved ? (
                <p className="text-fs-13 text-fg-3">{t.cannotReject}</p>
              ) : null}
              <Grid2>
                <Stack>
                  <CardBlock aria-labelledby="h-v-status">
                    <SectionHead id="h-v-status" title={t.status} />
                    <StatusTag status={v.verification_status} />
                    <KvLines>
                      <Kv label={t.lastDecision}>
                        {v.verification_reviewed_at
                          ? `${date(v.verification_reviewed_at)}${v.verification_reviewed_by ? ` ${C.by} ${v.verification_reviewed_by.name}` : ""}`
                          : C.none}
                      </Kv>
                      <Kv label={t.verifiedAt}>{date(v.verified_at)}</Kv>
                    </KvLines>
                    {v.verification_note ? (
                      <Notice tone="neutral" icon="info">
                        <b>{t.note}:</b> {v.verification_note}
                      </Notice>
                    ) : null}
                  </CardBlock>
                  {v.documents && v.documents.length ? (
                    <CardBlock aria-labelledby="h-v-docs">
                      <SectionHead id="h-v-docs" title={t.documents} />
                      <DocList>
                        {v.documents.map((d) => (
                          <DocItem
                            key={d.id}
                            icon="doc"
                            title={docTypeLabel(d.type)}
                            sub={[
                              d.original_name,
                              d.note,
                              d.reviewed_by && d.reviewed_at
                                ? `${d.reviewed_by.name} · ${DATES.fmt(d.reviewed_at.slice(0, 10))}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                            trailing={
                              <span className="flex flex-wrap items-center gap-1.5">
                                <StatusTag status={d.status} />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    downloadPrivateFile(
                                      adminVerificationDocumentPath(
                                        v.academy_id,
                                        d.id
                                      ),
                                      d.original_name
                                    ).catch(() => undefined)
                                  }
                                >
                                  <Icon name="download" size={14} />{" "}
                                  {LIVE.application.download}
                                </Button>
                              </span>
                            }
                          />
                        ))}
                      </DocList>
                    </CardBlock>
                  ) : null}
                </Stack>
                <CardBlock aria-labelledby="h-v-contact">
                  <SectionHead id="h-v-contact" title={t.contact} />
                  <KvLines>
                    <Kv label={t.organization}>{o.name}</Kv>
                    <Kv label={t.legalName}>{o.legal_name ?? C.none}</Kv>
                    <Kv label={t.type}>
                      {o.type === "club"
                        ? LIVE.organizationType.club
                        : LIVE.organizationType.independent_academy}
                    </Kv>
                    <Kv label={t.contactEmail}>{o.contact_email ?? C.none}</Kv>
                    <Kv label={t.contactPhone}>{o.contact_phone ?? C.none}</Kv>
                    <Kv label={t.website}>{o.website ?? C.none}</Kv>
                    <Kv label={t.registration}>
                      {o.registration_number ?? C.none}
                    </Kv>
                  </KvLines>
                </CardBlock>
              </Grid2>
              {dialog === "verified" || dialog === "club_academy" ? (
                <Confirm
                  title={t.approveTitle}
                  text={t.approveText}
                  cta={
                    dialog === "verified" ? t.approveVerified : t.approveClub
                  }
                  onConfirm={() =>
                    mutate(
                      () => approveVerification(v.academy_id, dialog),
                      t.done
                    )
                  }
                  onClose={() => setDialog(null)}
                />
              ) : null}
              {dialog === "reject" ? (
                <Confirm
                  title={t.rejectTitle}
                  text={t.rejectText}
                  cta={t.reject}
                  danger
                  reason={{ label: t.noteLabel, error: t.noteError }}
                  onConfirm={(note) =>
                    mutate(() => rejectVerification(v.academy_id, note), t.done)
                  }
                  onClose={() => setDialog(null)}
                />
              ) : null}
            </div>
          )
        }}
      </QueryState>
    </>
  )
}

/* ---------------- listing moderation ---------------- */

const L_STATUSES: AdminListingStatus[] = [
  "pending_review",
  "published",
  "rejected",
  "paused",
  "archived",
  "draft",
]

export function AdminListingsClient() {
  const t = ADMIN.listings
  const [status, setStatus] = useState<AdminListingStatus | "">(
    "pending_review"
  )
  const [page, setPage] = useState(1)
  const params = { status: status || undefined, page }
  const query = useQuery({
    queryKey: adminKeys.listings(params),
    queryFn: () => listModeration(params),
  })
  return (
    <>
      <AdminHeader title={t.title} subtitle={t.subtitle} />
      <div className="flex flex-wrap gap-2">
        <Select
          label={t.status}
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          options={L_STATUSES.map((s) => ({
            value: s,
            label: ADMIN.status[s],
          }))}
        />
      </div>
      <QueryState
        query={{ ...query, data: query.data?.data }}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[320px] animate-pulse rounded-lg bg-bg-2" />
        }
        isEmpty={(r) => r.length === 0}
        empty={<p className="text-fs-14 text-fg-3">{C.empty}</p>}
      >
        {(rows) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.listing}</TableHead>
                <TableHead>{t.academy}</TableHead>
                <TableHead>{t.price}</TableHead>
                <TableHead>{t.submitted}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>
                  <span className="am-sr">{C.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Link
                      className="am-link font-semibold"
                      href={routes.admin.listing(l.id)}
                    >
                      {l.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {l.academy.name}{" "}
                    <StatusTag status={l.academy.verification_status} />
                  </TableCell>
                  <TableCell>
                    {l.price ? formatMoney(l.price) : C.none}
                  </TableCell>
                  <TableCell>{date(l.submitted_at)}</TableCell>
                  <TableCell>
                    <StatusTag status={l.status} />
                  </TableCell>
                  <TableCell>
                    <RowAction
                      href={routes.admin.listing(l.id)}
                      waiting={l.status === "pending_review"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryState>
      <Pager meta={query.data?.meta} page={page} setPage={setPage} />
    </>
  )
}

export function AdminListingClient({ id }: { id: string }) {
  const t = ADMIN.listings
  const n = Number(id)
  const query = useQuery({
    queryKey: adminKeys.listing(n),
    queryFn: () => getModerationListing(n),
    enabled: Number.isFinite(n),
  })
  const mutate = useAdminMutation()
  const [dialog, setDialog] = useState<
    null | "approve" | "reject" | "unpublish"
  >(null)
  return (
    <>
      <BackLink href={routes.admin.listings} />
      <QueryState
        query={query}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[420px] animate-pulse rounded-lg bg-bg-2" />
        }
        empty={null}
      >
        {(l) => (
          <div className="grid gap-[clamp(18px,2.2vw,26px)]">
            <AdminHeader
              title={l.title}
              subtitle={`${l.academy.name} · ${l.academy.city}, ${l.academy.country_name}`}
              actions={
                <div className="flex flex-wrap gap-2">
                  {l.status === "pending_review" ? (
                    <>
                      <Button size="sm" onClick={() => setDialog("approve")}>
                        {t.approve}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setDialog("reject")}
                      >
                        {t.reject}
                      </Button>
                    </>
                  ) : null}
                  {l.status === "published" || l.status === "paused" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDialog("unpublish")}
                    >
                      {t.unpublish}
                    </Button>
                  ) : null}
                </div>
              }
            />
            <Grid2>
              <Stack>
                <CardBlock aria-labelledby="h-l-status">
                  <SectionHead id="h-l-status" title={t.status} />
                  <StatusTag status={l.status} />
                  <KvLines>
                    <Kv label={t.submitted}>{date(l.submitted_at)}</Kv>
                    <Kv label={t.reviewedBy}>
                      {l.reviewed_at
                        ? `${date(l.reviewed_at)}${l.reviewed_by ? ` ${C.by} ${l.reviewed_by.name}` : ""}`
                        : C.none}
                    </Kv>
                    <Kv label={t.academyVerification}>
                      {ADMIN.status[l.academy.verification_status] ??
                        l.academy.verification_status}
                    </Kv>
                  </KvLines>
                  {l.rejection_reason ? (
                    <Notice tone="neutral" icon="info">
                      <b>{t.rejection}:</b> {l.rejection_reason}
                    </Notice>
                  ) : null}
                </CardBlock>
                <CardBlock aria-labelledby="h-l-program">
                  <SectionHead id="h-l-program" title={t.details} />
                  {l.description ? (
                    <p className="text-fs-14 leading-lh-relaxed text-fg-2">
                      {l.description}
                    </p>
                  ) : null}
                  <KvLines>
                    <Kv label={t.price}>{apiFeeLabel(l) ?? C.none}</Kv>
                    {l.deposit ? (
                      <Kv label={LIVE.program.deposit}>
                        {formatMoney(l.deposit)}
                      </Kv>
                    ) : null}
                    {l.registration_fee ? (
                      <Kv label={LIVE.program.registration}>
                        {formatMoney(l.registration_fee)}
                      </Kv>
                    ) : null}
                    <Kv label={LIVE.program.ages}>
                      {l.age_min !== null && l.age_max !== null
                        ? `${l.age_min}–${l.age_max}`
                        : C.none}
                    </Kv>
                    <Kv label={LIVE.program.training}>
                      {l.training_frequency ?? C.none}
                    </Kv>
                  </KvLines>
                  {l.requirements ? (
                    <p className="text-fs-14 text-fg-2">{l.requirements}</p>
                  ) : null}
                </CardBlock>
              </Stack>
              <CardBlock aria-labelledby="h-l-intakes">
                <SectionHead id="h-l-intakes" title={t.intakes} />
                <KvLines>
                  {l.intakes.length ? (
                    l.intakes.map((i) => (
                      <Kv key={i.id} label={i.label ?? date(i.start_date)}>
                        {date(i.start_date)} ·{" "}
                        {i.places_left === null
                          ? LIVE.program.unlimited
                          : `${i.places_left} / ${i.capacity}`}{" "}
                        · {i.status}
                      </Kv>
                    ))
                  ) : (
                    <Kv label={t.intakes}>{C.none}</Kv>
                  )}
                </KvLines>
              </CardBlock>
            </Grid2>
            {dialog === "approve" ? (
              <Confirm
                title={t.approveTitle}
                text={t.approveText}
                cta={t.approve}
                onConfirm={() => mutate(() => approveListing(l.id), t.done)}
                onClose={() => setDialog(null)}
              />
            ) : null}
            {dialog === "reject" || dialog === "unpublish" ? (
              <Confirm
                title={dialog === "reject" ? t.rejectTitle : t.unpublishTitle}
                text={t.reasonText}
                cta={dialog === "reject" ? t.reject : t.unpublish}
                danger
                reason={{ label: t.reasonLabel, error: t.reasonError }}
                onConfirm={(reason) =>
                  mutate(
                    () =>
                      dialog === "reject"
                        ? rejectListing(l.id, reason)
                        : unpublishListing(l.id, reason),
                    t.done
                  )
                }
                onClose={() => setDialog(null)}
              />
            ) : null}
          </div>
        )}
      </QueryState>
    </>
  )
}

/* ---------------- organizations ---------------- */

export function AdminOrganizationsClient() {
  const t = ADMIN.organizations
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const params = { q: q || undefined, page }
  const query = useQuery({
    queryKey: adminKeys.organizations(params),
    queryFn: () => listOrganizations(params),
  })
  return (
    <>
      <AdminHeader title={t.title} subtitle={t.subtitle} />
      <SearchBox
        value={q}
        onChange={(v) => {
          setQ(v)
          setPage(1)
        }}
        placeholder={t.searchPlaceholder}
      />
      <QueryState
        query={{ ...query, data: query.data?.data }}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[320px] animate-pulse rounded-lg bg-bg-2" />
        }
        isEmpty={(r) => r.length === 0}
        empty={<p className="text-fs-14 text-fg-3">{C.empty}</p>}
      >
        {(rows) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.owner}</TableHead>
                <TableHead>{t.academies}</TableHead>
                <TableHead>{t.listings}</TableHead>
                <TableHead>{C.created}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link
                      className="am-link font-semibold"
                      href={routes.admin.organization(o.id)}
                    >
                      {o.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {o.owner ? `${o.owner.name} · ${o.owner.email}` : C.none}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {o.academies_count}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {o.listings_count}
                  </TableCell>
                  <TableCell>{date(o.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryState>
      <Pager meta={query.data?.meta} page={page} setPage={setPage} />
    </>
  )
}

export function AdminOrganizationClient({ id }: { id: string }) {
  const t = ADMIN.organizations
  const v = ADMIN.verifications
  const n = Number(id)
  const query = useQuery({
    queryKey: adminKeys.organization(n),
    queryFn: () => getOrganization(n),
    enabled: Number.isFinite(n),
  })
  const mutate = useAdminMutation()
  const [remove, setRemove] = useState<{ id: number; name: string } | null>(
    null
  )
  return (
    <>
      <BackLink href={routes.admin.organizations} />
      <QueryState
        query={query}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[420px] animate-pulse rounded-lg bg-bg-2" />
        }
        empty={null}
      >
        {(o) => (
          <div className="grid gap-[clamp(18px,2.2vw,26px)]">
            <AdminHeader title={o.name} subtitle={o.legal_name ?? undefined} />
            <Grid2>
              <CardBlock aria-labelledby="h-o-info">
                <SectionHead id="h-o-info" title={t.name} />
                <KvLines>
                  <Kv label={v.type}>
                    {o.type === "club"
                      ? LIVE.organizationType.club
                      : LIVE.organizationType.independent_academy}
                  </Kv>
                  <Kv label={t.owner}>
                    {o.owner ? `${o.owner.name} · ${o.owner.email}` : C.none}
                  </Kv>
                  <Kv label={v.contactEmail}>{o.contact_email ?? C.none}</Kv>
                  <Kv label={v.contactPhone}>{o.contact_phone ?? C.none}</Kv>
                  <Kv label={v.website}>{o.website ?? C.none}</Kv>
                  <Kv label={v.registration}>
                    {o.registration_number ?? C.none}
                  </Kv>
                  <Kv label={C.created}>{date(o.created_at)}</Kv>
                </KvLines>
              </CardBlock>
              <CardBlock aria-labelledby="h-o-acad">
                <SectionHead
                  id="h-o-acad"
                  title={`${t.academies} (${o.academies_count})`}
                />
                <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
                  {(o.academies ?? []).map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-1 bg-bg-2 p-3"
                    >
                      <span className="grid min-w-0 [overflow-wrap:anywhere]">
                        <Link
                          className="am-link font-semibold"
                          href={routes.admin.verification(a.id)}
                        >
                          {a.name}
                        </Link>
                        <small className="text-fs-12 text-fg-3">
                          {a.city} · {a.listings_count}{" "}
                          {t.listings.toLowerCase()}
                        </small>
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <StatusTag status={a.verification_status} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemove({ id: a.id, name: a.name })}
                        >
                          <Icon name="trash" size={14} /> {t.deleteAcademy}
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBlock>
            </Grid2>
            {remove ? (
              <Confirm
                title={t.deleteTitle}
                text={`${remove.name}. ${t.deleteText}`}
                cta={t.deleteAcademy}
                danger
                onConfirm={() =>
                  mutate(() => deleteAcademy(remove.id), t.deleted)
                }
                onClose={() => setRemove(null)}
              />
            ) : null}
          </div>
        )}
      </QueryState>
    </>
  )
}

/* ---------------- users ---------------- */

export function AdminUsersClient() {
  const t = ADMIN.users
  const [role, setRole] = useState<"applicant" | "academy" | "">("")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const params = { role: role || undefined, q: q || undefined, page }
  const query = useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => listUsers(params),
  })
  return (
    <>
      <AdminHeader title={t.title} subtitle={t.subtitle} />
      <div className="flex flex-wrap gap-2">
        <Select
          label={t.role}
          value={role}
          onChange={(v) => {
            setRole(v)
            setPage(1)
          }}
          options={[
            { value: "applicant", label: ADMIN.status.applicant },
            { value: "academy", label: ADMIN.status.academy },
          ]}
        />
        <SearchBox
          value={q}
          onChange={(v) => {
            setQ(v)
            setPage(1)
          }}
          placeholder={t.searchPlaceholder}
        />
      </div>
      <QueryState
        query={{ ...query, data: query.data?.data }}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[320px] animate-pulse rounded-lg bg-bg-2" />
        }
        isEmpty={(r) => r.length === 0}
        empty={<p className="text-fs-14 text-fg-3">{C.empty}</p>}
      >
        {(rows) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.email}</TableHead>
                <TableHead>{t.role}</TableHead>
                <TableHead>{t.country}</TableHead>
                <TableHead>{t.joined}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold">
                    {u.name}{" "}
                    {u.status === 1 ? null : (
                      <StatusPill tone="warning">{t.inactive}</StatusPill>
                    )}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{ADMIN.status[u.role] ?? u.role}</TableCell>
                  <TableCell>{u.country_code ?? C.none}</TableCell>
                  <TableCell>{date(u.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryState>
      <Pager meta={query.data?.meta} page={page} setPage={setPage} />
    </>
  )
}

/* ---------------- applications (read only) ---------------- */

const A_STATUSES = [
  "submitted",
  "under_review",
  "info_required",
  "accepted",
  "rejected",
  "enrollment_pending",
  "enrolled",
  "cancelled",
]

export function AdminApplicationsClient({
  status: initialStatus,
}: {
  status: string
}) {
  const t = ADMIN.applications
  const [status, setStatus] = useState(
    A_STATUSES.includes(initialStatus) ? initialStatus : ""
  )
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const params = {
    status: status || undefined,
    search: search || undefined,
    page,
  }
  const query = useQuery({
    queryKey: adminKeys.applications(params),
    queryFn: () => listAdminApplications(params),
  })
  return (
    <>
      <AdminHeader title={t.title} subtitle={t.subtitle} />
      <div className="flex flex-wrap gap-2">
        <Select
          label={ADMIN.verifications.status}
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          options={A_STATUSES.map((s) => ({
            value: s,
            label: `${ADMIN.status[s]}${query.data ? ` (${query.data.meta.status_counts[s] ?? 0})` : ""}`,
          }))}
        />
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder={t.searchPlaceholder}
        />
      </div>
      <QueryState
        query={{ ...query, data: query.data?.data }}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[320px] animate-pulse rounded-lg bg-bg-2" />
        }
        isEmpty={(r) => r.length === 0}
        empty={<p className="text-fs-14 text-fg-3">{C.empty}</p>}
      >
        {(rows) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.reference}</TableHead>
                <TableHead>{t.player}</TableHead>
                <TableHead>{t.program}</TableHead>
                <TableHead>{t.academy}</TableHead>
                <TableHead>{ADMIN.verifications.status}</TableHead>
                <TableHead>{t.docs}</TableHead>
                <TableHead>{C.updated}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link
                      className="am-link font-mono font-semibold"
                      href={routes.admin.application(a.id)}
                    >
                      {a.reference ?? `#${a.id}`}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {a.player.first_name} {a.player.last_name}
                    <small className="block text-fs-12 text-fg-3">
                      {a.applicant.name}
                    </small>
                  </TableCell>
                  <TableCell>{a.listing.title}</TableCell>
                  <TableCell>{a.academy.name}</TableCell>
                  <TableCell>
                    <StatusTag status={a.status} />
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {a.documents_count}
                  </TableCell>
                  <TableCell>{date(a.updated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryState>
      <Pager meta={query.data?.meta} page={page} setPage={setPage} />
    </>
  )
}

export function AdminApplicationClient({ id }: { id: string }) {
  const t = ADMIN.applications
  const n = Number(id)
  const query = useQuery({
    queryKey: adminKeys.application(n),
    queryFn: () => getAdminApplication(n),
    enabled: Number.isFinite(n),
  })
  return (
    <>
      <BackLink href={routes.admin.applications} />
      <QueryState
        query={query}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[420px] animate-pulse rounded-lg bg-bg-2" />
        }
        empty={null}
      >
        {(a) => {
          const events: AppEvent[] = a.timeline.map((e) => ({
            status: e.to_status,
            at: e.at,
            by:
              e.actor_type === "applicant"
                ? "family"
                : e.actor_type === "academy"
                  ? "academy"
                  : "system",
            note: e.note ?? "",
          }))
          return (
            <div className="grid gap-[clamp(18px,2.2vw,26px)]">
              <AdminHeader
                title={`${a.player.first_name} ${a.player.last_name}`}
                subtitle={[a.reference, a.listing.title, a.academy.name]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Notice tone="neutral" icon="info">
                {t.readOnly}
              </Notice>
              <Grid2>
                <Stack>
                  <CardBlock aria-labelledby="h-a-sum">
                    <SectionHead id="h-a-sum" title={t.title} />
                    <StatusTag status={a.status} />
                    <KvLines>
                      <Kv label={t.reference}>{a.reference ?? C.none}</Kv>
                      <Kv
                        label={t.family}
                      >{`${a.applicant.name} · ${a.applicant.email} · ${a.applicant.relationship}`}</Kv>
                      <Kv
                        label={t.academy}
                      >{`${a.academy.name} (${a.academy.organization.name})`}</Kv>
                      <Kv label={t.program}>{a.listing.title}</Kv>
                      <Kv label={ADMIN.listings.intakes}>
                        {date(a.intake.start_date)}
                      </Kv>
                      <Kv label={ADMIN.listings.submitted}>
                        {date(a.submitted_at)}
                      </Kv>
                    </KvLines>
                    {a.decision_reason ? (
                      <Notice tone="neutral" icon="info">
                        {a.decision_reason}
                      </Notice>
                    ) : null}
                    {a.info_request_note ? (
                      <Notice tone="neutral" icon="info">
                        {a.info_request_note}
                      </Notice>
                    ) : null}
                  </CardBlock>
                  {a.questions.length ? (
                    <CardBlock aria-labelledby="h-a-q">
                      <SectionHead
                        id="h-a-q"
                        title={LIVE.application.answers}
                      />
                      <KvLines>
                        {a.questions.map((q) => (
                          <Kv key={q.position} label={q.question}>
                            {q.answer === true
                              ? LIVE.application.yes
                              : q.answer === false
                                ? LIVE.application.no
                                : q.answer || C.none}
                          </Kv>
                        ))}
                      </KvLines>
                    </CardBlock>
                  ) : null}
                  <CardBlock aria-labelledby="h-a-docs">
                    <SectionHead
                      id="h-a-docs"
                      title={LIVE.application.documents}
                    />
                    {a.documents.length ? (
                      <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
                        {a.documents.map((d) => (
                          <li
                            key={d.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-1 bg-bg-2 p-3 text-fs-14"
                          >
                            <span>
                              <b>
                                {LIVE.application.docLabels[d.type] ?? d.type}
                              </b>{" "}
                              · {d.original_name}
                            </span>
                            <span className="flex items-center gap-2">
                              <StatusPill
                                tone={
                                  d.review_status === "accepted"
                                    ? "success"
                                    : d.review_status === "needs_update"
                                      ? "warning"
                                      : "ghost"
                                }
                              >
                                {LIVE.application.review[d.review_status]}
                              </StatusPill>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  downloadPrivateFile(
                                    d.download_url,
                                    d.original_name
                                  ).catch(() => undefined)
                                }
                              >
                                {LIVE.application.download}
                              </Button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-fs-14 text-fg-3">{C.none}</p>
                    )}
                  </CardBlock>
                </Stack>
                <Stack>
                  <CardBlock aria-labelledby="h-a-tl">
                    <SectionHead id="h-a-tl" title={t.timeline} />
                    <Timeline app={{ status: a.status as never, events }} />
                  </CardBlock>
                  <CardBlock aria-labelledby="h-a-conv">
                    <SectionHead id="h-a-conv" title={t.conversation} />
                    {a.conversation?.length ? (
                      <ul className="grid gap-2">
                        {a.conversation.map((m, i) => (
                          <li
                            key={m.kind === "message" ? `m${m.id}` : `s${i}`}
                            className="rounded-md border border-border-1 bg-bg-2 p-3 text-fs-14"
                          >
                            {m.kind === "status" ? (
                              <span className="text-fg-3">
                                {ADMIN.status[m.to_status] ?? m.to_status}
                                {m.actor_name ? ` · ${m.actor_name}` : ""}
                                {` · ${date(m.at)}`}
                                {m.note ? ` · ${m.note}` : ""}
                              </span>
                            ) : (
                              <>
                                <small className="block text-fs-12 text-fg-3">
                                  {`${m.sender_name} · ${date(m.at)}`}
                                </small>
                                {m.body ? (
                                  <span className="whitespace-pre-line">
                                    {m.body}
                                  </span>
                                ) : null}
                                {m.attachment ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1"
                                    onClick={() =>
                                      downloadPrivateFile(
                                        adminAttachmentPath(a.id, m.id),
                                        m.attachment?.name ?? "attachment"
                                      ).catch(() => undefined)
                                    }
                                  >
                                    <Icon name="clip" size={14} />{" "}
                                    {m.attachment.name}
                                  </Button>
                                ) : null}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-fs-14 text-fg-3">{t.noConversation}</p>
                    )}
                  </CardBlock>
                </Stack>
              </Grid2>
            </div>
          )
        }}
      </QueryState>
    </>
  )
}
