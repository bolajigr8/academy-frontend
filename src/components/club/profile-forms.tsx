"use client"

import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { useRef, useState } from "react"

import { ListEditor } from "@/components/club/listing-wizard/list-editor"
import { Icon } from "@/components/icons/icon"
import { CardBlock } from "@/components/shared/card-block"
import { ChoiceGroup } from "@/components/shared/choice-group"
import {
  ErrorSummary,
  type ErrorSummaryHandle,
} from "@/components/shared/error-summary"
import { FieldError, FormField } from "@/components/shared/form-field"
import { FormRow } from "@/components/shared/form-row"
import { NativeSelect } from "@/components/shared/native-select"
import { notify } from "@/components/shared/notify"
import { SafeImage } from "@/components/shared/safe-image"
import { SectionHead } from "@/components/shared/section-head"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LIVE } from "@/data/live-copy"
import type { ApiCountry } from "@/features/auth/api"
import {
  createAcademy,
  updateAcademy,
  updateOrganization,
  type ApiAcademy,
  type ApiOrganization,
} from "@/features/club/api"
import { pickImages } from "@/components/shared/pick-images"
import { IMAGE_TYPES } from "@/features/club/live-draft"
import {
  academyDraftFrom,
  academyForms,
  ACADEMY_FIELDS,
  ACADEMY_IDS,
  emptyAcademy,
  orgChanges,
  orgDraftFrom,
  ORG_FIELDS,
  ORG_IDS,
  validateAcademy,
  validateOrg,
  type AcademyDraft,
  type OrgDraft,
  type PickedFile,
} from "@/features/club/profile-form"
import { clubKeys } from "@/features/club/query-keys"
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api/errors"
import { pressIcon } from "@/lib/motion"

/*
 * Organization and academy forms (api mode; contract sections 3 and 4).
 * The prototype has no design for these; they use its form pieces and cards.
 */

const t = LIVE.profileForm
const f = t.fields

/** 422: field messages on their controls; a message without fields on the first control */
function errorsFrom(
  error: unknown,
  fields: Record<string, string>,
  firstId: string
): Record<string, string> {
  const { byControl, unmatched } = getApiFieldErrors(error, fields)
  if (Object.keys(byControl).length > 0) return byControl
  return {
    [firstId]: unmatched[0] ?? getApiErrorMessage(error, LIVE.requestFailed),
  }
}

function CountrySelect({
  id,
  value,
  countries,
  error,
  onChange,
}: {
  id: string
  value: string
  countries: ApiCountry[]
  error?: string
  onChange: (code: string) => void
}) {
  return (
    <FormField id={id} label={f.country} required error={error}>
      {(p) => (
        <NativeSelect
          {...p}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{t.errors.country}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      )}
    </FormField>
  )
}

/* ---------------- organization ---------------- */

export function OrganizationForm({
  org,
  countries,
}: {
  org: ApiOrganization
  countries: ApiCountry[]
}) {
  const queryClient = useQueryClient()
  const [d, setD] = useState<OrgDraft>(() => orgDraftFrom(org))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const sumRef = useRef<ErrorSummaryHandle>(null)
  const set = (patch: Partial<OrgDraft>) => setD((x) => ({ ...x, ...patch }))
  const show = (e: Record<string, string>) => {
    setErrors(e)
    if (Object.keys(e).length)
      requestAnimationFrame(() => sumRef.current?.focus())
  }

  const save = async () => {
    const found = validateOrg(d)
    show(found)
    if (Object.keys(found).length) return
    const body = orgChanges(org, d)
    if (Object.keys(body).length === 0) {
      notify(t.nothingChanged)
      return
    }
    setBusy(true)
    try {
      const saved = await updateOrganization(body)
      queryClient.setQueryData(clubKeys.organization(), saved)
      setD(orgDraftFrom(saved))
      notify(t.saved)
    } catch (e) {
      show(errorsFrom(e, ORG_FIELDS, ORG_IDS.name))
    } finally {
      setBusy(false)
    }
  }

  const text = (
    id: string,
    label: string,
    key: keyof Omit<OrgDraft, "type">,
    opts: {
      required?: boolean
      hint?: string
      type?: string
      auto?: string
    } = {}
  ) => (
    <FormField
      id={id}
      label={label}
      required={opts.required}
      hint={opts.hint}
      error={errors[id]}
    >
      {(p) => (
        <Input
          {...p}
          type={opts.type ?? "text"}
          autoComplete={opts.auto}
          value={d[key]}
          maxLength={255}
          onChange={(e) => set({ [key]: e.target.value })}
        />
      )}
    </FormField>
  )

  return (
    <CardBlock aria-labelledby="h-org">
      <SectionHead id="h-org" title={t.organization} sub={t.organizationSub} />
      <form
        noValidate
        className="grid gap-[18px]"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <ErrorSummary
          errors={errors}
          labels={{
            [ORG_IDS.name]: f.orgName,
            [ORG_IDS.legalName]: f.legalName,
            [ORG_IDS.type]: f.type,
            [ORG_IDS.country]: f.country,
            [ORG_IDS.registration]: f.registration,
            [ORG_IDS.website]: f.website,
            [ORG_IDS.email]: f.contactEmail,
            [ORG_IDS.phone]: f.contactPhone,
          }}
          ref={sumRef}
        />
        <FormRow>
          {text(ORG_IDS.name, f.orgName, "name", {
            required: true,
            auto: "organization",
          })}
          {text(ORG_IDS.legalName, f.legalName, "legalName")}
        </FormRow>
        <ChoiceGroup<OrgDraft["type"]>
          id={ORG_IDS.type}
          name="organizationType"
          legend={f.type}
          value={d.type}
          onChange={(type) => set({ type })}
          error={errors[ORG_IDS.type]}
          options={[
            { value: "club", label: LIVE.organizationType.club },
            {
              value: "independent_academy",
              label: LIVE.organizationType.independent_academy,
            },
          ]}
        />
        <FormRow>
          <CountrySelect
            id={ORG_IDS.country}
            value={d.countryCode}
            countries={countries}
            error={errors[ORG_IDS.country]}
            onChange={(countryCode) => set({ countryCode })}
          />
          {text(ORG_IDS.registration, f.registration, "registrationNumber")}
        </FormRow>
        {text(ORG_IDS.website, f.website, "website", {
          hint: f.websiteHint,
          type: "url",
          auto: "url",
        })}
        <FormRow>
          {text(ORG_IDS.email, f.contactEmail, "contactEmail", {
            type: "email",
            auto: "email",
          })}
          {text(ORG_IDS.phone, f.contactPhone, "contactPhone", {
            type: "tel",
            auto: "tel",
          })}
        </FormRow>
        <div className="flex justify-end border-t border-border-1 pt-4">
          <Button type="submit" disabled={busy} aria-busy={busy}>
            {t.save}
          </Button>
        </div>
      </form>
    </CardBlock>
  )
}

/* ---------------- file pickers ---------------- */

/** JPEG, PNG and WebP up to 600 KB (lib/images.ts); refused files are named in a toast */
const pick = (files: FileList | null): PickedFile[] =>
  pickImages(files).map((file) => ({ file, url: URL.createObjectURL(file) }))

/** One image (logo or cover): preview + a native file input behind a button-like label */
function SingleImageField({
  id,
  label,
  src,
  wide = false,
  error,
  onPick,
}: {
  id: string
  label: string
  src: string | null
  wide?: boolean
  error?: string
  onPick: (file: PickedFile) => void
}) {
  return (
    <div className="grid gap-1.5">
      <p className="text-fs-14 font-semibold text-fg-1">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={
            wide
              ? "relative aspect-[16/5] w-[min(100%,360px)] overflow-hidden rounded-md border border-border-1 bg-bg-3"
              : "relative size-[72px] overflow-hidden rounded-md border border-border-1 bg-bg-3"
          }
        >
          {src ? (
            <SafeImage
              src={src}
              alt=""
              fill
              unoptimized
              sizes={wide ? "360px" : "72px"}
              className={wide ? "object-cover" : "object-contain"}
            />
          ) : null}
        </span>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-border-2 px-4 py-2 text-fs-14 font-semibold text-fg-1 focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-amk-accent-ink hover:bg-tint-neon-1">
          <Icon name="upload" size={15} /> {src ? f.replace : f.choose}
          <input
            id={id}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            className="am-sr"
            onChange={(e) => {
              const [first] = pick(e.target.files)
              if (first) onPick(first)
              e.target.value = ""
            }}
          />
        </label>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}

function GalleryField({
  d,
  set,
  error,
}: {
  d: AcademyDraft
  set: (patch: Partial<AcademyDraft>) => void
  error?: string
}) {
  const remove = (k: number) => {
    const g = d.gallery[k]
    if (g.kind === "new") URL.revokeObjectURL(g.url)
    set({
      gallery: d.gallery.filter((_, j) => j !== k),
      removedImageIds:
        g.kind === "saved"
          ? d.removedImageIds.concat(g.image.id)
          : d.removedImageIds,
    })
  }
  return (
    <div className="grid gap-1.5">
      <p className="text-fs-14 font-semibold text-fg-1">{f.gallery}</p>
      <p className="text-fs-13 text-fg-3">
        {f.galleryHint} {LIVE.editor.imageLimitHint}
      </p>
      <div
        id={ACADEMY_IDS.gallery}
        tabIndex={-1}
        role="group"
        aria-label={f.gallery}
        className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2"
      >
        {d.gallery.map((g, i) => (
          <div
            key={g.kind === "saved" ? `s-${g.image.id}` : g.url}
            className="relative aspect-[4/3] overflow-hidden rounded-sm border-2 border-border-2 bg-bg-3"
          >
            <SafeImage
              src={g.kind === "saved" ? g.image.url : g.url}
              alt=""
              fill
              unoptimized
              sizes="160px"
              className="object-cover"
            />
            <motion.button
              {...pressIcon}
              type="button"
              aria-label={LIVE.editorUi.removePhoto(i + 1)}
              onClick={() => remove(i)}
              className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full border-0 bg-glass-bg-strong p-0 text-fg-1 am-glass"
            >
              <Icon name="x" size={14} />
            </motion.button>
          </div>
        ))}
        <label className="grid aspect-[4/3] cursor-pointer place-items-center content-center gap-1.5 rounded-sm border-2 border-dashed border-border-3 bg-bg-2 text-fs-13 font-semibold text-fg-2 focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-amk-accent-ink hover:border-gf-neon">
          <Icon name="plus" size={18} />
          {LIVE.editorUi.addPhotos}
          <input
            type="file"
            accept={IMAGE_TYPES.join(",")}
            multiple
            className="am-sr"
            onChange={(e) => {
              set({
                gallery: d.gallery.concat(
                  pick(e.target.files).map((p) => ({
                    kind: "new" as const,
                    ...p,
                  }))
                ),
              })
              e.target.value = ""
            }}
          />
        </label>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}

/* ---------------- academy ---------------- */

export function AcademyForm({
  academy,
  defaultCountry,
  countries,
}: {
  /** null = create the organization's first academy */
  academy: ApiAcademy | null
  defaultCountry: string
  countries: ApiCountry[]
}) {
  const queryClient = useQueryClient()
  const [d, setD] = useState<AcademyDraft>(() =>
    academy ? academyDraftFrom(academy) : emptyAcademy(defaultCountry)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const sumRef = useRef<ErrorSummaryHandle>(null)
  const set = (patch: Partial<AcademyDraft>) =>
    setD((x) => ({ ...x, ...patch }))
  const show = (e: Record<string, string>) => {
    setErrors(e)
    if (Object.keys(e).length)
      requestAnimationFrame(() => sumRef.current?.focus())
  }

  const save = async () => {
    const found = validateAcademy(d)
    show(found)
    if (Object.keys(found).length) return
    const countryName =
      countries.find((c) => c.code === d.countryCode)?.name ?? d.countryCode
    setBusy(true)
    try {
      // the fields first (create or update), then each image on its own
      const [fields, ...images] = academyForms(d, countryName)
      let saved =
        d.id === null
          ? await createAcademy(fields)
          : await updateAcademy(d.id, fields)
      for (const image of images) saved = await updateAcademy(saved.id, image)
      // the single academy first: the form reads it as soon as the list names it
      queryClient.setQueryData(clubKeys.academy(saved.id), saved)
      queryClient.setQueryData<ApiAcademy[]>(clubKeys.academies(), (list) =>
        list
          ? list.some((a) => a.id === saved.id)
            ? list.map((a) => (a.id === saved.id ? saved : a))
            : list.concat(saved)
          : [saved]
      )
      void queryClient.invalidateQueries({ queryKey: clubKeys.listings() })
      ;[d.logo, d.cover, ...d.gallery].forEach(
        (x) =>
          x &&
          "url" in x &&
          x.url.startsWith("blob:") &&
          URL.revokeObjectURL(x.url)
      )
      setD(academyDraftFrom(saved))
      notify(d.id === null ? t.created : t.saved)
    } catch (e) {
      show(errorsFrom(e, ACADEMY_FIELDS, ACADEMY_IDS.name))
    } finally {
      setBusy(false)
    }
  }

  const text = (
    id: string,
    label: string,
    key: "name" | "city" | "address" | "latitude" | "longitude",
    opts: { required?: boolean; hint?: string; mode?: "decimal" } = {}
  ) => (
    <FormField
      id={id}
      label={label}
      required={opts.required}
      hint={opts.hint}
      error={errors[id]}
    >
      {(p) => (
        <Input
          {...p}
          inputMode={opts.mode}
          value={d[key]}
          maxLength={255}
          onChange={(e) => set({ [key]: e.target.value })}
        />
      )}
    </FormField>
  )

  return (
    <CardBlock aria-labelledby="h-academy-form">
      <SectionHead
        id="h-academy-form"
        title={t.academy}
        sub={d.id === null ? t.newAcademySub : t.academySub}
      />
      <form
        noValidate
        className="grid gap-[18px]"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <ErrorSummary
          errors={errors}
          labels={{
            [ACADEMY_IDS.name]: f.academyName,
            [ACADEMY_IDS.description]: f.description,
            [ACADEMY_IDS.country]: f.country,
            [ACADEMY_IDS.city]: f.city,
            [ACADEMY_IDS.address]: f.address,
            [ACADEMY_IDS.latitude]: f.latitude,
            [ACADEMY_IDS.longitude]: f.longitude,
            [ACADEMY_IDS.facilities]: f.facilities,
            [ACADEMY_IDS.policies]: f.policies,
            [ACADEMY_IDS.logo]: f.logo,
            [ACADEMY_IDS.cover]: f.cover,
            [ACADEMY_IDS.gallery]: f.gallery,
          }}
          ref={sumRef}
        />
        {text(ACADEMY_IDS.name, f.academyName, "name", { required: true })}
        <FormField
          id={ACADEMY_IDS.description}
          label={f.description}
          error={errors[ACADEMY_IDS.description]}
        >
          {(p) => (
            <Textarea
              {...p}
              value={d.description}
              maxLength={5000}
              onChange={(e) => set({ description: e.target.value })}
            />
          )}
        </FormField>
        <FormRow>
          <CountrySelect
            id={ACADEMY_IDS.country}
            value={d.countryCode}
            countries={countries}
            error={errors[ACADEMY_IDS.country]}
            onChange={(countryCode) => set({ countryCode })}
          />
          {text(ACADEMY_IDS.city, f.city, "city", { required: true })}
        </FormRow>
        {text(ACADEMY_IDS.address, f.address, "address")}
        <FormRow>
          {text(ACADEMY_IDS.latitude, f.latitude, "latitude", {
            hint: f.mapHint,
            mode: "decimal",
          })}
          {text(ACADEMY_IDS.longitude, f.longitude, "longitude", {
            mode: "decimal",
          })}
        </FormRow>
        <div className="grid gap-1.5">
          <p className="text-fs-14 font-semibold text-fg-1">{f.facilities}</p>
          <ListEditor
            id={ACADEMY_IDS.facilities}
            items={d.facilities}
            onChange={(facilities) => set({ facilities })}
            placeholder={f.facility}
            addLabel={f.addFacility}
          />
          <FieldError>{errors[ACADEMY_IDS.facilities]}</FieldError>
        </div>
        <FormField
          id={ACADEMY_IDS.policies}
          label={f.policies}
          error={errors[ACADEMY_IDS.policies]}
        >
          {(p) => (
            <Textarea
              {...p}
              value={d.policies}
              onChange={(e) => set({ policies: e.target.value })}
            />
          )}
        </FormField>
        <FormRow>
          <SingleImageField
            id={ACADEMY_IDS.logo}
            label={f.logo}
            src={d.logo?.url ?? d.logoUrl}
            error={errors[ACADEMY_IDS.logo]}
            onPick={(logo) => set({ logo })}
          />
          <SingleImageField
            id={ACADEMY_IDS.cover}
            label={f.cover}
            src={d.cover?.url ?? d.coverUrl}
            wide
            error={errors[ACADEMY_IDS.cover]}
            onPick={(cover) => set({ cover })}
          />
        </FormRow>
        <GalleryField d={d} set={set} error={errors[ACADEMY_IDS.gallery]} />
        <div className="flex justify-end border-t border-border-1 pt-4">
          <Button type="submit" disabled={busy} aria-busy={busy}>
            {d.id === null ? t.createAcademy : t.save}
          </Button>
        </div>
      </form>
    </CardBlock>
  )
}
