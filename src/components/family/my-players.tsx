"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { PlayerDialog } from "@/components/family/live-players"
import { Icon } from "@/components/icons/icon"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { CardBlock } from "@/components/shared/card-block"
import { EmptyState } from "@/components/shared/empty-state"
import { Modal } from "@/components/shared/modal"
import { Notice } from "@/components/shared/notice"
import { QueryState } from "@/components/shared/query-state"
import { SectionHead } from "@/components/shared/section-head"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import { searchListings, type ApiSearchCard } from "@/features/academies/api"
import { useCountries } from "@/features/auth/hooks"
import type { ApiMeOptions, ApiPlayer } from "@/features/family/api"
import { useLivePlayers } from "@/features/family/hooks"
import { ageOn } from "@/features/family/player-form"
import { todayISO } from "@/lib/date"
import { routes } from "@/routes"

/*
 * The family dashboard's "My players" (product story): every profile from
 * GET /academy/me/players with its relationship, completeness and missing
 * fields; Add player (POST /academy/me/players), Edit player, and Start
 * application (pick a program from GET /academy/search, then Apply).
 * A self profile under consent_age cannot upload documents or apply.
 */

const L = LIVE.players

/** A self profile under consent_age (or without a date of birth yet) */
export function isMinorSelf(p: ApiPlayer, options: ApiMeOptions): boolean {
  if (p.owner_relationship !== "self") return false
  if (!p.date_of_birth) return true
  return ageOn(p.date_of_birth, todayISO()) < options.consent_age
}

export function MyPlayers() {
  const players = useLivePlayers()
  const countries = useCountries()
  const [dialog, setDialog] = useState<{ player: ApiPlayer | null } | null>(
    null
  )
  const [applyFor, setApplyFor] = useState<ApiPlayer | null>(null)
  const list = players.data?.players ?? []
  const hasSelf = list.some((p) => p.owner_relationship === "self")

  return (
    <CardBlock aria-labelledby="h-my-players">
      <SectionHead
        id="h-my-players"
        title={L.myPlayers}
        action={
          players.data ? (
            <Button size="sm" onClick={() => setDialog({ player: null })}>
              <Icon name="plus" size={15} /> {L.add}
            </Button>
          ) : null
        }
      />
      <QueryState
        query={players}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[160px] animate-pulse rounded-md bg-bg-2" />
        }
        isEmpty={(d) => d.players.length === 0}
        empty={
          <EmptyState icon="user" title={L.emptyTitle} text={L.emptyText} />
        }
      >
        {(d) => (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3">
            {d.players.map((p) => {
              const minorSelf = isMinorSelf(p, d.options)
              const age = p.date_of_birth
                ? ageOn(p.date_of_birth, todayISO())
                : null
              return (
                <li
                  key={p.id}
                  className="grid content-start gap-3 rounded-md border border-border-1 bg-bg-2 p-[14px]"
                >
                  <div className="flex items-center gap-3">
                    <AvatarInitials
                      initials={(
                        (p.first_name[0] ?? "") + (p.last_name[0] ?? "")
                      ).toUpperCase()}
                      size={40}
                      tone="soft"
                    />
                    <span className="grid min-w-0">
                      <b className="truncate text-fs-16">
                        {p.first_name} {p.last_name}
                      </b>
                      <small className="text-fs-13 text-fg-3">
                        {[
                          L.relationshipShort[p.owner_relationship] ??
                            p.owner_relationship,
                          age !== null ? `${age}` : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </span>
                    <span className="ml-auto">
                      <StatusPill tone={p.is_complete ? "success" : "warning"}>
                        {p.is_complete ? L.complete : L.incomplete}
                      </StatusPill>
                    </span>
                  </div>
                  {!p.is_complete && p.missing_fields.length ? (
                    <p className="text-fs-13 text-fg-2">
                      <b className="text-fg-1">{L.missing}</b>{" "}
                      {p.missing_fields.map((m) => m.label).join(", ")}
                    </p>
                  ) : null}
                  {minorSelf ? (
                    <Notice tone="neutral" icon="info">
                      {L.minorSelf}
                    </Notice>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDialog({ player: p })}
                    >
                      <Icon name="edit" size={14} /> {L.editPlayer}
                    </Button>
                    {p.is_complete && !minorSelf ? (
                      <Button size="sm" onClick={() => setApplyFor(p)}>
                        {L.startApplication} <Icon name="arrow" size={14} />
                      </Button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </QueryState>
      {players.data && dialog ? (
        <PlayerDialog
          key={dialog.player?.id ?? "new"}
          player={dialog.player}
          options={players.data.options}
          hasSelf={hasSelf}
          countries={countries ?? []}
          onClose={() => setDialog(null)}
          onSaved={() => setDialog(null)}
          onDeleted={() => setDialog(null)}
        />
      ) : null}
      {applyFor ? (
        <ProgramPicker player={applyFor} onClose={() => setApplyFor(null)} />
      ) : null}
    </CardBlock>
  )
}

/** Programs open now (GET /academy/search, soonest start first), filtered by the player's age */
function ProgramPicker({
  player,
  onClose,
}: {
  player: ApiPlayer
  onClose: () => void
}) {
  const router = useRouter()
  const age = player.date_of_birth
    ? ageOn(player.date_of_birth, todayISO())
    : undefined
  const query = useQuery({
    queryKey: ["program-picker", age ?? null],
    queryFn: () =>
      searchListings({
        sort: "start_date",
        has_places: true,
        per_page: 50,
        ...(age ? { age } : {}),
      }),
  })
  const pick = (c: ApiSearchCard) =>
    router.push(
      `${routes.apply(c.slug)}${routes.apply(c.slug).includes("?") ? "&" : "?"}player=${player.id}`
    )
  return (
    <Modal
      open
      onClose={onClose}
      title={`${L.chooseProgram}: ${player.first_name}`}
    >
      <p className="text-fs-14 text-fg-2">{L.chooseProgramText}</p>
      <QueryState
        query={{ ...query, data: query.data?.data }}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[200px] animate-pulse rounded-md bg-bg-2" />
        }
        isEmpty={(rows) => rows.length === 0}
        empty={<p className="text-fs-14 text-fg-3">{L.noPrograms}</p>}
      >
        {(rows) => (
          <ul className="mt-3 grid max-h-[50vh] gap-2 overflow-y-auto">
            {rows.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => pick(c)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border-1 bg-bg-2 p-3 text-left hover:border-border-accent"
                >
                  <span className="grid min-w-0">
                    <b className="truncate text-fs-14">{c.title}</b>
                    <small className="text-fs-12 text-fg-3">
                      {[
                        c.academy.name,
                        `${c.academy.city}, ${c.academy.country_name}`,
                        c.next_start_date ? DATES.fmt(c.next_start_date) : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </span>
                  <Icon name="chevr" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </Modal>
  )
}
