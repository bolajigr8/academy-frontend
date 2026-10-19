"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { useLiveSaved } from "@/components/search/use-live-saved"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { ListingCard } from "@/components/shared/listing-card"
import { VerifyBadge } from "@/components/shared/verify-badge"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DATES } from "@/data/catalog"
import { EMPTY } from "@/data/copy"
import { FAMILY } from "@/data/family-copy"
import { LIVE } from "@/data/live-copy"
import { listSaved, type ApiSearchCard } from "@/features/academies/api"
import {
  apiDurationLabel,
  cardFromSearch,
} from "@/features/academies/card-view"
import { discoveryKeys } from "@/features/academies/query-keys"
import { listPlayers, type ApiPlayer } from "@/features/family/api"
import { familyKeys } from "@/features/family/query-keys"
import { useSession } from "@/features/auth/session"
import { ageOn, todayISO } from "@/lib/date"
import { easeOut } from "@/lib/motion"
import { formatMoney } from "@/lib/money"
import { routes } from "@/routes"

/** Every saved listing: GET /academy/me/saved, pages of 50 (the largest allowed) */
async function allSaved(): Promise<ApiSearchCard[]> {
  const out: ApiSearchCard[] = []
  for (let page = 1; ; page++) {
    const res = await listSaved(page, 50)
    out.push(...res.data)
    if (page >= (res.meta?.last_page ?? 1)) return out
  }
}

/** The family's players whose age on the program's next start fits its age range */
function eligible(c: ApiSearchCard, players: ApiPlayer[], today: string) {
  if (c.age_min === null || c.age_max === null) return []
  const on = c.next_start_date ?? today
  return players
    .filter((p) => {
      const age = p.date_of_birth ? ageOn(p.date_of_birth, on) : null
      return age !== null && age >= (c.age_min ?? 0) && age <= (c.age_max ?? 0)
    })
    .map((p) => p.first_name)
}

/*
 * Saved academies in api mode (week 1 part 2, section 16). The list is the
 * backend's (most recently saved first; a listing that goes offline drops out
 * by itself). Removing keeps the prototype's Undo toast. "Eligible" is worked
 * out from the family's own players (date of birth on the next start date).
 * The compare table shows only the columns the search card carries: no
 * monthly equivalent and no application deadline.
 */
export function LiveSavedClient() {
  const t = FAMILY.saved
  const { user } = useSession()
  const saved = useLiveSaved()
  const [view, setView] = useState<"cards" | "compare">("cards")
  const list = useQuery({ queryKey: discoveryKeys.saved(), queryFn: allSaved })
  const players = useQuery({
    queryKey: familyKeys.players(),
    queryFn: listPlayers,
    enabled: user?.role === "applicant",
  })
  const today = todayISO()
  // a card removed here stays hidden while its Undo is offered
  const shown = (list.data ?? []).filter((c) => saved.isSaved(c))
  const cols = t.cols.filter((c) => c !== "≈ per month" && c !== "Apply by")

  if (list.isError && !list.data)
    return (
      <>
        <PageHeading title={t.title} />
        <ErrorState
          message={LIVE.requestFailed}
          onRetry={() => void list.refetch()}
        />
      </>
    )

  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={list.data ? t.subtitle(shown.length) : undefined}
        actions={
          shown.length > 1 ? (
            <Button
              variant="secondary"
              size="sm"
              aria-pressed={view === "compare"}
              onClick={() => setView(view === "cards" ? "compare" : "cards")}
            >
              <Icon name={view === "cards" ? "list" : "grid"} size={16} />
              {view === "cards" ? t.compare : t.cards}
            </Button>
          ) : null
        }
      />
      {!list.data ? (
        <div
          aria-hidden="true"
          className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-6"
        >
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-[380px] animate-pulse rounded-lg bg-bg-2"
            />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon="heart"
          title={EMPTY.saved.title}
          text={EMPTY.saved.text}
          cta={
            <ButtonLink href={routes.academies()}>{EMPTY.saved.cta}</ButtonLink>
          }
        />
      ) : view === "cards" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(20px,2.5vw,32px)]">
          {shown.map((c, i) => {
            const who = players.data ? eligible(c, players.data, today) : null
            return (
              <div
                key={c.id}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2"
              >
                <ListingCard
                  index={i}
                  card={cardFromSearch(c)}
                  saved
                  onSave={() => void saved.toggle(c)}
                />
                {who && players.data?.length ? (
                  <p className="text-fs-14 text-fg-3">
                    {who.length ? (
                      <>
                        <Icon name="checkcircle" size={14} className="inline" />{" "}
                        {t.eligible} {who.join(" & ")}
                      </>
                    ) : (
                      t.noMatch
                    )}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : (
        <motion.section
          aria-label={t.compareTitle}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="overflow-x-auto"
        >
          <h2 className="am-sr">{t.compareTitle}</h2>
          <Table>
            <TableHeader>
              <TableRow>
                {cols.map((c) => (
                  <TableHead key={c} scope="col">
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link className="am-link" href={routes.academy(c.slug)}>
                      {c.title}
                    </Link>
                    <small>{c.academy.name}</small>
                  </TableCell>
                  <TableCell>
                    {c.price ? formatMoney(c.price) : "—"}
                    {c.duration.value !== null ? (
                      <small>
                        {apiDurationLabel(c.duration.value, c.duration.unit)}
                      </small>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {c.next_start_date ? DATES.fmt(c.next_start_date) : "—"}
                  </TableCell>
                  <TableCell>
                    {c.age_min !== null && c.age_max !== null
                      ? `${c.age_min}–${c.age_max}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {c.has_accommodation
                      ? LIVE.search.withIt
                      : LIVE.search.without}
                  </TableCell>
                  <TableCell>
                    {c.has_education ? LIVE.search.withIt : LIVE.search.without}
                  </TableCell>
                  <TableCell>
                    {c.reviews_count
                      ? `${Number(c.rating_avg).toFixed(1)} (${c.reviews_count})`
                      : t.newRating}
                  </TableCell>
                  <TableCell>
                    <VerifyBadge
                      v={
                        c.academy.verification_status === "club_academy"
                          ? "club"
                          : "verified"
                      }
                      compact
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.section>
      )}
    </>
  )
}
