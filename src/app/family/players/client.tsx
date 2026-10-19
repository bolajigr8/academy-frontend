"use client"

import { LivePlayersClient } from "@/components/family/live-players"
import { isLive } from "@/lib/data-source"

import { motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useState } from "react"

import { PlayerEditDialog } from "@/components/family/player-edit-dialog"
import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { AppRow } from "@/components/shared/app-row"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { CardBlock } from "@/components/shared/card-block"
import { DocItem, DocList } from "@/components/shared/doc-list"
import { Meter } from "@/components/shared/meter"
import { notify } from "@/components/shared/notify"
import { Grid2, Stack } from "@/components/shared/page-grid"
import { ProfileHero } from "@/components/shared/profile-hero"
import { SectionHead } from "@/components/shared/section-head"
import { SegmentedControl } from "@/components/shared/segmented-control"
import { SpecCells } from "@/components/shared/spec-cells"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  numberColumn,
} from "@/components/ui/table"
import { DATES, DOC_TYPES } from "@/data/catalog"
import { FAMILY } from "@/data/family-copy"
import type { DocTypeId } from "@/data/types"
import { uploadDocument } from "@/features/applications/actions"
import { useFamilyPlayers } from "@/features/family/hooks"
import { inView, press } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

/* Reusable player profiles (account/players.html?id=). api mode: the backend's profiles. */
export function FamilyPlayersClient({ id }: { id: string }) {
  return isLive("players") ? (
    <LivePlayersClient id={id} />
  ) : (
    <DemoPlayers id={id} />
  )
}

function DemoPlayers({ id }: { id: string }) {
  const [sel, setSel] = useState(id)
  const [edit, setEdit] = useState(false)
  const d = useFamilyPlayers(sel)
  const p = d.player
  const t = FAMILY.players

  useEffect(() => {
    window.history.replaceState(null, "", routes.family.players(sel))
  }, [sel])

  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button size="sm" onClick={() => setEdit(true)}>
            <Icon name="edit" size={16} />
            <span className="le-600:hidden">{t.edit}</span>
          </Button>
        }
      />
      <SegmentedControl
        label={t.tabs}
        value={p.id}
        onChange={setSel}
        tabs={d.players.map((x) => ({
          value: x.id,
          label: `${x.firstName} ${x.lastName}`,
          count: d.ageOf(x.dob) ?? undefined,
        }))}
      />
      <ProfileHero
        id="h-player"
        age={d.age}
        avatar={<AvatarInitials initials={p.initials} size={80} />}
        meta={`${p.position} · ${p.foot} ${t.foot} · ${d.level}`}
        name={`${p.firstName} ${p.lastName}`}
        line={`${d.age} ${t.years} · ${p.nationality} · ${p.currentClub}`}
        side={<Meter value={d.pct} label={t.complete} />}
      />
      <Grid2>
        <Stack>
          <CardBlock aria-labelledby="h-foot">
            <SectionHead id="h-foot" title={t.football} />
            <SpecCells
              items={[
                { label: t.cells.dob, value: DATES.fmt(p.dob) },
                { label: t.cells.nationality, value: p.nationality },
                { label: t.cells.lives, value: p.location },
                { label: t.cells.positions, value: p.positions.join(", ") },
                { label: t.cells.foot, value: p.foot },
                {
                  label: t.cells.hw,
                  value: `${p.heightCm} cm · ${p.weightKg} kg`,
                },
                { label: t.cells.level, value: d.level },
                { label: t.cells.club, value: p.currentClub },
              ]}
            />
            {p.bio ? (
              <p className="mt-[14px] text-fs-16 leading-lh-relaxed text-fg-2">
                {p.bio}
              </p>
            ) : null}
          </CardBlock>
          <CardBlock aria-labelledby="h-cv">
            <SectionHead
              id="h-cv"
              title={t.cv}
              sub={`${t.previous} ${p.previousClubs.join(" · ")}`}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{t.season}</TableHead>
                  <TableHead scope="col">{t.clubCol}</TableHead>
                  <TableHead scope="col" className={numberColumn}>
                    {t.apps}
                  </TableHead>
                  <TableHead scope="col" className={numberColumn}>
                    {t.goals}
                  </TableHead>
                  <TableHead scope="col" className={numberColumn}>
                    {t.assists}
                  </TableHead>
                  <TableHead scope="col">{t.note}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.seasons.map((s) => (
                  <TableRow key={s.season}>
                    <TableCell className="font-mono text-fs-13">
                      {s.season}
                    </TableCell>
                    <TableCell>{s.club}</TableCell>
                    <TableCell className={numberColumn}>{s.apps}</TableCell>
                    <TableCell className={numberColumn}>{s.goals}</TableCell>
                    <TableCell className={numberColumn}>{s.assists}</TableCell>
                    <TableCell>{s.note || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ul className="mt-[14px] flex flex-wrap gap-2">
              {p.achievements.map((a, i) => (
                <motion.li
                  {...inView(i)}
                  key={a}
                  className="inline-flex items-center gap-1.5 rounded-[99px] bg-bg-3 px-3 py-1.5 text-fs-13 font-semibold"
                >
                  <Icon
                    name="trophy"
                    size={14}
                    className="text-amk-accent-ink"
                  />
                  {a}
                </motion.li>
              ))}
            </ul>
          </CardBlock>
          <CardBlock aria-labelledby="h-apps">
            <SectionHead
              id="h-apps"
              title={t.applicationsFor(p.firstName)}
              action={
                <Link
                  className="am-link"
                  href={routes.family.applicationsFor(p.id)}
                >
                  {t.viewAll}
                </Link>
              }
            />
            <ul className="grid gap-[10px]">
              {d.rows.map((r, i) => (
                <AppRow key={r.app.id} row={r} index={i} />
              ))}
            </ul>
          </CardBlock>
        </Stack>
        <Stack>
          <CardBlock aria-labelledby="h-videos">
            <SectionHead id="h-videos" title={t.videos} />
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-[10px]">
              {p.videos.map((v) => (
                <li key={v.id}>
                  <motion.a
                    {...press}
                    href={v.url}
                    rel="noopener"
                    onClick={(e) => {
                      e.preventDefault()
                      notify(t.videoToast)
                    }}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-sm border border-border-1 p-3"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-11 place-items-center rounded-[10px] bg-fg-1 text-bg-0"
                    >
                      <Icon name="video" size={20} />
                    </span>
                    <span className="grid min-w-0">
                      <b>{v.title}</b>
                      <small className="text-fs-12 text-fg-3">
                        {v.duration || t.videoLink}
                      </small>
                    </span>
                  </motion.a>
                </li>
              ))}
            </ul>
          </CardBlock>
          <CardBlock aria-labelledby="h-vault">
            <SectionHead id="h-vault" title={t.vault} sub={t.vaultSub} />
            <DocList>
              {(Object.keys(DOC_TYPES) as DocTypeId[]).map((type) => {
                const doc = d.docs.filter((x) => x.type === type).pop()
                return (
                  <DocItem
                    key={type}
                    icon={doc ? "checkcircle" : "doc"}
                    title={DOC_TYPES[type].label}
                    sub={
                      doc
                        ? `${doc.name} · ${doc.sizeKb} KB · ${DATES.fmt(doc.uploadedAt)}`
                        : t.notUploaded
                    }
                    trailing={
                      <span className="flex flex-wrap justify-end gap-1.5">
                        <input
                          type="file"
                          id={`amk-v-${type}`}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="peer am-sr"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) {
                              uploadDocument(p.id, type, f)
                              notify(t.added(DOC_TYPES[type].label))
                            }
                          }}
                        />
                        <label
                          htmlFor={`amk-v-${type}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amk-accent-ink"
                          )}
                        >
                          <Icon name="upload" size={14} />
                          {doc ? t.replace : t.upload}
                        </label>
                      </span>
                    }
                  />
                )
              })}
            </DocList>
          </CardBlock>
          <CardBlock aria-labelledby="h-guardian">
            <SectionHead id="h-guardian" title={t.guardian} />
            <SpecCells
              items={[
                {
                  label: t.guardianCells.name,
                  value: `${d.parent.firstName} ${d.parent.lastName}`,
                },
                { label: t.guardianCells.relation, value: d.parent.relation },
                { label: t.guardianCells.email, value: d.parent.email },
                { label: t.guardianCells.phone, value: d.parent.phone },
              ]}
            />
          </CardBlock>
        </Stack>
      </Grid2>
      <PlayerEditDialog
        open={edit}
        onClose={() => setEdit(false)}
        player={p}
        onSaved={() => notify(t.saved)}
      />
    </>
  )
}
