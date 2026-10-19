"use client"

import { motion } from "framer-motion"

import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { LISTING_STATUS } from "@/components/club/listing-status"
import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { Crest } from "@/components/shared/crest"
import { EmptyState } from "@/components/shared/empty-state"
import { Modal } from "@/components/shared/modal"
import { notify } from "@/components/shared/notify"
import { QueryState } from "@/components/shared/query-state"
import { SafeImage } from "@/components/shared/safe-image"
import { SegmentedControl } from "@/components/shared/segmented-control"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { CLUB } from "@/data/club-copy"
import { LIVE } from "@/data/live-copy"
import { useAcademiesQuery, useClubListings } from "@/features/club/hooks"
import { listingAction, type ListingAction } from "@/features/club/api"
import { removeDraft } from "@/features/club/live-editor"
import { clubKeys } from "@/features/club/query-keys"
import type { ClubListingRow } from "@/features/club/view-models"
import { getApiErrorMessage } from "@/lib/api/errors"
import { isLive } from "@/lib/data-source"
import { cn } from "@/lib/utils"
import { inView } from "@/lib/motion"
import { routes } from "@/routes"

type Tab = "all" | "published" | "in_review" | "draft"

const stat =
  "grid text-right le-1100:hidden [&_b]:font-display [&_b]:text-fs-20 [&_b]:tabular-nums [&_small]:text-fs-12 [&_small]:text-fg-3"

/** The editor works on demo data in mock mode, and on the backend once it is connected */
const EDITOR_ON = !isLive("clubPortal") || isLive("listingEditor")
/** Deleting a draft is a backend action (DELETE /academy/portal/listings/{id}) */
const CAN_DELETE = isLive("listingEditor")

/* Listings (host/listings.html) */
export function ClubListingsClient() {
  const query = useClubListings()
  // api mode: no academy profile yet means no listing can be created
  const academies = useAcademiesQuery()
  const noAcademy = isLive("clubPortal") && academies.data?.length === 0
  const [tab, setTab] = useState<Tab>("all")
  const [deleting, setDeleting] = useState<ClubListingRow | null>(null)
  const [archiving, setArchiving] = useState<ClubListingRow | null>(null)
  const t = CLUB.listings
  const all = query.data ?? []
  const count = (s: Tab) =>
    all.filter((l) => s === "all" || l.status === s).length

  const createButton = EDITOR_ON ? (
    <ButtonLink href={routes.club.newListing} variant="primary" size="sm">
      <Icon name="plus" size={16} />
      <span className="le-600:hidden">{t.create}</span>
    </ButtonLink>
  ) : null

  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={t.subtitle}
        actions={createButton}
      />
      <SegmentedControl<Tab>
        label={t.filter}
        value={tab}
        onChange={setTab}
        tabs={(["all", "published", "in_review", "draft"] as const).map(
          (value) => ({ value, label: t.tabs[value], count: count(value) })
        )}
      />
      <QueryState
        query={query}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="grid gap-[10px]">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[110px] animate-pulse rounded-md bg-bg-2"
              />
            ))}
          </div>
        }
        isEmpty={(rows) =>
          rows.filter((l) => tab === "all" || l.status === tab).length === 0
        }
        empty={
          noAcademy ? (
            <EmptyState
              icon="building"
              title={LIVE.noAcademy.title}
              text={LIVE.noAcademy.text}
              cta={
                <ButtonLink href={routes.club.editProfile} variant="primary">
                  {LIVE.profileForm.createAcademy}
                </ButtonLink>
              }
            />
          ) : (
            <EmptyState
              icon="layers"
              title={t.emptyTitle}
              text={t.emptyText}
              cta={
                EDITOR_ON ? (
                  <ButtonLink href={routes.club.newListing} variant="primary">
                    {t.create}
                  </ButtonLink>
                ) : undefined
              }
            />
          )
        }
      >
        {(rows) => (
          <ul className="grid gap-[10px]">
            {rows
              .filter((l) => tab === "all" || l.status === tab)
              .map((l, i) => (
                <Row
                  key={l.id}
                  l={l}
                  i={i}
                  onDelete={
                    CAN_DELETE && l.status === "draft"
                      ? () => setDeleting(l)
                      : undefined
                  }
                  onArchive={
                    CAN_DELETE &&
                    ["in_review", "published", "paused", "rejected"].includes(
                      l.status
                    )
                      ? () => setArchiving(l)
                      : undefined
                  }
                />
              ))}
          </ul>
        )}
      </QueryState>
      <DeleteDraftDialog row={deleting} onClose={() => setDeleting(null)} />
      <ArchiveDialog row={archiving} onClose={() => setArchiving(null)} />
    </>
  )
}

/* Confirm, then DELETE /academy/portal/listings/{id} (drafts only) */
function DeleteDraftDialog({
  row,
  onClose,
}: {
  row: ClubListingRow | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = LIVE.deleteDraft
  const close = () => {
    setError(null)
    onClose()
  }
  const confirm = async () => {
    if (!row) return
    setBusy(true)
    setError(null)
    try {
      await removeDraft(Number(row.id))
      await queryClient.invalidateQueries({ queryKey: clubKeys.listings() })
      notify(t.done)
      close()
    } catch (e) {
      setError(getApiErrorMessage(e, LIVE.requestFailed))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open={row !== null}
      onClose={close}
      title={t.title}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>
            {t.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={() => confirm()}
            disabled={busy}
            aria-busy={busy}
            data-autofocus
          >
            {t.confirm}
          </Button>
        </>
      }
    >
      <p className="text-fs-16 leading-lh-relaxed text-fg-2">
        <b className="text-fg-1">{row?.title}</b>. {t.text}
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-fs-14 text-fg-1">
          {error}
        </p>
      ) : null}
    </Modal>
  )
}

/** POST /academy/portal/listings/{id}/{action}; the backend's message is the toast */
function useListingAction() {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<string | null>(null)
  const run = async (id: string, action: ListingAction): Promise<boolean> => {
    setBusy(id)
    try {
      const { message } = await listingAction(Number(id), action)
      await queryClient.invalidateQueries({ queryKey: clubKeys.listings() })
      notify(message)
      return true
    } catch {
      // the error toast is shown for every failed request (app providers)
      return false
    } finally {
      setBusy(null)
    }
  }
  return { busy, run }
}

/* Confirm, then POST /academy/portal/listings/{id}/archive (final) */
function ArchiveDialog({
  row,
  onClose,
}: {
  row: ClubListingRow | null
  onClose: () => void
}) {
  const { busy, run } = useListingAction()
  const t = LIVE.listingStatus2
  return (
    <Modal
      open={row !== null}
      onClose={onClose}
      title={t.archiveTitle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={!!busy}>
            {t.cancel}
          </Button>
          <Button
            variant="danger"
            disabled={!!busy}
            aria-busy={!!busy}
            data-autofocus
            onClick={() =>
              row && void run(row.id, "archive").then((ok) => ok && onClose())
            }
          >
            {t.archiveConfirm}
          </Button>
        </>
      }
    >
      <p className="text-fs-16 leading-lh-relaxed text-fg-2">
        <b className="text-fg-1">{row?.title}</b>. {t.archiveText}
      </p>
    </Modal>
  )
}

function Row({
  l,
  i,
  onDelete,
  onArchive,
}: {
  l: ClubListingRow
  i: number
  onDelete?: () => void
  onArchive?: () => void
}) {
  const { busy, run } = useListingAction()
  const s2 = LIVE.listingStatus2
  const t = CLUB.listings
  const [label, tone] = LISTING_STATUS[l.status]
  const stats = 1 + Number(l.views !== null) + Number(l.applications !== null)
  return (
    <motion.li
      {...inView(i)}
      className={cn(
        "grid items-center gap-[18px] rounded-md border border-border-1 bg-surface-elevated p-3 le-1100:grid-cols-[96px_minmax(0,1fr)_auto] le-640:grid-cols-[72px_minmax(0,1fr)]",
        stats === 3
          ? "grid-cols-[120px_minmax(0,1fr)_repeat(3,auto)_auto]"
          : stats === 2
            ? "grid-cols-[120px_minmax(0,1fr)_repeat(2,auto)_auto]"
            : "grid-cols-[120px_minmax(0,1fr)_auto_auto]"
      )}
    >
      <div className="relative h-[84px] w-[120px] overflow-hidden rounded-sm bg-bg-3 le-1100:h-[72px] le-1100:w-24 le-640:size-[72px]">
        {l.image ? (
          <SafeImage
            src={l.image}
            alt=""
            fill
            unoptimized={l.remoteImage}
            sizes="(max-width: 640px) 72px, (max-width: 1100px) 96px, 120px"
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-bg-3"
          >
            <Crest size={40} className="opacity-70" />
          </span>
        )}
      </div>
      <div className="grid min-w-0 gap-1">
        <StatusPill tone={tone}>{label}</StatusPill>
        <b className="font-display text-fs-16">{l.title}</b>
        {l.meta.length > 0 ? (
          <p className="text-fs-14 text-fg-3">{l.meta.join(" · ")}</p>
        ) : null}
        <p className="text-fs-14 text-fg-3">
          {l.next
            ? [`Next start ${DATES.fmt(l.next.start)}`, l.next.places]
                .filter(Boolean)
                .join(" · ")
            : t.noOpenStart}
        </p>
        {l.rejectionReason ? (
          <p className="text-fs-14 text-fg-1">
            <b>{s2.rejectedLead}</b> {l.rejectionReason}
          </p>
        ) : null}
      </div>
      {l.views !== null ? (
        <div className={stat}>
          <b>{l.views.toLocaleString("en-US")}</b>
          <small>{t.views}</small>
        </div>
      ) : null}
      {l.applications !== null ? (
        <div className={stat}>
          <b>{l.applications}</b>
          <small>{t.applications}</small>
        </div>
      ) : null}
      <div className={stat}>
        <b>{`${l.completeness}%`}</b>
        <small>{t.complete}</small>
      </div>
      <div className="flex flex-wrap justify-end gap-1.5 le-1100:col-span-full le-1100:justify-start">
        {l.editHref ? (
          <ButtonLink href={l.editHref} variant="secondary" size="sm">
            <Icon name="edit" size={15} /> {t.edit}
          </ButtonLink>
        ) : null}
        {CAN_DELETE && l.status === "published" ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy === l.id}
            aria-busy={busy === l.id}
            onClick={() => run(l.id, "pause")}
          >
            <Icon name="clock" size={15} /> {s2.pause}
          </Button>
        ) : null}
        {CAN_DELETE && l.status === "paused" ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy === l.id}
            aria-busy={busy === l.id}
            onClick={() => run(l.id, "resume")}
          >
            <Icon name="arrow" size={15} /> {s2.resume}
          </Button>
        ) : null}
        {onArchive ? (
          <Button variant="ghost" size="sm" onClick={onArchive}>
            <Icon name="x" size={15} /> {s2.archive}
          </Button>
        ) : null}
        {onDelete ? (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Icon name="trash" size={15} /> {LIVE.deleteDraft.action}
          </Button>
        ) : null}
        {l.viewHref ? (
          <ButtonLink href={l.viewHref} variant="ghost" size="sm">
            <Icon name="eye" size={15} />{" "}
            {l.status === "published" ? t.view : t.preview}
          </ButtonLink>
        ) : null}
      </div>
    </motion.li>
  )
}
