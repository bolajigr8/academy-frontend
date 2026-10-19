"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { PlayerDialog } from "@/components/family/live-players"
import { Icon } from "@/components/icons/icon"

import { CardBlock } from "@/components/shared/card-block"
import { FormField } from "@/components/shared/form-field"
import { NativeSelect } from "@/components/shared/native-select"
import { Notice } from "@/components/shared/notice"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import {
  startApplication,
  type ApiPublicListing,
} from "@/features/academies/api"
import { placesLabel } from "@/features/academies/search"
import { useCountries } from "@/features/auth/hooks"
import { useSession } from "@/features/auth/session"
import { useLivePlayers } from "@/features/family/hooks"
import { isMinorSelf } from "@/components/family/my-players"
import { routes } from "@/routes"

import { ApplicationJourney } from "./application-journey"
import { FlowBar } from "./flow-bar"

/*
 * Apply to Join in api mode, step 1 of the contract's flow (week 2 part 1,
 * section 9): pick a player and a start date, then POST
 * /academy/listings/{id}/applications. Steps 2 to 6 (profile gaps, answers,
 * documents, review, submit with consent) are the application page.
 */
export function LiveApply({
  l,
  intake,
  player: preselected = null,
}: {
  l: ApiPublicListing
  intake: string | null
  /** preselected from the dashboard's "Start application" */
  player?: string | null
}) {
  const t = LIVE.apply
  const router = useRouter()
  const { user, hydrated } = useSession()
  const players = useLivePlayers()
  const open = l.intakes.filter(
    (i) => i.status === "open" && i.places_left !== 0
  )
  const [intakeId, setIntakeId] = useState(
    open.find((i) => String(i.id) === intake)?.id ?? open[0]?.id ?? 0
  )
  const [playerId, setPlayerId] = useState(() =>
    preselected && /^\d+$/.test(preselected) ? Number(preselected) : 0
  )
  const [busy, setBusy] = useState(false)
  // "pick a profile or create one" (week 2 part 1, the Apply flow): the same
  // Add player dialog as the dashboard; the new player is selected at once
  const [adding, setAdding] = useState(false)
  const countries = useCountries()
  const here = routes.apply(l.slug, intake ?? undefined)
  const list = players.data?.players ?? []
  const player = list.find((p) => p.id === playerId) ?? null
  // a self profile under 18 cannot apply: a parent or guardian continues from their own account
  const minorSelf =
    player && players.data ? isMinorSelf(player, players.data.options) : false

  const go = async () => {
    setBusy(true)
    try {
      const app = await startApplication(l.id, playerId, intakeId)
      router.push(routes.family.application(String(app.id)))
    } catch {
      // refusals (age_out_of_range, deadline_passed, intake_full, already_applied, …)
      // are shown with the backend's message by the error toast
      setBusy(false)
    }
  }

  return (
    <>
      <FlowBar exitHref={routes.academy(l.slug)} exitLabel={t.backToProgram} />
      <main
        id="main"
        className="am-container grid max-w-[720px] gap-5 py-10 le-600:py-6"
      >
        {/* Added (Oct 2026 UX round): where this step sits in the whole application */}
        <ApplicationJourney
          current={0}
          steps={[
            { label: LIVE.journey.pick, done: false },
            { label: LIVE.journey.answers, done: false },
            { label: LIVE.journey.documents, done: false },
            { label: LIVE.journey.send, done: false },
          ]}
        />
        <p className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
          {l.academy.name}
        </p>
        <h1 className="font-display text-[clamp(28px,4vw,44px)] leading-none font-bold uppercase">
          {t.title}: {l.title}
        </h1>
        <p className="text-fs-16 leading-lh-relaxed text-fg-2">{t.lead}</p>
        <CardBlock aria-label={t.title}>
          {!hydrated ? null : !user ? (
            <ButtonLink href={routes.login(here, "family")}>
              {t.signIn}
            </ButtonLink>
          ) : user.role === "academy" ? (
            <Notice tone="warning" icon="alert">
              {t.academyAccount}
            </Notice>
          ) : players.data && list.length === 0 ? (
            <>
              <p className="text-fs-16 text-fg-2">{t.noPlayers}</p>
              <Button
                className="justify-self-start"
                onClick={() => setAdding(true)}
              >
                <Icon name="plus" size={16} /> {t.addPlayer}
              </Button>
            </>
          ) : (
            <form
              noValidate
              className="grid gap-[18px]"
              onSubmit={(e) => {
                e.preventDefault()
                void go()
              }}
            >
              <FormField id="apply-player" label={t.player} required>
                {(p) => (
                  <NativeSelect
                    {...p}
                    value={playerId || ""}
                    onChange={(e) => setPlayerId(Number(e.target.value))}
                  >
                    <option value="">{t.choosePlayer}</option>
                    {list.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.first_name} {x.last_name}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </FormField>
              <Button
                variant="ghost"
                size="sm"
                className="-mt-2 justify-self-start"
                onClick={() => setAdding(true)}
              >
                <Icon name="plus" size={14} /> {t.addPlayer}
              </Button>
              {minorSelf ? (
                <Notice tone="warning" icon="alert">
                  {LIVE.players.minorSelf}
                </Notice>
              ) : null}
              {player && !player.is_complete && !minorSelf ? (
                <Notice tone="neutral" icon="info">
                  {t.notComplete}
                </Notice>
              ) : null}
              <FormField id="apply-intake" label={t.intake} required>
                {(p) => (
                  <NativeSelect
                    {...p}
                    value={intakeId || ""}
                    onChange={(e) => setIntakeId(Number(e.target.value))}
                  >
                    {open.map((i) => (
                      <option key={i.id} value={i.id}>
                        {DATES.fmt(i.start_date)}
                        {i.label ? ` · ${i.label}` : ""}
                        {i.places_left !== null
                          ? ` · ${placesLabel(i.places_left)}`
                          : ""}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </FormField>
              <Button
                type="submit"
                size="lg"
                disabled={busy || !playerId || !intakeId || minorSelf}
                aria-busy={busy}
              >
                {t.start} <Icon name="arrow" size={16} />
              </Button>
            </form>
          )}
        </CardBlock>
      </main>
      {adding && players.data ? (
        <PlayerDialog
          player={null}
          options={players.data.options}
          hasSelf={list.some((p) => p.owner_relationship === "self")}
          countries={countries ?? []}
          onClose={() => setAdding(false)}
          onSaved={(p) => {
            setPlayerId(p.id)
            setAdding(false)
          }}
          onDeleted={() => setAdding(false)}
        />
      ) : null}
    </>
  )
}
