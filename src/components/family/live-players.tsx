"use client"

import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"

import { ListEditor } from "@/components/club/listing-wizard/list-editor"
import { Icon } from "@/components/icons/icon"
import { PageHeading } from "@/components/layout/page-heading"
import { AvatarInitials } from "@/components/shared/avatar-initials"
import { CardBlock } from "@/components/shared/card-block"
import { ChoiceGroup } from "@/components/shared/choice-group"
import { DateOfBirthPicker } from "@/components/shared/date-of-birth-picker"
import { DocItem, DocList } from "@/components/shared/doc-list"
import { EmptyState } from "@/components/shared/empty-state"
import {
  ErrorSummary,
  type ErrorSummaryHandle,
} from "@/components/shared/error-summary"
import { FieldError, FormField } from "@/components/shared/form-field"
import { FormRow } from "@/components/shared/form-row"
import { Meter } from "@/components/shared/meter"
import { Modal } from "@/components/shared/modal"
import { NativeSelect } from "@/components/shared/native-select"
import { Notice } from "@/components/shared/notice"
import { notify, notifyError } from "@/components/shared/notify"
import { Grid2, Stack } from "@/components/shared/page-grid"
import { ProfileHero } from "@/components/shared/profile-hero"
import { QueryState } from "@/components/shared/query-state"
import { SafeImage } from "@/components/shared/safe-image"
import { SectionHead } from "@/components/shared/section-head"
import { SegmentedControl } from "@/components/shared/segmented-control"
import { SpecCells } from "@/components/shared/spec-cells"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DATES, LEVELS } from "@/data/catalog"
import { FAMILY } from "@/data/family-copy"
import { LIVE } from "@/data/live-copy"
import { valueLabel } from "@/features/academies/card-view"
import type { ApiCountry } from "@/features/auth/api"
import { useCountries } from "@/features/auth/hooks"
import {
  createPlayer,
  deletePlayer,
  downloadPrivateFile,
  updatePlayer,
  type ApiMeOptions,
  type ApiPlayer,
} from "@/features/family/api"
import { useLivePlayers } from "@/features/family/hooks"
import {
  ageOn,
  completePercent,
  emptyPlayer,
  PLAYER_FILES,
  PLAYER_ID,
  playerDraftFrom,
  playerFieldMap,
  playerForm,
  validatePlayer,
  type PlayerDraft,
} from "@/features/family/player-form"
import { familyKeys } from "@/features/family/query-keys"
import { getApiFieldErrors } from "@/lib/api/errors"
import { todayISO } from "@/lib/date"
import { press } from "@/lib/motion"
import { routes } from "@/routes"

/*
 * Player profiles in api mode (week 2 part 1, section 3): GET /academy/me/options,
 * GET/POST/DELETE /academy/me/players[/{id}], private files downloaded with the
 * token. Same page pieces as the prototype (account/players.html).
 */

const t = FAMILY.players
const L = LIVE.players
const f = L.fields

/** "male" -> "Male", "elite" -> the prototype's "Elite" where it matches */
function nice(
  v: string | null,
  known: readonly { id: string; label: string }[] = []
) {
  return v ? valueLabel(known, v) : ""
}

function countryName(countries: ApiCountry[] | undefined, code: string | null) {
  if (!code) return ""
  return countries?.find((c) => c.code === code)?.name ?? code
}

export function LivePlayersClient({ id }: { id: string }) {
  const query = useLivePlayers()
  const countries = useCountries()
  const [sel, setSel] = useState(id)
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null)

  const players = query.data?.players ?? []
  const selected =
    players.find((p) => String(p.id) === sel) ?? players[0] ?? null

  useEffect(() => {
    if (selected)
      window.history.replaceState(
        null,
        "",
        routes.family.players(String(selected.id))
      )
  }, [selected])

  return (
    <>
      <PageHeading
        title={t.title}
        subtitle={t.subtitle}
        actions={
          query.data ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDialog("create")}
              >
                <Icon name="plus" size={16} />
                <span className="le-600:hidden">{L.add}</span>
              </Button>
              {selected ? (
                <Button size="sm" onClick={() => setDialog("edit")}>
                  <Icon name="edit" size={16} />
                  <span className="le-600:hidden">{L.edit}</span>
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />
      <QueryState
        query={query}
        errorFallback={LIVE.requestFailed}
        skeleton={
          <div className="h-[420px] animate-pulse rounded-lg bg-bg-2" />
        }
        isEmpty={(d) => d.players.length === 0}
        empty={
          <EmptyState
            icon="user"
            title={L.emptyTitle}
            text={L.emptyText}
            cta={<Button onClick={() => setDialog("create")}>{L.add}</Button>}
          />
        }
      >
        {(d) =>
          selected ? (
            <>
              <SegmentedControl
                label={t.tabs}
                value={String(selected.id)}
                onChange={setSel}
                tabs={d.players.map((p) => ({
                  value: String(p.id),
                  label: `${p.first_name} ${p.last_name}`,
                  count: p.date_of_birth
                    ? ageOn(p.date_of_birth, todayISO())
                    : undefined,
                }))}
              />
              <PlayerProfile
                p={selected}
                options={d.options}
                countries={countries}
              />
            </>
          ) : null
        }
      </QueryState>
      {query.data && dialog ? (
        <PlayerDialog
          key={dialog === "edit" && selected ? selected.id : "new"}
          player={dialog === "edit" ? selected : null}
          options={query.data.options}
          hasSelf={players.some((p) => p.owner_relationship === "self")}
          countries={countries ?? []}
          onClose={() => setDialog(null)}
          onSaved={(p) => {
            setSel(String(p.id))
            setDialog(null)
          }}
          onDeleted={() => {
            setSel("")
            setDialog(null)
          }}
        />
      ) : null}
    </>
  )
}

function PlayerProfile({
  p,
  options,
  countries,
}: {
  p: ApiPlayer
  options: ApiMeOptions
  countries: ApiCountry[] | undefined
}) {
  const age = p.date_of_birth ? ageOn(p.date_of_birth, todayISO()) : null
  const initials = (p.first_name[0] ?? "") + (p.last_name[0] ?? "")
  const level = nice(p.current_level, LEVELS)
  const positions = [p.primary_position, p.secondary_position]
    .filter((x): x is string => Boolean(x))
    .map((x) => nice(x))
  const lives = [p.city, countryName(countries, p.country_of_residence)]
    .filter(Boolean)
    .join(", ")
  const videos = [p.highlight_video_url, ...p.video_links].filter(
    (v): v is string => Boolean(v)
  )
  const cells = [
    {
      label: t.cells.dob,
      value: p.date_of_birth ? DATES.fmt(p.date_of_birth) : "",
    },
    {
      label: t.cells.nationality,
      value: countryName(countries, p.nationality),
    },
    { label: t.cells.lives, value: lives },
    { label: t.cells.positions, value: positions.join(", ") },
    { label: t.cells.foot, value: nice(p.preferred_foot) },
    { label: f.height_cm, value: p.height_cm ? `${p.height_cm} cm` : "" },
    { label: t.cells.level, value: level },
    { label: t.cells.club, value: p.current_club_academy ?? "" },
  ].filter((c) => c.value)

  return (
    <>
      <ProfileHero
        id="h-player"
        age={age}
        avatar={
          p.profile_photo_url ? (
            <span className="relative block size-20 overflow-hidden rounded-full bg-bg-3">
              <SafeImage
                src={p.profile_photo_url}
                alt=""
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
            </span>
          ) : (
            <AvatarInitials initials={initials.toUpperCase()} size={80} />
          )
        }
        meta={[
          positions[0],
          p.preferred_foot ? `${nice(p.preferred_foot)} ${t.foot}` : "",
          level,
        ]
          .filter(Boolean)
          .join(" · ")}
        name={`${p.first_name} ${p.last_name}`}
        line={[
          age !== null ? `${age} ${t.years}` : "",
          countryName(countries, p.nationality),
          p.current_club_academy ?? "",
        ]
          .filter(Boolean)
          .join(" · ")}
        side={<Meter value={completePercent(p, options)} label={t.complete} />}
      />
      {p.owner_relationship === "self" &&
      (!p.date_of_birth ||
        ageOn(p.date_of_birth, todayISO()) < options.consent_age) ? (
        <Notice tone="neutral" icon="info">
          {L.minorSelf}
        </Notice>
      ) : null}
      {p.is_complete ? (
        <Notice tone="success" icon="checkcircle">
          {L.readyNote}
        </Notice>
      ) : (
        <Notice tone="warning" icon="alert">
          <b>{L.neededLead}</b>{" "}
          {p.missing_fields.map((m) => m.label).join(", ")}
        </Notice>
      )}
      <Grid2>
        <Stack>
          <CardBlock aria-labelledby="h-foot">
            <SectionHead id="h-foot" title={t.football} />
            {cells.length ? <SpecCells items={cells} /> : null}
          </CardBlock>
          <CardBlock aria-labelledby="h-cv">
            <SectionHead id="h-cv" title={f.previous_clubs} />
            {p.previous_clubs.length ? (
              <ul className="grid gap-1.5 text-fs-14 text-fg-2">
                {p.previous_clubs.map((c) => (
                  <li key={c} className="flex items-center gap-2">
                    <Icon name="shield" size={15} /> {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-fs-14 text-fg-3">{L.noClubs}</p>
            )}
          </CardBlock>
        </Stack>
        <Stack>
          <CardBlock aria-labelledby="h-videos">
            <SectionHead id="h-videos" title={t.videos} />
            {videos.length ? (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-[10px]">
                {videos.map((v) => (
                  <li key={v}>
                    <motion.a
                      {...press}
                      href={v}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-sm border border-border-1 p-3"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-11 place-items-center rounded-[10px] bg-fg-1 text-bg-0"
                      >
                        <Icon name="video" size={20} />
                      </span>
                      <span className="grid min-w-0">
                        <b className="truncate">
                          {v.replace(/^https?:\/\//, "")}
                        </b>
                        <small className="text-fs-12 text-fg-3">
                          {t.videoLink}
                        </small>
                      </span>
                    </motion.a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-fs-14 text-fg-3">{L.noVideos}</p>
            )}
          </CardBlock>
          <CardBlock aria-labelledby="h-vault">
            <SectionHead id="h-vault" title={t.vault} sub={t.vaultSub} />
            <DocList>
              {PLAYER_FILES.map((field) => {
                const file = p.files[field]
                return (
                  <DocItem
                    key={field}
                    icon="doc"
                    title={f[field]}
                    sub={file.uploaded ? L.uploaded : L.notUploaded}
                    trailing={
                      file.uploaded && file.download_url ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            downloadPrivateFile(
                              file.download_url as string,
                              `${p.first_name}-${field}`
                            ).catch(() => undefined)
                          }
                        >
                          <Icon name="download" size={15} /> {L.download}
                        </Button>
                      ) : undefined
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
                  label: f.emergency_contact_name,
                  value: p.emergency_contact_name ?? "",
                },
                {
                  label: f.emergency_contact_relationship,
                  value: p.emergency_contact_relationship ?? "",
                },
                {
                  label: f.emergency_contact_phone,
                  value: p.emergency_contact_phone ?? "",
                },
                { label: f.guardian_name, value: p.guardian_name ?? "" },
                { label: f.guardian_phone, value: p.guardian_phone ?? "" },
              ].filter((c) => c.value)}
            />
          </CardBlock>
        </Stack>
      </Grid2>
    </>
  )
}

/* Create / edit a profile: every field of the contract, grouped; only names are required to save */
export function PlayerDialog({
  player,
  options,
  hasSelf,
  countries,
  onClose,
  onSaved,
  onDeleted,
}: {
  player: ApiPlayer | null
  options: ApiMeOptions
  hasSelf: boolean
  countries: ApiCountry[]
  onClose: () => void
  onSaved: (p: ApiPlayer) => void
  onDeleted: () => void
}) {
  const queryClient = useQueryClient()
  const [d, setD] = useState<PlayerDraft>(() =>
    player ? playerDraftFrom(player) : emptyPlayer()
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const sumRef = useRef<ErrorSummaryHandle>(null)
  const set = (patch: Partial<PlayerDraft>) => setD((x) => ({ ...x, ...patch }))
  const required = useMemo(() => new Set(options.required_fields), [options])
  const labels = useMemo(() => {
    const m: Record<string, string> = {}
    for (const [k, v] of Object.entries(f))
      if (typeof v === "string") m[PLAYER_ID(k)] = v
    return m
  }, [])
  const show = (e: Record<string, string>) => {
    setErrors(e)
    if (Object.keys(e).length)
      requestAnimationFrame(() => sumRef.current?.focus())
  }

  const save = async () => {
    const found = validatePlayer(d)
    show(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const body = playerForm(d)
      const saved =
        d.id === null
          ? await createPlayer(body)
          : await updatePlayer(d.id, body)
      await queryClient.invalidateQueries({ queryKey: familyKeys.players() })
      notify(d.id === null ? L.created : L.saved)
      onSaved(saved)
    } catch (e) {
      const { byControl } = getApiFieldErrors(e, playerFieldMap())
      if (Object.keys(byControl).length) show(byControl)
      // other refusals (self_profile_exists, …) are shown by the error toast
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (d.id === null) return
    setBusy(true)
    try {
      await deletePlayer(d.id)
      await queryClient.invalidateQueries({ queryKey: familyKeys.players() })
      notify(L.deleted)
      onDeleted()
    } catch {
      // player_in_use: the backend's message is shown as the error toast
      setConfirmDelete(false)
    } finally {
      setBusy(false)
    }
  }

  const text = (
    key: keyof PlayerDraft & string,
    type = "text",
    auto?: string
  ) => (
    <FormField
      id={PLAYER_ID(key)}
      label={labels[PLAYER_ID(key)]}
      required={required.has(key)}
      error={errors[PLAYER_ID(key)]}
    >
      {(p) => (
        <Input
          {...p}
          type={type}
          autoComplete={auto}
          value={String(d[key] ?? "")}
          onChange={(e) => set({ [key]: e.target.value })}
        />
      )}
    </FormField>
  )
  const select = (
    key: keyof PlayerDraft & string,
    values: string[],
    known: readonly { id: string; label: string }[] = []
  ) => (
    <FormField
      id={PLAYER_ID(key)}
      label={labels[PLAYER_ID(key)]}
      required={required.has(key)}
      error={errors[PLAYER_ID(key)]}
    >
      {(p) => (
        <NativeSelect
          {...p}
          value={String(d[key] ?? "")}
          onChange={(e) => set({ [key]: e.target.value })}
        >
          <option value="">—</option>
          {values.map((v) => (
            <option key={v} value={v}>
              {valueLabel(known, v)}
            </option>
          ))}
        </NativeSelect>
      )}
    </FormField>
  )
  const country = (key: "nationality" | "country_of_residence") => (
    <FormField
      id={PLAYER_ID(key)}
      label={labels[PLAYER_ID(key)]}
      required={required.has(key)}
      error={errors[PLAYER_ID(key)]}
    >
      {(p) => (
        <NativeSelect
          {...p}
          value={d[key]}
          onChange={(e) => set({ [key]: e.target.value })}
        >
          <option value="">—</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      )}
    </FormField>
  )
  const filePick = (field: (typeof PLAYER_FILES)[number] | "profile_photo") => {
    const isPhoto = field === "profile_photo"
    const stored = isPhoto
      ? Boolean(player?.profile_photo_url)
      : Boolean(player?.files[field].uploaded)
    const picked = isPhoto ? d.photo : d.files[field]
    const removed = !isPhoto && d.removeFiles.includes(field)
    return (
      <div className="grid gap-1.5">
        <p className="text-fs-14 font-semibold text-fg-1">
          {labels[PLAYER_ID(field)]}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-fs-13 text-fg-3">
          <span>
            {picked
              ? picked.name
              : stored && !removed
                ? f[field]
                : L.notUploaded}
          </span>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-border-2 px-3 py-1.5 text-fs-13 font-semibold text-fg-1 focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-amk-accent-ink hover:bg-tint-neon-1">
            <Icon name="upload" size={14} />{" "}
            {stored || picked ? L.replace : L.upload}
            <input
              id={PLAYER_ID(field)}
              type="file"
              className="am-sr"
              accept={
                isPhoto
                  ? "image/jpeg,image/png,image/webp"
                  : "application/pdf,image/jpeg,image/png"
              }
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                const allowed = isPhoto
                  ? ["image/jpeg", "image/png", "image/webp"]
                  : ["application/pdf", "image/jpeg", "image/png"]
                if (file && !allowed.includes(file.type)) {
                  notifyError(LIVE.players.fileType(isPhoto))
                  e.target.value = ""
                  return
                }
                if (isPhoto) set({ photo: file })
                else if (file)
                  set({
                    files: { ...d.files, [field]: file },
                    removeFiles: d.removeFiles.filter((x) => x !== field),
                  })
                e.target.value = ""
              }}
            />
          </label>
          {!isPhoto && stored && !removed && !picked ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => set({ removeFiles: d.removeFiles.concat(field) })}
            >
              {L.removeFile}
            </Button>
          ) : null}
        </div>
        <FieldError>{errors[PLAYER_ID(field)]}</FieldError>
      </div>
    )
  }
  const head = "font-display text-fs-16 font-bold text-fg-1"
  // week 2 part 2, section 10: a self profile under consent_age (or without a
  // date of birth) cannot hold documents (422 guardian_required)
  const minorSelf =
    d.owner_relationship === "self" &&
    (!d.date_of_birth ||
      ageOn(d.date_of_birth, todayISO()) < options.consent_age)

  return (
    <Modal
      open
      onClose={onClose}
      title={d.id === null ? L.createTitle : L.editTitle}
      footer={
        <div className="flex w-full flex-wrap justify-between gap-2">
          {d.id !== null ? (
            confirmDelete ? (
              <Button variant="danger" disabled={busy} onClick={() => remove()}>
                {L.removeConfirm}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                <Icon name="trash" size={15} /> {L.remove}
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              {L.cancel}
            </Button>
            <Button
              onClick={() => save()}
              disabled={busy}
              aria-busy={busy}
              data-autofocus
            >
              {L.save}
            </Button>
          </div>
        </div>
      }
    >
      <form
        noValidate
        className="grid gap-[16px]"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        {confirmDelete ? (
          <Notice tone="warning" icon="alert">
            <b>{L.removeTitle}</b> {L.removeText}
          </Notice>
        ) : null}
        <ErrorSummary errors={errors} labels={labels} ref={sumRef} />
        <h3 className={head}>{L.sections.who}</h3>
        <ChoiceGroup<string>
          id={PLAYER_ID("owner_relationship")}
          name="owner_relationship"
          legend={L.who.question}
          value={d.owner_relationship}
          onChange={(owner_relationship) => set({ owner_relationship })}
          error={errors[PLAYER_ID("owner_relationship")]}
          options={options.relationships
            // one "self" profile per account (self_profile_exists)
            .filter(
              (r) =>
                r !== "self" ||
                !hasSelf ||
                player?.owner_relationship === "self"
            )
            .map((r) => ({
              value: r,
              label:
                L.who.options[r as keyof typeof L.who.options] ??
                valueLabel([], r),
            }))}
        />
        {hasSelf && player?.owner_relationship !== "self" ? (
          <p className="text-fs-13 text-fg-3">{L.who.selfExists}</p>
        ) : null}
        <FormRow>
          {text("first_name", "text", "given-name")}
          {text("last_name", "text", "family-name")}
        </FormRow>
        <FormRow>
          <FormField
            id={PLAYER_ID("date_of_birth")}
            label={f.date_of_birth}
            required={required.has("date_of_birth")}
            error={errors[PLAYER_ID("date_of_birth")]}
          >
            {(p) => (
              <DateOfBirthPicker
                id={p.id}
                aria-describedby={p["aria-describedby"]}
                aria-invalid={p["aria-invalid"]}
                value={d.date_of_birth}
                max={todayISO()}
                onChange={(v) => set({ date_of_birth: v })}
              />
            )}
          </FormField>
          {select("gender", options.genders)}
        </FormRow>
        <FormRow>
          {country("nationality")}
          {country("country_of_residence")}
        </FormRow>
        {text("city")}
        <h3 className={head}>{L.sections.football}</h3>
        <FormRow>
          {select("primary_position", options.positions)}
          {select("secondary_position", options.positions)}
        </FormRow>
        <FormRow>
          {select("preferred_foot", options.preferred_feet)}
          {text("height_cm", "number")}
        </FormRow>
        <FormRow>
          {text("current_club_academy")}
          {select("current_level", options.playing_levels, LEVELS)}
        </FormRow>
        <div className="grid gap-1.5">
          <p className="text-fs-14 font-semibold text-fg-1">
            {f.previous_clubs}
          </p>
          <ListEditor
            id={PLAYER_ID("previous_clubs")}
            items={d.previous_clubs}
            onChange={(previous_clubs) => set({ previous_clubs })}
            placeholder={f.previous_club}
            addLabel={f.add_club}
          />
        </div>
        {text("highlight_video_url", "url")}
        <div className="grid gap-1.5">
          <p className="text-fs-14 font-semibold text-fg-1">{f.video_links}</p>
          <ListEditor
            id={PLAYER_ID("video_links")}
            items={d.video_links}
            onChange={(video_links) => set({ video_links })}
            placeholder={f.video_link}
            addLabel={f.add_video}
          />
          <FieldError>{errors[PLAYER_ID("video_links")]}</FieldError>
        </div>
        <h3 className={head}>{L.sections.contact}</h3>
        <FormRow>
          {text("email", "email", "email")}
          {text("phone", "tel", "tel")}
        </FormRow>
        {text("passport_number")}
        {filePick("profile_photo")}
        {minorSelf ? (
          <Notice tone="neutral" icon="info">
            {L.minorDocs}
          </Notice>
        ) : (
          PLAYER_FILES.map((field) => <div key={field}>{filePick(field)}</div>)
        )}
        <h3 className={head}>{L.sections.emergency}</h3>
        <FormRow>
          {text("emergency_contact_name")}
          {text("emergency_contact_relationship")}
        </FormRow>
        <FormRow>
          {text("emergency_contact_phone", "tel")}
          {text("emergency_contact_email", "email")}
        </FormRow>
        <FormRow>
          {text("guardian_name")}
          {text("guardian_phone", "tel")}
        </FormRow>
      </form>
    </Modal>
  )
}
