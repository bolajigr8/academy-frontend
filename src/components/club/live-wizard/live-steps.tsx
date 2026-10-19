"use client"

import { motion } from "framer-motion"
import { useRef } from "react"

import { Icon } from "@/components/icons/icon"
import { h4 } from "@/components/program/program-blocks"
import { CheckField } from "@/components/shared/check-field"
import { CheckGrid } from "@/components/shared/check-grid"
import { CheckList } from "@/components/shared/check-list"
import { ClubCrest } from "@/components/shared/club-crest"
import { FieldError, FormField } from "@/components/shared/form-field"
import { FormRow } from "@/components/shared/form-row"
import { ListingCard } from "@/components/shared/listing-card"
import { Meter } from "@/components/shared/meter"
import { NativeSelect } from "@/components/shared/native-select"
import { Notice } from "@/components/shared/notice"
import { notifyError } from "@/components/shared/notify"
import { SafeImage } from "@/components/shared/safe-image"
import { StatusPill } from "@/components/shared/status-pill"
import { VerifyBadge } from "@/components/shared/verify-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DATES,
  DOC_TYPES,
  GENDERS,
  LEVELS,
  PROVISION,
  TYPES,
} from "@/data/catalog"
import { EDITOR } from "@/data/editor-copy"
import { LIVE } from "@/data/live-copy"
import type { DocTypeId } from "@/data/types"
import { valueLabel, type CardView } from "@/features/academies/card-view"
import { crestFor } from "@/features/academies/search"
import type { ApiAcademy, ApiOptions } from "@/features/club/api"
import {
  DAYS,
  DOC_KEYS,
  documentLabel,
  draftChecklist,
  IMAGE_TYPES,
  INCLUDE_LABELS,
  stepForField,
  newKey,
  type DraftQuestion,
  type LiveDraft,
} from "@/features/club/live-draft"
import { verificationOf } from "@/features/club/view-models"
import { pressIcon } from "@/lib/motion"

import { ListEditor } from "../listing-wizard/list-editor"

/*
 * The listing editor's steps in api mode. Same markup as the prototype steps
 * (components/club/listing-wizard/wizard-steps.tsx); the values come from the
 * backend (GET /academy/portal/options) and are saved by features/club/live-editor.ts.
 */

export type LiveStepProps = {
  d: LiveDraft
  set: (patch: Partial<LiveDraft>) => void
  errors: Record<string, string>
  options: ApiOptions
}

const ui = LIVE.editorUi
const AGE_RANGE = Array.from({ length: 97 }, (_, i) => String(i + 3))

/** A dropdown of backend values, labelled like the prototype where the value matches */
function OptionSelect({
  id,
  label,
  value,
  values,
  labels = [],
  onChange,
  required = true,
}: {
  id: string
  label: string
  value: string
  values: string[]
  labels?: readonly { id: string; label: string }[]
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <FormField id={id} label={label} required={required}>
      {(p) => (
        <NativeSelect
          {...p}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {values.map((v) => (
            <option key={v} value={v}>
              {valueLabel(labels, v)}
            </option>
          ))}
        </NativeSelect>
      )}
    </FormField>
  )
}

/* Step 1: About the academy */
export function LiveStepAbout({
  d,
  set,
  errors,
  academies,
  orgName,
}: LiveStepProps & { academies: ApiAcademy[]; orgName: string }) {
  const t = EDITOR.about
  const academy = academies.find((a) => a.id === d.academyId) ?? null
  const v = academy ? verificationOf(academy.verification_status) : null
  return (
    <>
      {academies.length > 1 && d.id === null ? (
        <FormField
          id="amk-w-academy"
          label={ui.academy}
          required
          error={errors["amk-w-academy"]}
        >
          {(p) => (
            <NativeSelect
              {...p}
              value={d.academyId ?? ""}
              onChange={(e) => set({ academyId: Number(e.target.value) })}
            >
              {academies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
      ) : null}
      {academy ? (
        <div className="flex items-start gap-[14px] rounded-md border border-border-1 bg-bg-2 p-[18px]">
          <ClubCrest
            crest={crestFor({ id: String(academy.id), name: academy.name })}
            size={44}
          />
          <div>
            <h3 className={h4}>{academy.name}</h3>
            <p className="text-fs-14 text-fg-3">
              {academy.city} · {orgName}
            </p>
            {v?.kind === "badge" ? (
              <VerifyBadge v={v.value} />
            ) : v ? (
              <StatusPill tone="warning">
                {LIVE.verificationRejected}
              </StatusPill>
            ) : null}
          </div>
        </div>
      ) : (
        <FieldError>{errors["amk-w-academy"]}</FieldError>
      )}
      <FormField
        id="amk-w-title"
        label={t.name}
        required
        error={errors["amk-w-title"]}
        hint={t.nameHint}
      >
        {(p) => (
          <Input
            {...p}
            value={d.title}
            maxLength={70}
            onChange={(e) => set({ title: e.target.value })}
          />
        )}
      </FormField>
      <FormField
        id="amk-w-summary"
        label={t.summary}
        required
        error={errors["amk-w-summary"]}
        hint={t.summaryHint(d.description.length)}
      >
        {(p) => (
          <Textarea
            {...p}
            value={d.description}
            maxLength={180}
            onChange={(e) => set({ description: e.target.value })}
          />
        )}
      </FormField>
    </>
  )
}

/* Step 2: Add images. Real uploads (JPEG, PNG, WebP), up to 5; the first is the cover. */
export function LiveStepImages({ d, set, errors }: LiveStepProps) {
  const t = EDITOR.images
  const input = useRef<HTMLInputElement>(null)
  const add = (files: FileList | null) => {
    if (!files) return
    const picked = Array.from(files)
    const ok = picked.filter((f) => IMAGE_TYPES.includes(f.type))
    if (ok.length < picked.length) notifyError(LIVE.editor.imageType)
    const room = Math.max(0, 5 - d.images.length)
    set({
      images: d.images.concat(
        ok.slice(0, room).map((file) => ({
          kind: "new" as const,
          key: newKey("img"),
          file,
          url: URL.createObjectURL(file),
        }))
      ),
    })
    if (input.current) input.current.value = ""
  }
  const remove = (k: number) => {
    const img = d.images[k]
    if (img.kind === "new") URL.revokeObjectURL(img.url)
    set({
      images: d.images.filter((_, j) => j !== k),
      removedImageIds:
        img.kind === "saved"
          ? d.removedImageIds.concat(img.image.id)
          : d.removedImageIds,
    })
  }
  return (
    <>
      <p className="text-fs-16 leading-lh-relaxed text-fg-2">{t.intro}</p>
      <div
        id="amk-w-photos"
        tabIndex={-1}
        role="group"
        aria-label={ui.photosLabel}
        className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2"
      >
        {d.images.map((img, i) => (
          <div
            key={img.key}
            className="relative aspect-[4/3] overflow-hidden rounded-sm border-2 border-gf-neon bg-bg-3"
          >
            <SafeImage
              src={img.kind === "saved" ? img.image.url : img.url}
              alt=""
              fill
              unoptimized
              sizes="160px"
              className="object-cover"
            />
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-1.5 left-1.5 grid h-[22px] min-w-[22px] place-items-center rounded-[99px] bg-gf-neon px-1.5 font-mono text-[11px] font-bold text-text-on-neon"
            >
              {i === 0 ? ui.cover : i + 1}
            </motion.span>
            <motion.button
              {...pressIcon}
              type="button"
              aria-label={ui.removePhoto(i + 1)}
              onClick={() => remove(i)}
              className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full border-0 bg-glass-bg-strong p-0 text-fg-1 am-glass"
            >
              <Icon name="x" size={14} />
            </motion.button>
          </div>
        ))}
        {d.images.length < 5 ? (
          <label className="grid aspect-[4/3] cursor-pointer place-items-center content-center gap-1.5 rounded-sm border-2 border-dashed border-border-3 bg-bg-2 text-fs-13 font-semibold text-fg-2 focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-amk-accent-ink hover:border-gf-neon">
            <Icon name="plus" size={18} />
            {ui.addPhotos}
            <input
              ref={input}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              multiple
              className="am-sr"
              onChange={(e) => add(e.target.files)}
            />
          </label>
        ) : null}
      </div>
      <FieldError>{errors["amk-w-photos"]}</FieldError>
    </>
  )
}

/* Step 3: Program details */
export function LiveStepDetails({ d, set, errors, options }: LiveStepProps) {
  const t = EDITOR.details
  return (
    <>
      <FormRow cols={3}>
        <OptionSelect
          id="amk-w-type"
          label={t.type}
          value={d.academyType}
          values={options.academy_types}
          labels={TYPES}
          onChange={(academyType) => set({ academyType })}
        />
        <OptionSelect
          id="amk-w-level"
          label={t.level}
          value={d.playingLevel}
          values={options.playing_levels}
          labels={LEVELS}
          onChange={(playingLevel) => set({ playingLevel })}
        />
        <OptionSelect
          id="amk-w-gender"
          label={t.gender}
          value={d.gender}
          values={options.genders}
          labels={GENDERS}
          onChange={(gender) => set({ gender })}
        />
      </FormRow>
      <FormField
        id="amk-w-frequency"
        label={ui.trainingFrequency}
        hint={ui.trainingFrequencyHint}
        required
        error={errors["amk-w-frequency"]}
      >
        {(p) => (
          <Input
            {...p}
            value={d.trainingFrequency}
            maxLength={255}
            onChange={(e) => set({ trainingFrequency: e.target.value })}
          />
        )}
      </FormField>
      <FormField
        id="amk-w-method"
        label={t.method}
        required
        error={errors["amk-w-method"]}
      >
        {(p) => (
          <Textarea
            {...p}
            value={d.methodology}
            maxLength={5000}
            onChange={(e) => set({ methodology: e.target.value })}
          />
        )}
      </FormField>
      <FormField id="amk-w-comp" label={t.competition} hint={t.competitionHint}>
        {(p) => (
          <Input
            {...p}
            value={d.competition}
            maxLength={5000}
            onChange={(e) => set({ competition: e.target.value })}
          />
        )}
      </FormField>
      <fieldset className="m-0 grid min-w-0 gap-1.5 border-0 p-0">
        <legend className="p-0 text-fs-14 font-semibold text-fg-1">
          {ui.schedule}
        </legend>
        <p className="text-fs-13 text-fg-3">{ui.scheduleHint}</p>
        <p className="rounded-sm border border-dashed border-border-2 px-3 py-2 text-fs-13 text-fg-2">
          {ui.scheduleExample}
        </p>
        <ul className="mt-1 grid gap-2">
          {DAYS.map((day) => (
            <li
              key={day}
              className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-2 le-480:grid-cols-[1fr]"
            >
              <label
                htmlFor={`amk-w-day-${day}`}
                className="text-fs-14 font-semibold text-fg-2"
              >
                {ui.days[day]}
              </label>
              <Input
                id={`amk-w-day-${day}`}
                value={d.schedule[day]}
                maxLength={255}
                placeholder={ui.schedulePlaceholder}
                onChange={(e) =>
                  set({ schedule: { ...d.schedule, [day]: e.target.value } })
                }
              />
            </li>
          ))}
        </ul>
      </fieldset>
    </>
  )
}

/* Step 4: Age & eligibility */
export function LiveStepAges({ d, set, errors }: LiveStepProps) {
  const t = EDITOR.ages
  return (
    <>
      <FormRow id="amk-w-ages" tabIndex={-1}>
        <FormField
          id="amk-w-agemin"
          label={t.min}
          required
          error={errors["amk-w-ages"]}
        >
          {(p) => (
            <NativeSelect
              {...p}
              value={d.ageMin}
              onChange={(e) => set({ ageMin: e.target.value })}
            >
              {AGE_RANGE.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField id="amk-w-agemax" label={t.max} required>
          {(p) => (
            <NativeSelect
              {...p}
              value={d.ageMax}
              onChange={(e) => set({ ageMax: e.target.value })}
            >
              {AGE_RANGE.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </NativeSelect>
          )}
        </FormField>
      </FormRow>
      <p className="text-fs-13 text-fg-3">{t.hint}</p>
    </>
  )
}

/* Step 5: Pricing */
export function LiveStepPricing({
  d,
  set,
  errors,
  options,
  summary,
}: LiveStepProps & { summary: { label: string; value: string }[] }) {
  const t = EDITOR.pricing
  const money = (
    id: string,
    label: string,
    key: "price" | "registrationFee" | "deposit",
    hint?: string,
    required = false
  ) => (
    <FormField
      id={id}
      label={`${label} (${d.currency})`}
      hint={hint}
      required={required}
      error={errors[id]}
    >
      {(p) => (
        <Input
          {...p}
          inputMode="decimal"
          value={d[key]}
          onChange={(e) => set({ [key]: e.target.value })}
        />
      )}
    </FormField>
  )
  return (
    <>
      <FormRow>
        <OptionSelect
          id="amk-w-per"
          label={ui.frequency}
          value={d.paymentFrequency}
          values={options.payment_frequencies}
          onChange={(paymentFrequency) => set({ paymentFrequency })}
        />
        <OptionSelect
          id="amk-w-currency"
          label={ui.currency}
          value={d.currency}
          values={options.currencies}
          labels={options.currencies.map((c) => ({ id: c, label: c }))}
          onChange={(currency) => set({ currency })}
        />
      </FormRow>
      <FormRow>
        {money("amk-w-amount", ui.fee, "price", undefined, true)}
        {money("amk-w-reg", ui.registration, "registrationFee")}
      </FormRow>
      {money("amk-w-deposit", ui.deposit, "deposit", ui.depositHint)}
      {summary.length > 0 ? (
        <dl className="grid gap-1.5 rounded-md border border-border-1 bg-bg-2 p-[14px]">
          {summary.map((s) => (
            <div
              key={s.label}
              className="flex justify-between gap-3 text-fs-14 text-fg-2"
            >
              <dt>{s.label}</dt>
              <dd className="font-semibold text-fg-1 tabular-nums">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <h3 className={h4}>{t.optional}</h3>
      <p className="text-fs-13 text-fg-3">{ui.optionalHint}</p>
      <ListEditor
        id="amk-w-opt"
        items={d.optionalServices}
        onChange={(optionalServices) => set({ optionalServices })}
        placeholder={t.service}
        addLabel={ui.addOptional}
      />
    </>
  )
}

/* Step 6: Availability */
export function LiveStepAvailability({
  d,
  set,
  errors,
  options,
  monthOpts,
  preview,
}: LiveStepProps & {
  monthOpts: string[]
  /** start, deadline and places line per row, as the prototype shows under the list */
  preview: string
}) {
  const t = EDITOR.availability
  const rolling = d.paymentFrequency === "monthly"
  return (
    <>
      <FormRow>
        <FormField
          id="amk-w-weeks"
          label={ui.duration}
          required
          error={errors["amk-w-weeks"]}
        >
          {(p) => (
            <Input
              {...p}
              type="number"
              min={1}
              max={520}
              value={d.durationValue}
              onChange={(e) => set({ durationValue: e.target.value })}
            />
          )}
        </FormField>
        <OptionSelect
          id="amk-w-unit"
          label={ui.durationUnit}
          value={d.durationUnit}
          values={options.duration_units}
          onChange={(durationUnit) => set({ durationUnit })}
        />
      </FormRow>
      <h3 id="amk-w-intakes" tabIndex={-1} className={h4}>
        {t.startDates}
      </h3>
      <p className="text-fs-13 text-fg-3">
        {t.hint(rolling ? 7 : 21)} {ui.placesHint}
      </p>
      <FieldError>{errors["amk-w-intakes"]}</FieldError>
      <ul className="grid gap-2">
        {d.intakes.map((i, k) => {
          const months = monthOpts.includes(i.month)
            ? monthOpts
            : [i.month].concat(monthOpts)
          return (
            <motion.li
              key={i.key}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-2"
            >
              <NativeSelect
                aria-label={t.startDate(k + 1)}
                value={i.month}
                onChange={(e) =>
                  set({
                    intakes: d.intakes.map((x, j) =>
                      j === k ? { ...x, month: e.target.value } : x
                    ),
                  })
                }
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {DATES.fmt(
                      i.saved && i.saved.start_date.slice(0, 7) === m
                        ? i.saved.start_date
                        : DATES.firstMonday(m + "-01", 0)
                    )}
                  </option>
                ))}
              </NativeSelect>
              <Input
                type="number"
                min={Math.max(1, i.placesTaken)}
                max={1000}
                aria-label={t.places(k + 1)}
                value={i.capacity}
                onChange={(e) =>
                  set({
                    intakes: d.intakes.map((x, j) =>
                      j === k ? { ...x, capacity: e.target.value } : x
                    ),
                  })
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={t.remove(k + 1)}
                // the backend refuses to delete a start date once a place is taken
                disabled={i.placesTaken > 0}
                onClick={() =>
                  set({
                    intakes: d.intakes.filter((_, j) => j !== k),
                    removedIntakeIds:
                      i.id === null
                        ? d.removedIntakeIds
                        : d.removedIntakeIds.concat(i.id),
                  })
                }
              >
                <Icon name="trash" size={16} />
              </Button>
            </motion.li>
          )
        })}
      </ul>
      <Button
        variant="secondary"
        size="sm"
        className="justify-self-start"
        onClick={() =>
          set({
            intakes: d.intakes.concat({
              key: newKey("intake"),
              id: null,
              month:
                monthOpts[
                  Math.min(2 + d.intakes.length * 3, monthOpts.length - 1)
                ],
              capacity: "20",
              placesTaken: 0,
              saved: null,
            }),
          })
        }
      >
        <Icon name="plus" size={15} /> {t.add}
      </Button>
      {preview ? <p className="text-fs-14 text-fg-3">{preview}</p> : null}
    </>
  )
}

/* Step 7: Included services */
export function LiveStepIncluded({ d, set }: LiveStepProps) {
  const t = EDITOR.included
  // the prototype's choices, plus anything already saved that is not one of them
  const choices = INCLUDE_LABELS.concat(
    d.included.filter((x) => !INCLUDE_LABELS.includes(x))
  )
  const yesNo = (
    id: string,
    label: string,
    value: boolean,
    onChange: (v: boolean) => void
  ) => (
    <FormField id={id} label={label}>
      {(p) => (
        <NativeSelect
          {...p}
          value={value ? "yes" : "no"}
          onChange={(e) => onChange(e.target.value === "yes")}
        >
          <option value="yes">{PROVISION.included}</option>
          <option value="no">{PROVISION.none}</option>
        </NativeSelect>
      )}
    </FormField>
  )
  return (
    <>
      <fieldset className="m-0 grid min-w-0 gap-1.5 border-0 p-0">
        <legend className="p-0 text-fs-14 font-semibold text-fg-1">
          {t.legend}
        </legend>
        <CheckGrid
          options={choices.map((label) => ({ value: label, label }))}
          value={d.included}
          onChange={(included) => set({ included })}
        />
      </fieldset>
      <FormRow>
        {yesNo("amk-w-acc", t.accommodation, d.hasAccommodation, (v) =>
          set({ hasAccommodation: v })
        )}
        {yesNo("amk-w-edu", t.education, d.hasEducation, (v) =>
          set({ hasEducation: v })
        )}
      </FormRow>
    </>
  )
}

/* Step 8: Requirements (documents and questions) */
export function LiveStepRequirements({ d, set, errors }: LiveStepProps) {
  const t = EDITOR.requirements
  const known = (Object.keys(DOC_TYPES) as DocTypeId[]).map((k) => DOC_KEYS[k])
  const docs = known.concat(d.documents.filter((x) => !known.includes(x)))
  const setQ = (k: number, patch: Partial<DraftQuestion>) =>
    set({
      questions: d.questions.map((q, j) => (j === k ? { ...q, ...patch } : q)),
    })
  return (
    <>
      <div className="grid gap-1.5">
        <h3 className={h4}>
          {EDITOR.ages.requirements}{" "}
          <span className="text-fs-13 font-normal text-fg-3">*</span>
        </h3>
        <p className="text-fs-13 text-fg-3">{ui.requirementsHint}</p>
        <ListEditor
          id="amk-w-req"
          items={d.requirements}
          onChange={(requirements) => set({ requirements })}
          placeholder={EDITOR.ages.requirement}
          addLabel={EDITOR.ages.addRequirement}
        />
        <FieldError>{errors["amk-w-req"]}</FieldError>
      </div>
      <fieldset
        id="amk-w-docs"
        tabIndex={-1}
        className="m-0 grid min-w-0 gap-1.5 border-0 p-0"
      >
        <legend className="p-0 text-fs-14 font-semibold text-fg-1">
          {t.legend}
        </legend>
        <CheckGrid
          options={docs.map((key) => ({
            value: key,
            label: documentLabel(key),
          }))}
          value={d.documents}
          onChange={(documents) => set({ documents })}
        />
        <FieldError>{errors["amk-w-docs"]}</FieldError>
      </fieldset>
      <h3 className={h4}>{t.questions}</h3>
      <ul className="grid gap-3">
        {d.questions.map((q, k) => (
          <motion.li
            key={q.key}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-2 rounded-md border border-border-1 bg-bg-2 p-[14px]"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <FormField
                id={`amk-w-q-${k}`}
                label={`${t.question} ${k + 1}`}
                required
                error={errors[`amk-w-q-${k}`]}
              >
                {(p) => (
                  <Input
                    {...p}
                    value={q.question}
                    maxLength={500}
                    onChange={(e) => setQ(k, { question: e.target.value })}
                  />
                )}
              </FormField>
              <Button
                variant="ghost"
                size="icon"
                className="mt-7"
                aria-label={ui.removeQuestion(k + 1)}
                onClick={() =>
                  set({ questions: d.questions.filter((_, j) => j !== k) })
                }
              >
                <Icon name="trash" size={16} />
              </Button>
            </div>
            <FormRow>
              <FormField id={`amk-w-qt-${k}`} label={ui.questionType} required>
                {(p) => (
                  <NativeSelect
                    {...p}
                    value={q.type}
                    onChange={(e) =>
                      setQ(k, {
                        type: e.target.value as DraftQuestion["type"],
                      })
                    }
                  >
                    {(
                      Object.keys(ui.questionTypes) as DraftQuestion["type"][]
                    ).map((type) => (
                      <option key={type} value={type}>
                        {ui.questionTypes[type]}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </FormField>
              <CheckField
                className="self-end pb-3"
                checked={q.required}
                onChange={(e) => setQ(k, { required: e.target.checked })}
              >
                {ui.required}
              </CheckField>
            </FormRow>
            {q.type === "choice" ? (
              <>
                <p className="text-fs-14 font-semibold text-fg-1">
                  {ui.options}
                </p>
                <ListEditor
                  id={`amk-w-qo-${k}`}
                  items={q.options}
                  onChange={(o) => setQ(k, { options: o })}
                  placeholder={ui.option}
                  addLabel={ui.addOption}
                />
              </>
            ) : null}
          </motion.li>
        ))}
      </ul>
      <Button
        variant="secondary"
        size="sm"
        className="justify-self-start"
        onClick={() =>
          set({
            questions: d.questions.concat({
              key: newKey("q"),
              question: "",
              type: "long_text",
              required: true,
              options: [],
            }),
          })
        }
      >
        <Icon name="plus" size={15} /> {t.addQuestion}
      </Button>
      <FormField
        id="amk-w-terms"
        label={ui.terms}
        hint={ui.termsHint}
        error={errors["amk-w-terms"]}
      >
        {(p) => (
          <Textarea
            {...p}
            value={d.terms}
            onChange={(e) => set({ terms: e.target.value })}
          />
        )}
      </FormField>
    </>
  )
}

/* Step 9: Preview: the search card as the backend has the listing (GET /listings/{id}) */
export function LiveStepPreview({ card }: { card: CardView | null }) {
  return (
    <div className="grid gap-5 rounded-lg border border-dashed border-border-3 p-[clamp(16px,2vw,24px)]">
      <p className="flex items-center gap-1.5 font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
        <Icon name="eye" size={14} /> {EDITOR.preview.lead}
      </p>
      {card ? (
        <div className="max-w-[400px]">
          <ListingCard card={card} saved={false} headingLevel={3} linkless />
        </div>
      ) : null}
      <Notice tone="neutral" icon="eye">
        {ui.previewLater}
      </Notice>
    </div>
  )
}

/* Step 10: Submit for review (contract section 12): checklist, status, submit, missing items */
export function LiveStepSubmit({
  d,
  onSaveDraft,
  onSubmit,
  saving,
  submitting,
  missing,
  rejectionReason,
  goToStep,
}: {
  d: LiveDraft
  onSaveDraft: () => void
  onSubmit: () => void
  saving: boolean
  submitting: boolean
  /** the 422 "not ready to submit" list, in workflow order */
  missing: { field: string; label: string; step: number }[] | null
  rejectionReason: string | null
  goToStep: (index: number) => void
}) {
  const t = EDITOR.submit
  const s2 = LIVE.listingStatus2
  const checks = draftChecklist(d)
  const ok = checks.filter((c) => c[1]).length
  const canSubmit = d.status === "draft" || d.status === "rejected"
  return (
    <>
      <Meter
        value={ok}
        max={checks.length}
        label={t.ready}
        right={`${ok} ${t.of} ${checks.length}`}
      />
      <CheckList
        items={checks.map(([label, done]) => ({
          text: label + (done ? "" : t.missing),
          icon: done ? ("checkcircle" as const) : ("alert" as const),
          sw: 1.8,
        }))}
      />
      {missing && missing.length > 0 ? (
        <div
          id="amk-w-missing"
          tabIndex={-1}
          role="alert"
          className="grid gap-2 rounded-md border border-border-2 bg-bg-2 p-[14px]"
        >
          <p className="text-fs-14 font-semibold text-fg-1">
            {s2.missingTitle}
          </p>
          <ul className="grid gap-1.5">
            {missing.map((m) => (
              <li
                key={m.field}
                className="flex flex-wrap items-center justify-between gap-2 text-fs-14 text-fg-2"
              >
                <span className="flex items-center gap-1.5">
                  <Icon name="alert" size={15} /> {m.label}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToStep(stepForField(m.field, m.step))}
                >
                  {s2.goToStep(stepForField(m.field, m.step) + 1)}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {d.status === "draft" ? (
        <Notice tone="neutral" icon="shieldcheck">
          {t.draftNotice}
        </Notice>
      ) : null}
      {d.status === "rejected" ? (
        <Notice tone="warning" icon="alert">
          <b>{s2.rejectedLead}</b> {rejectionReason} {s2.rejectedNext}
        </Notice>
      ) : null}
      {d.status === "pending_review" ? (
        <Notice icon="clock">
          <b>{t.reviewLead}</b> {s2.inReview}
        </Notice>
      ) : null}
      {d.status === "published" ? (
        <Notice tone="success" icon="checkcircle">
          <b>{t.publishedLead}</b> {t.publishedNotice}
        </Notice>
      ) : null}
      {d.status === "paused" ? (
        <Notice tone="neutral" icon="clock">
          {s2.paused}
        </Notice>
      ) : null}
      {d.status === "archived" ? (
        <Notice tone="neutral" icon="info">
          {s2.archived}
        </Notice>
      ) : null}
      <div className="flex flex-wrap gap-[10px]">
        {canSubmit ? (
          <Button
            onClick={onSubmit}
            disabled={submitting || saving}
            aria-busy={submitting}
          >
            <Icon name="send" size={16} />{" "}
            {submitting ? s2.submitting : s2.submit}
          </Button>
        ) : null}
        <Button
          variant="secondary"
          onClick={onSaveDraft}
          disabled={saving || submitting}
          aria-busy={saving}
        >
          {t.saveDraft}
        </Button>
      </div>
    </>
  )
}
