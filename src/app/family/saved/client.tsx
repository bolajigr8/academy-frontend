"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"

import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { EmptyState } from "@/components/shared/empty-state"
import { ListingCard } from "@/components/shared/listing-card"
import { useSaveToggle } from "@/components/shared/use-save-toggle"
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
import { DATES, PROVISION } from "@/data/catalog"
import { EMPTY } from "@/data/copy"
import { FAMILY } from "@/data/family-copy"
import { feeLabel, fmtEuro } from "@/features/academies/search"
import { useFamilySaved } from "@/features/family/hooks"
import { easeOut } from "@/lib/motion"
import { routes } from "@/routes"

/* Saved academies (account/saved.html): cards with remove + undo, or a comparison table */
export function FamilySavedClient() {
  const { list, eligibleFor } = useFamilySaved()
  const onSave = useSaveToggle()
  const [view, setView] = useState<"cards" | "compare">("cards")
  const t = FAMILY.saved
  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={t.subtitle(list.length)}
        actions={
          list.length > 1 ? (
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
      {list.length === 0 ? (
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
          {list.map((l, i) => {
            const who = eligibleFor(l)
            return (
              <div
                key={l.id}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2"
              >
                <ListingCard index={i} listing={l} saved onSave={onSave} />
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
        >
          <h2 className="am-sr">{t.compareTitle}</h2>
          <Table>
            <TableHeader>
              <TableRow>
                {t.cols.map((c) => (
                  <TableHead key={c} scope="col">
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Link className="am-link" href={routes.academy(l.id)}>
                      {l.title}
                    </Link>
                    <small>{l.academy.name}</small>
                  </TableCell>
                  <TableCell>{feeLabel(l)}</TableCell>
                  <TableCell>{fmtEuro(l.monthly)}</TableCell>
                  <TableCell>
                    {l.nextIntake ? DATES.fmt(l.nextIntake.start) : "—"}
                  </TableCell>
                  <TableCell>
                    {l.nextIntake ? DATES.fmt(l.nextIntake.deadline) : "—"}
                  </TableCell>
                  <TableCell>
                    {l.ageMin}–{l.ageMax}
                  </TableCell>
                  <TableCell>{PROVISION[l.accommodation]}</TableCell>
                  <TableCell>{PROVISION[l.education]}</TableCell>
                  <TableCell>
                    {l.reviewSummary.count
                      ? `${l.reviewSummary.avg.toFixed(1)} (${l.reviewSummary.count})`
                      : t.newRating}
                  </TableCell>
                  <TableCell>
                    <VerifyBadge v={l.verification} compact />
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
