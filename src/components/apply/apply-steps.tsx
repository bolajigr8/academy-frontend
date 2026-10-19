"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import type { ReactNode } from "react"

import { Icon } from "@/components/icons/icon"
import { DefList, h4 } from "@/components/program/program-blocks"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { CheckField } from "@/components/shared/check-field"
import { CheckList } from "@/components/shared/check-list"
import { FieldError, FormField } from "@/components/shared/form-field"
import { FormRow } from "@/components/shared/form-row"
import { NativeSelect } from "@/components/shared/native-select"
import { Notice } from "@/components/shared/notice"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { APPLY } from "@/data/apply-copy"
import { DATES, DOC_TYPES, LEVELS } from "@/data/catalog"
import type { DocTypeId, Intake } from "@/data/types"
import { fmtEuro, placesLabel } from "@/features/academies/search"
import type { EnrichedListing } from "@/features/academies/types"
import {
  POSITIONS,
  type ApplyDraft,
  type ApplyProfile,
} from "@/features/applications/apply"
import { eligibility, needsGuardian } from "@/features/applications/flow"
import type { AppStatus, Player, VaultDoc } from "@/features/applications/types"
import { inView, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

type Set = (patch: Partial<ApplyDraft>) => void
type Errors = Record<string, string>

const legend = "p-0 text-fs-14 font-semibold text-fg-1"
const fieldset = "m-0 grid min-w-0 gap-1.5 border-0 p-0"
const hint = "text-fs-13 text-fg-3"

/* Step 1: player & start date */
export function StepPlayer({
  l,
  draft,
  set,
  players,
  today,
  apps,
  errors,
}: {
  l: EnrichedListing
  draft: ApplyDraft
  set: Set
  players: Player[]
  today: string
  apps: { intakeId: string; status: AppStatus }[]
  errors: Errors
}) {
  const t = APPLY.player
  const intake = l.intakes.find((i) => i.id === draft.intakeId)
  return (
    <>
      <fieldset id="amk-a-player" tabIndex={-1} className={fieldset}>
        <legend className={legend}>{t.legend}</legend>
        <div className="grid gap-[10px]">
          {players.map((p, i) => {
            const el = eligibility(p, l, intake, today, apps)
            const on = draft.playerId === p.id
            return (
              <motion.label
                {...inView(i)}
                whileTap={{ scale: 0.99, transition: spring }}
                key={p.id}
                className={cn(
                  "relative grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-[14px] rounded-md border border-border-2 bg-surface-elevated px-4 py-[14px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-amk-accent-ink",
                  on && "border-fg-1 shadow-[inset_0_0_0_1px_var(--fg-1)]"
                )}
              >
                <input
                  type="radio"
                  name="amk-player"
                  checked={on}
                  onChange={() => set({ playerId: p.id, profile: null })}
                  className="absolute size-px opacity-0"
                />
                <AvatarInitials initials={p.initials} size={44} />
                <span className="grid gap-0.5">
                  <b>
                    {p.firstName} {p.lastName}
                  </b>
                  <small className="text-fs-13 text-fg-3">
                    {DATES.ageOn(p.dob, today)} {t.years} · {p.position} ·{" "}
                    {p.currentClub}
                  </small>
                  {el.ok ? (
                    <em className="mt-1 inline-flex items-center gap-1.5 text-fs-13 font-semibold not-italic">
                      <Icon
                        name="checkcircle"
                        size={14}
                        sw={2}
                        className="text-gf-success"
                      />
                      {t.eligible}
                    </em>
                  ) : (
                    <em className="mt-1 inline-flex items-center gap-1.5 text-fs-13 font-semibold text-fg-2 not-italic">
                      <Icon
                        name="alert"
                        size={14}
                        sw={2}
                        className="text-gf-warning"
                      />
                      {el.reasons[0]}
                    </em>
                  )}
                </span>
              </motion.label>
            )
          })}
        </div>
        <FieldError id="amk-a-player-err">{errors["amk-a-player"]}</FieldError>
        <p className={hint}>
          {t.hintA}{" "}
          <Link className="am-link" href={routes.family.players()}>
            {t.hintLink}
          </Link>{" "}
          {t.hintB}
        </p>
      </fieldset>

      <FormField
        id="amk-a-intake"
        label={t.intake}
        required
        error={errors["amk-a-intake"]}
        hint={t.intakeHint(l.ageMin, l.ageMax)}
      >
        {(a) => (
          <NativeSelect
            {...a}
            value={draft.intakeId}
            onChange={(e) => set({ intakeId: e.target.value })}
          >
            <option value="">{t.chooseIntake}</option>
            {l.intakes.map((i) => (
              <option
                key={i.id}
                value={i.id}
                disabled={!i.open || i.placesLeft === 0}
              >
                {DATES.fmt(i.start)} · {t.applyBy} {DATES.fmtShort(i.deadline)}
                {!i.open
                  ? t.closed
                  : i.placesLeft === 0
                    ? t.full
                    : ` · ${placesLabel(i.placesLeft)}`}
              </option>
            ))}
          </NativeSelect>
        )}
      </FormField>

      {l.optional.length > 0 ? (
        <fieldset className={fieldset}>
          <legend className={legend}>
            {t.optional}
            <span className="ml-1 text-fs-12 font-medium text-fg-3">
              {t.optionalTag}
            </span>
          </legend>
          <p className={hint}>{t.optionalHint}</p>
          <div className="grid overflow-hidden rounded-md border border-border-2">
            {l.optional.map((o) => {
              const on = draft.optional.includes(o.id)
              return (
                <label
                  key={o.id}
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
                      set({
                        optional: e.target.checked
                          ? draft.optional.concat(o.id)
                          : draft.optional.filter((x) => x !== o.id),
                      })
                    }
                  />
                  <span>{o.label}</span>
                  <b>
                    {fmtEuro(o.price)}{" "}
                    <small className="font-medium text-fg-3">
                      {o.per === "once" ? t.oneOff : `/ ${o.per}`}
                    </small>
                  </b>
                </label>
              )
            })}
          </div>
        </fieldset>
      ) : null}
    </>
  )
}

/* Step 2: the player's reusable profile */
export function StepProfile({
  draft,
  set,
  player,
  errors,
}: {
  draft: ApplyDraft
  set: Set
  player: Player
  errors: Errors
}) {
  const t = APPLY.profile
  const p: Partial<ApplyProfile> = draft.profile ?? {}
  const up = (k: keyof ApplyProfile) => (e: { target: { value: string } }) =>
    set({ profile: { ...(p as ApplyProfile), [k]: e.target.value } })
  return (
    <>
      <Notice tone="neutral" icon="user">
        {t.noticeA(player.firstName)}
        <b>{t.noticeB}</b>
        {t.noticeC}
      </Notice>
      <FormRow>
        <FormField
          id="amk-a-position"
          label={t.position}
          required
          error={errors["amk-a-position"]}
        >
          {(a) => (
            <NativeSelect
              {...a}
              value={p.position || ""}
              onChange={up("position")}
            >
              <option value="">{t.choosePosition}</option>
              {POSITIONS.concat(
                p.position && !POSITIONS.includes(p.position)
                  ? [p.position]
                  : []
              ).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField
          id="amk-a-foot"
          label={t.foot}
          required
          error={errors["amk-a-foot"]}
        >
          {(a) => (
            <NativeSelect {...a} value={p.foot || ""} onChange={up("foot")}>
              <option value="">{t.choose}</option>
              {t.feet.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </NativeSelect>
          )}
        </FormField>
      </FormRow>
      <FormRow>
        <FormField
          id="amk-a-club"
          label={t.club}
          required
          error={errors["amk-a-club"]}
        >
          {(a) => (
            <Input
              {...a}
              value={p.currentClub || ""}
              onChange={up("currentClub")}
              autoComplete="off"
            />
          )}
        </FormField>
        <FormField id="amk-a-level" label={t.level}>
          {(a) => (
            <NativeSelect {...a} value={p.level || ""} onChange={up("level")}>
              <option value="">{t.choose}</option>
              {LEVELS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label} — {x.blurb}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
      </FormRow>
      <FormRow>
        <FormField
          id="amk-a-height"
          label={t.height}
          error={errors["amk-a-height"]}
        >
          {(a) => (
            <Input
              {...a}
              inputMode="numeric"
              value={p.heightCm || ""}
              onChange={up("heightCm")}
            />
          )}
        </FormField>
        <FormField
          id="amk-a-video"
          label={t.video}
          error={errors["amk-a-video"]}
          hint={t.videoHint}
        >
          {(a) => (
            <Input
              {...a}
              type="url"
              value={p.video || ""}
              onChange={up("video")}
              placeholder="https://"
            />
          )}
        </FormField>
      </FormRow>
      <FormField id="amk-a-bio" label={t.bio} hint={t.bioHint}>
        {(a) => (
          <Textarea
            {...a}
            value={p.bio || ""}
            onChange={up("bio")}
            maxLength={600}
          />
        )}
      </FormField>
    </>
  )
}

/* Step 3: the academy's questions */
export function StepQuestions({
  l,
  draft,
  set,
  errors,
}: {
  l: EnrichedListing
  draft: ApplyDraft
  set: Set
  errors: Errors
}) {
  const ans = draft.answers
  const up = (id: string) => (e: { target: { value: string } }) =>
    set({ answers: { ...ans, [id]: e.target.value } })
  return (
    <>
      <p className="text-fs-16 leading-lh-relaxed text-fg-2">
        {APPLY.questions.intro(l.academy.name)}
      </p>
      {l.questions.map((q) => (
        <FormField
          key={q.id}
          id={`amk-q-${q.id}`}
          label={q.label}
          required={q.required}
          error={errors[`amk-q-${q.id}`]}
        >
          {(a) =>
            q.type === "select" ? (
              <NativeSelect {...a} value={ans[q.id] || ""} onChange={up(q.id)}>
                <option value="">{APPLY.questions.chooseAnswer}</option>
                {(q.options ?? []).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </NativeSelect>
            ) : q.type === "textarea" ? (
              <Textarea
                {...a}
                value={ans[q.id] || ""}
                onChange={up(q.id)}
                maxLength={1000}
              />
            ) : (
              <Input {...a} value={ans[q.id] || ""} onChange={up(q.id)} />
            )
          }
        </FormField>
      ))}
    </>
  )
}

/* Step 4: documents, from the vault or uploaded now */
export function StepDocs({
  l,
  draft,
  set,
  playerName,
  vault,
  onUpload,
  errors,
}: {
  l: EnrichedListing
  draft: ApplyDraft
  set: Set
  playerName: string
  vault: VaultDoc[]
  onUpload: (type: DocTypeId, file: File) => VaultDoc
  errors: Errors
}) {
  const t = APPLY.docs
  const docs = draft.docs
  return (
    <>
      <p className="text-fs-16 leading-lh-relaxed text-fg-2">
        {t.intro(playerName)}
      </p>
      <ul className="grid gap-[10px]">
        {l.documents.map((type, i) => {
          const meta = DOC_TYPES[type]
          const onFile = vault.find((d) => d.type === type)
          const chosen = docs[type]
          const err = errors[`amk-d-${type}`]
          return (
            <motion.li
              {...inView(i)}
              key={type}
              id={`amk-d-${type}`}
              tabIndex={-1}
              className={cn(
                "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[14px] rounded-md border border-border-2 bg-surface-elevated px-4 py-[14px] le-720:grid-cols-[auto_minmax(0,1fr)]",
                chosen && "border-border-3",
                err && "border-gf-danger"
              )}
            >
              <motion.span
                key={chosen ? "ok" : "doc"}
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                transition={spring}
                aria-hidden="true"
                className={cn(
                  "grid size-[42px] place-items-center rounded-[10px] bg-bg-3 text-fg-2",
                  chosen && "bg-gf-neon text-text-on-neon"
                )}
              >
                <Icon name={chosen ? "checkcircle" : "doc"} size={22} />
              </motion.span>
              <span className="grid min-w-0 gap-0.5">
                <b>{meta.label}</b>
                <small className="text-fs-13 [overflow-wrap:anywhere] text-fg-3">
                  {chosen
                    ? chosen.name +
                      (chosen.fromVault ? t.fromVault : t.addedNow)
                    : meta.hint}
                </small>
                {err ? <FieldError>{err}</FieldError> : null}
              </span>
              <span className="flex flex-wrap justify-end gap-1.5 le-720:col-[1/-1] le-720:justify-start">
                {!chosen && onFile ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      set({
                        docs: {
                          ...docs,
                          [type]: {
                            id: onFile.id,
                            name: onFile.name,
                            fromVault: true,
                          },
                        },
                      })
                    }
                  >
                    {t.use(onFile.name)}
                  </Button>
                ) : null}
                <input
                  type="file"
                  id={`amk-f-${type}`}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="peer am-sr"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      const doc = onUpload(type, f)
                      set({
                        docs: {
                          ...docs,
                          [type]: {
                            id: doc.id,
                            name: doc.name,
                            fromVault: false,
                          },
                        },
                      })
                    }
                  }}
                />
                <label
                  htmlFor={`amk-f-${type}`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amk-accent-ink"
                  )}
                >
                  <Icon name="upload" size={15} />
                  {chosen ? t.replace : t.upload}
                </label>
              </span>
            </motion.li>
          )
        })}
      </ul>
    </>
  )
}

/* One reviewed section with an Edit button (.amk-review-block) */
function Review({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <section className="grid gap-3 rounded-md border border-border-1 bg-bg-2 p-[18px]">
      <div className="flex items-center justify-between gap-3">
        <h3 className={h4}>{title}</h3>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Icon name="edit" size={15} /> {APPLY.review.edit}
        </Button>
      </div>
      {children}
    </section>
  )
}

/* Step 5: review & submit */
export function StepReview({
  l,
  draft,
  set,
  player,
  intake,
  today,
  goTo,
  errors,
}: {
  l: EnrichedListing
  draft: ApplyDraft
  set: Set
  player: Player
  intake: Intake
  today: string
  goTo: (step: number) => void
  errors: Errors
}) {
  const t = APPLY.review
  const p: Partial<ApplyProfile> = draft.profile ?? {}
  const minor = needsGuardian(player.dob, today)
  return (
    <>
      <Review title={t.player} onEdit={() => goTo(0)}>
        <DefList
          rows={[
            [
              t.playerLabel,
              `${player.firstName} ${player.lastName}, ${DATES.ageOn(player.dob, intake.start)} ${t.onStart}`,
            ],
            [t.startDate, DATES.fmt(intake.start)],
            [
              t.optional,
              draft.optional.length
                ? l.optional
                    .filter((o) => draft.optional.includes(o.id))
                    .map((o) => o.label)
                    .join(", ")
                : t.none,
            ],
          ]}
        />
      </Review>
      <Review title={t.profile} onEdit={() => goTo(1)}>
        <DefList
          rows={[
            [t.position, p.position ?? ""],
            [t.foot, p.foot ?? ""],
            [t.club, p.currentClub ?? ""],
            [t.video, p.video ? t.linkAdded : t.notAdded],
          ]}
        />
      </Review>
      <Review title={t.questions} onEdit={() => goTo(2)}>
        <dl className="grid gap-3">
          {l.questions.map((q) => (
            <div key={q.id}>
              <dt className="text-fs-13 text-fg-3">{q.label}</dt>
              <dd className="text-fs-14 text-fg-1">
                {draft.answers[q.id] || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </Review>
      <Review title={t.documents} onEdit={() => goTo(3)}>
        <CheckList
          items={l.documents.map((type) => ({
            text: `${DOC_TYPES[type].label} — ${draft.docs[type]?.name ?? t.missing}`,
          }))}
        />
      </Review>
      <div className="grid gap-1.5">
        <CheckField
          id="amk-a-accurate"
          checked={Boolean(draft.accurate)}
          onChange={(e) => set({ accurate: e.target.checked })}
        >
          {t.accurate}
        </CheckField>
        <FieldError>{errors["amk-a-accurate"]}</FieldError>
      </div>
      {minor ? (
        <div className="grid gap-1.5">
          <CheckField
            id="amk-a-guardian"
            checked={Boolean(draft.guardian)}
            onChange={(e) => set({ guardian: e.target.checked })}
          >
            {t.guardian(player.firstName)}
          </CheckField>
          <FieldError>{errors["amk-a-guardian"]}</FieldError>
        </div>
      ) : null}
      <Notice tone="neutral" icon="info">
        {t.freeA}
        {t.freeB(l.academy.name)}
        <b>{t.freeC}</b>
      </Notice>
    </>
  )
}
