"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { Icon } from "@/components/icons/icon"
import { FeeCard } from "@/components/program/fee-card"
import { ListingHeader } from "@/components/program/listing-header"
import { Facts, h4, Includes } from "@/components/program/program-blocks"
import { CheckGrid } from "@/components/shared/check-grid"
import { CheckList } from "@/components/shared/check-list"
import { ClubCrest } from "@/components/shared/club-crest"
import { FieldError, FormField } from "@/components/shared/form-field"
import { FormRow } from "@/components/shared/form-row"
import { Kv, KvLines } from "@/components/shared/key-value"
import { Meter } from "@/components/shared/meter"
import { NativeSelect } from "@/components/shared/native-select"
import { Notice } from "@/components/shared/notice"
import { SafeImage } from "@/components/shared/safe-image"
import { VerifyBadge } from "@/components/shared/verify-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DATES,
  DOC_TYPES,
  FEE_UNITS,
  GENDERS,
  INCLUDES,
  LEVELS,
  PROVISION,
  SCHEDULES,
  TYPES,
} from "@/data/catalog"
import { EDITOR } from "@/data/editor-copy"
import type {
  DocTypeId,
  Fees,
  FeeUnit,
  GenderId,
  IncludeId,
  LevelId,
  Provision,
  TypeId,
} from "@/data/types"
import { AGES, crestFor, fmtEuro } from "@/features/academies/search"
import type { EnrichedListing } from "@/features/academies/types"
import {
  balanceOf,
  COMMISSION_RATE,
  commission,
  programTotal,
} from "@/features/applications/flow"
import {
  checklist,
  makeIntake,
  PHOTO_LIBRARY,
  type WizardListing,
} from "@/features/club/wizard"
import type { Academy, Organization } from "@/data/types"
import { pressIcon } from "@/lib/motion"
import { routes } from "@/routes"

import { ListEditor } from "./list-editor"

export type StepProps = {
  l: WizardListing
  set: (patch: Partial<WizardListing>) => void
  setFees: (patch: Partial<Fees>) => void
  errors: Record<string, string>
}

const num = (v: string) => +v

/* Step 1: About the academy */
export function StepAbout({
  l,
  set,
  errors,
  academy,
  org,
}: StepProps & { academy: Academy; org: Organization }) {
  const t = EDITOR.about
  return (
    <>
      <div className="flex items-start gap-[14px] rounded-md border border-border-1 bg-bg-2 p-[18px]">
        <ClubCrest crest={crestFor(academy)} size={44} />
        <div>
          <h3 className={h4}>{academy.name}</h3>
          <p className="text-fs-14 text-fg-3">
            {academy.city} · {org.name}
          </p>
          <VerifyBadge v={org.verification} />
        </div>
      </div>
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
            value={l.title}
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
        hint={t.summaryHint(l.summary.length)}
      >
        {(p) => (
          <Textarea
            {...p}
            value={l.summary}
            maxLength={180}
            onChange={(e) => set({ summary: e.target.value })}
          />
        )}
      </FormField>
    </>
  )
}

/* Step 2: Add images. Up to 5, in order; the first is the cover. */
export function StepImages({ l, set, errors }: StepProps) {
  const t = EDITOR.images
  return (
    <>
      <p className="text-fs-16 leading-lh-relaxed text-fg-2">{t.intro}</p>
      <div
        id="amk-w-photos"
        tabIndex={-1}
        role="group"
        aria-label={t.library}
        className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2"
      >
        {PHOTO_LIBRARY.map((src) => {
          const i = l.gallery.indexOf(src)
          return (
            <motion.button
              {...pressIcon}
              key={src}
              type="button"
              aria-pressed={i > -1}
              aria-label={`${t.photo} ${src.split("/").pop()}${i > -1 ? `, ${t.position} ${i + 1}` : ""}`}
              onClick={() =>
                set({
                  gallery:
                    i > -1
                      ? l.gallery.filter((x) => x !== src)
                      : l.gallery.length < 5
                        ? l.gallery.concat(src)
                        : l.gallery,
                })
              }
              className="relative aspect-[4/3] overflow-hidden rounded-sm border-2 border-transparent bg-none p-0 aria-pressed:border-gf-neon"
            >
              <SafeImage
                src={src}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
              {i > -1 ? (
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-1.5 left-1.5 grid h-[22px] min-w-[22px] place-items-center rounded-[99px] bg-gf-neon font-mono text-[11px] font-bold text-text-on-neon"
                >
                  {i + 1}
                </motion.span>
              ) : null}
            </motion.button>
          )
        })}
      </div>
      <FieldError>{errors["amk-w-photos"]}</FieldError>
      <FormField id="amk-w-alt" label={t.alt} hint={t.altHint}>
        {(p) => (
          <Input
            {...p}
            value={l.alt}
            onChange={(e) => set({ alt: e.target.value })}
          />
        )}
      </FormField>
    </>
  )
}

/* Step 3: Program details */
export function StepDetails({ l, set, errors }: StepProps) {
  const t = EDITOR.details
  return (
    <>
      <FormRow cols={3}>
        <FormField id="amk-w-type" label={t.type} required>
          {(p) => (
            <NativeSelect
              {...p}
              value={l.type}
              onChange={(e) => {
                const type = e.target.value as TypeId
                set({ type, schedule: SCHEDULES[type] })
              }}
            >
              {TYPES.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField id="amk-w-level" label={t.level} required>
          {(p) => (
            <NativeSelect
              {...p}
              value={l.level}
              onChange={(e) => set({ level: e.target.value as LevelId })}
            >
              {LEVELS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField id="amk-w-gender" label={t.gender} required>
          {(p) => (
            <NativeSelect
              {...p}
              value={l.gender}
              onChange={(e) => set({ gender: e.target.value as GenderId })}
            >
              {GENDERS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
      </FormRow>
      <FormRow>
        <FormField id="amk-w-sessions" label={t.sessions} required>
          {(p) => (
            <Input
              {...p}
              type="number"
              min={1}
              max={14}
              value={l.sessionsPerWeek}
              onChange={(e) => set({ sessionsPerWeek: num(e.target.value) })}
            />
          )}
        </FormField>
        <FormField id="amk-w-hours" label={t.hours} required>
          {(p) => (
            <Input
              {...p}
              type="number"
              min={1}
              max={30}
              value={l.hoursPerWeek}
              onChange={(e) => set({ hoursPerWeek: num(e.target.value) })}
            />
          )}
        </FormField>
      </FormRow>
      <FormField
        id="amk-w-method"
        label={t.method}
        required
        error={errors["amk-w-method"]}
      >
        {(p) => (
          <Textarea
            {...p}
            value={l.methodology}
            onChange={(e) => set({ methodology: e.target.value })}
          />
        )}
      </FormField>
      <FormField id="amk-w-comp" label={t.competition} hint={t.competitionHint}>
        {(p) => (
          <Input
            {...p}
            value={l.competition}
            onChange={(e) => set({ competition: e.target.value })}
          />
        )}
      </FormField>
    </>
  )
}

/* Step 4: Age & eligibility */
export function StepAges({ l, set, errors }: StepProps) {
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
              value={l.ageMin}
              onChange={(e) => set({ ageMin: num(e.target.value) })}
            >
              {AGES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField id="amk-w-agemax" label={t.max} required>
          {(p) => (
            <NativeSelect
              {...p}
              value={l.ageMax}
              onChange={(e) => set({ ageMax: num(e.target.value) })}
            >
              {AGES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </NativeSelect>
          )}
        </FormField>
      </FormRow>
      <p className="text-fs-13 text-fg-3">{t.hint}</p>
      <h3 className={h4}>{t.requirements}</h3>
      <ListEditor
        id="amk-w-req"
        items={l.requirements}
        onChange={(v) => set({ requirements: v })}
        placeholder={t.requirement}
        addLabel={t.addRequirement}
      />
    </>
  )
}

/* Step 5: Pricing */
export function StepPricing({
  l,
  set,
  setFees,
  errors,
  pv,
  setPer,
}: StepProps & { pv: EnrichedListing; setPer: (per: FeeUnit) => void }) {
  const t = EDITOR.pricing
  const total = programTotal(pv)
  const d = l.fees.deposit
  return (
    <>
      <FormRow>
        <FormField id="amk-w-per" label={t.per} required>
          {(p) => (
            <NativeSelect
              {...p}
              value={l.fees.per}
              onChange={(e) => setPer(e.target.value as FeeUnit)}
            >
              {t.perOptions.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField
          id="amk-w-amount"
          label={t.amount(FEE_UNITS[l.fees.per].label)}
          required
          error={errors["amk-w-amount"]}
        >
          {(p) => (
            <Input
              {...p}
              type="number"
              min={0}
              step={10}
              value={l.fees.amount}
              onChange={(e) => setFees({ amount: num(e.target.value) })}
            />
          )}
        </FormField>
      </FormRow>
      <FormRow cols={3}>
        <FormField id="amk-w-reg" label={t.registration}>
          {(p) => (
            <Input
              {...p}
              type="number"
              min={0}
              step={10}
              value={l.fees.registrationFee}
              onChange={(e) =>
                setFees({ registrationFee: num(e.target.value) })
              }
            />
          )}
        </FormField>
        {!l.rolling ? (
          <FormField
            id="amk-w-dep"
            label={t.deposit}
            error={errors["amk-w-deposit"]}
          >
            {(p) => (
              <NativeSelect
                {...p}
                value={d ? `${d.kind}:${d.value}` : "none"}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === "none") setFees({ deposit: null, schedule: "full" })
                  else {
                    const [kind, value] = v.split(":")
                    setFees({
                      deposit: {
                        kind: kind === "fixed" ? "fixed" : "percent",
                        value: +value,
                      },
                      schedule: "deposit_balance",
                    })
                  }
                }}
              >
                <option value="none">{t.noDeposit}</option>
                {[10, 20, 25, 30, 40].map((v) => (
                  <option key={v} value={`percent:${v}`}>
                    {t.percentOption(v)}
                  </option>
                ))}
                {[500, 1000, 1500, 2000].map((v) => (
                  <option key={v} value={`fixed:${v}`}>
                    {t.fixedOption(fmtEuro(v))}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
        ) : null}
        {!l.rolling && d ? (
          <FormField id="amk-w-due" label={t.balanceDue}>
            {(p) => (
              <Input
                {...p}
                type="number"
                min={0}
                max={120}
                value={l.fees.balanceDueDays}
                onChange={(e) =>
                  setFees({ balanceDueDays: num(e.target.value) })
                }
              />
            )}
          </FormField>
        ) : null}
      </FormRow>
      <KvLines>
        {total != null ? (
          <Kv label={t.programTotal}>{fmtEuro(total)}</Kv>
        ) : null}
        {pv.deposit > 0 ? (
          <Kv label={t.depositLine}>{fmtEuro(pv.deposit)}</Kv>
        ) : null}
        {pv.deposit > 0 ? (
          <Kv label={t.balance}>{fmtEuro(balanceOf(pv))}</Kv>
        ) : null}
        <Kv label={t.monthly}>{fmtEuro(pv.monthly)}</Kv>
        <Kv label={t.golaflyFee(Math.round(COMMISSION_RATE * 100))} total>
          {fmtEuro(
            commission((total || l.fees.amount) + l.fees.registrationFee)
          )}
        </Kv>
      </KvLines>
      <h3 className={h4}>{t.optional}</h3>
      <ul className="grid gap-2">
        {l.optional.map((o, i) => (
          <motion.li
            key={o.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-2"
          >
            <Input
              aria-label={t.serviceName(i + 1)}
              value={o.label}
              placeholder={t.service}
              onChange={(e) =>
                set({
                  optional: l.optional.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x
                  ),
                })
              }
            />
            <Input
              aria-label={t.servicePrice(i + 1)}
              type="number"
              min={0}
              value={o.price}
              onChange={(e) =>
                set({
                  optional: l.optional.map((x, j) =>
                    j === i ? { ...x, price: num(e.target.value) } : x
                  ),
                })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${o.label || t.removeService}`}
              onClick={() =>
                set({ optional: l.optional.filter((_, j) => j !== i) })
              }
            >
              <Icon name="trash" size={16} />
            </Button>
          </motion.li>
        ))}
      </ul>
      <Button
        variant="secondary"
        size="sm"
        className="justify-self-start"
        onClick={() =>
          set({
            optional: l.optional.concat({
              id: `opt${Date.now()}`,
              label: "",
              price: 100,
              per: "once",
            }),
          })
        }
      >
        <Icon name="plus" size={15} /> {t.addService}
      </Button>
    </>
  )
}

/* Step 6: Availability (start dates) */
export function StepAvailability({
  l,
  set,
  errors,
  monthOpts,
  rebuildIntakes,
}: StepProps & {
  monthOpts: string[]
  rebuildIntakes: (patch: Partial<WizardListing>) => void
}) {
  const t = EDITOR.availability
  return (
    <>
      {!l.rolling ? (
        <FormField
          id="amk-w-weeks"
          label={t.weeks}
          required
          error={errors["amk-w-weeks"]}
        >
          {(p) => (
            <Input
              {...p}
              type="number"
              min={1}
              max={52}
              value={l.durationWeeks ?? ""}
              onChange={(e) =>
                rebuildIntakes({ durationWeeks: num(e.target.value) })
              }
              className="max-w-[200px]"
            />
          )}
        </FormField>
      ) : null}
      <h3 id="amk-w-intakes" tabIndex={-1} className={h4}>
        {t.startDates}
      </h3>
      <p className="text-fs-13 text-fg-3">{t.hint(l.rolling ? 7 : 21)}</p>
      <FieldError>{errors["amk-w-intakes"]}</FieldError>
      <ul className="grid gap-2">
        {l.intakes.map((i, k) => {
          const key = DATES.monthKey(i.start)
          return (
            <motion.li
              key={i.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-2"
            >
              <NativeSelect
                aria-label={t.startDate(k + 1)}
                value={key}
                onChange={(e) =>
                  set({
                    intakes: l.intakes.map((x, j) =>
                      j === k ? makeIntake(l, e.target.value, x.capacity, j) : x
                    ),
                  })
                }
              >
                {monthOpts
                  .concat(monthOpts.includes(key) ? [] : [key])
                  .map((m) => (
                    <option key={m} value={m}>
                      {DATES.fmt(DATES.firstMonday(m + "-01", 0))}
                    </option>
                  ))}
              </NativeSelect>
              <Input
                type="number"
                min={1}
                max={120}
                aria-label={t.places(k + 1)}
                value={i.capacity}
                onChange={(e) =>
                  set({
                    intakes: l.intakes.map((x, j) =>
                      j === k ? { ...x, capacity: num(e.target.value) } : x
                    ),
                  })
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={t.remove(k + 1)}
                onClick={() =>
                  set({ intakes: l.intakes.filter((_, j) => j !== k) })
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
            intakes: l.intakes.concat(
              makeIntake(
                l,
                monthOpts[
                  Math.min(2 + l.intakes.length * 3, monthOpts.length - 1)
                ],
                20,
                l.intakes.length
              )
            ),
          })
        }
      >
        <Icon name="plus" size={15} /> {t.add}
      </Button>
      {l.intakes.length > 0 ? (
        <p className="text-fs-14 text-fg-3">
          {l.intakes
            .map(
              (i) =>
                `${DATES.fmtShort(i.start)}: ${t.applyBy} ${DATES.fmtShort(i.deadline)}, ${i.capacity} ${t.places_}`
            )
            .join(" · ")}
        </p>
      ) : null}
    </>
  )
}

/* Step 7: Included services */
export function StepIncluded({ l, set }: StepProps) {
  const t = EDITOR.included
  const provisions = Object.keys(PROVISION) as Provision[]
  return (
    <>
      <fieldset className="m-0 grid min-w-0 gap-1.5 border-0 p-0">
        <legend className="p-0 text-fs-14 font-semibold text-fg-1">
          {t.legend}
        </legend>
        <CheckGrid
          options={(Object.keys(INCLUDES) as IncludeId[]).map((k) => ({
            value: k,
            label: INCLUDES[k].label,
          }))}
          value={l.includes}
          onChange={(v) => set({ includes: v as IncludeId[] })}
        />
      </fieldset>
      <FormRow>
        <FormField id="amk-w-acc" label={t.accommodation}>
          {(p) => (
            <NativeSelect
              {...p}
              value={l.accommodation}
              onChange={(e) =>
                set({ accommodation: e.target.value as Provision })
              }
            >
              {provisions.map((k) => (
                <option key={k} value={k}>
                  {PROVISION[k]}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField id="amk-w-edu" label={t.education}>
          {(p) => (
            <NativeSelect
              {...p}
              value={l.education}
              onChange={(e) => set({ education: e.target.value as Provision })}
            >
              {provisions.map((k) => (
                <option key={k} value={k}>
                  {PROVISION[k]}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
      </FormRow>
      {l.accommodation !== "none" ? (
        <FormField id="amk-w-accn" label={t.accommodationNote}>
          {(p) => (
            <Input
              {...p}
              value={l.accommodationNote}
              onChange={(e) => set({ accommodationNote: e.target.value })}
            />
          )}
        </FormField>
      ) : null}
      {l.education !== "none" ? (
        <FormField id="amk-w-edun" label={t.educationNote}>
          {(p) => (
            <Input
              {...p}
              value={l.educationNote}
              onChange={(e) => set({ educationNote: e.target.value })}
            />
          )}
        </FormField>
      ) : null}
    </>
  )
}

/* Step 8: Requirements (documents and questions) */
export function StepRequirements({ l, set, errors }: StepProps) {
  const t = EDITOR.requirements
  return (
    <>
      <fieldset
        id="amk-w-docs"
        tabIndex={-1}
        className="m-0 grid min-w-0 gap-1.5 border-0 p-0"
      >
        <legend className="p-0 text-fs-14 font-semibold text-fg-1">
          {t.legend}
        </legend>
        <CheckGrid
          options={(Object.keys(DOC_TYPES) as DocTypeId[]).map((k) => ({
            value: k,
            label: DOC_TYPES[k].label,
          }))}
          value={l.documents}
          onChange={(v) => set({ documents: v as DocTypeId[] })}
        />
        <FieldError>{errors["amk-w-docs"]}</FieldError>
      </fieldset>
      <h3 className={h4}>{t.questions}</h3>
      <p className="text-fs-13 text-fg-3">{t.questionsHint}</p>
      <CheckList
        items={l.questions
          .slice(0, 2)
          .map((q) => ({ text: q.label, icon: "lock" as const, sw: 1.8 }))}
      />
      <ListEditor
        id="amk-w-q"
        items={l.questions.slice(2).map((q) => q.label)}
        placeholder={t.question}
        addLabel={t.addQuestion}
        onChange={(v) =>
          set({
            questions: l.questions.slice(0, 2).concat(
              v.map((label, i) => ({
                id: `q${i}`,
                label,
                type: "textarea" as const,
                required: true,
              }))
            ),
          })
        }
      />
    </>
  )
}

/* Step 9: Preview, using the same header, facts, includes and fee card families see */
export function StepPreview({
  pv,
  today,
}: {
  pv: EnrichedListing
  today: string
}) {
  return (
    <div className="grid gap-5 rounded-lg border border-dashed border-border-3 p-[clamp(16px,2vw,24px)]">
      <p className="flex items-center gap-1.5 font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
        <Icon name="eye" size={14} /> {EDITOR.preview.lead}
      </p>
      <ListingHeader listing={pv} preview />
      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 le-900:grid-cols-[1fr]">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-[clamp(16px,2vw,24px)]">
          <p className="max-w-[58ch] text-fs-18 leading-lh-relaxed text-fg-2">
            {pv.summary}
          </p>
          <Facts listing={pv} />
          <Includes listing={pv} />
        </div>
        <FeeCard
          listing={pv}
          intakeId={pv.intakes[0].id}
          onIntake={() => {}}
          today={today}
          preview
        />
      </div>
    </div>
  )
}

/* Step 10: Submit for verification */
export function StepSubmit({
  l,
  status,
  onSubmit,
  onApprove,
  onSaveChanges,
  onSaveDraft,
}: {
  l: WizardListing
  status: string
  onSubmit: () => void
  onApprove: () => void
  onSaveChanges: () => void
  onSaveDraft: () => void
}) {
  const t = EDITOR.submit
  const checks = checklist(l)
  const ok = checks.filter((c) => c[1]).length
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
      {status === "draft" ? (
        <Notice tone="neutral" icon="shieldcheck">
          {t.draftNotice}
        </Notice>
      ) : null}
      {status === "in_review" ? (
        <Notice icon="clock">
          <b>{t.reviewLead}</b> {t.reviewNotice}
        </Notice>
      ) : null}
      {status === "published" && l.id ? (
        <Notice tone="success" icon="checkcircle">
          <b>{t.publishedLead}</b> {t.publishedNotice}{" "}
          <Link href={routes.academy(l.id)} className="am-link">
            {t.viewPublic}
          </Link>
        </Notice>
      ) : null}
      <div className="flex flex-wrap gap-[10px]">
        {status === "draft" ? (
          <Button disabled={!checks.every((c) => c[1])} onClick={onSubmit}>
            {t.submit}
          </Button>
        ) : null}
        {status === "in_review" ? (
          <Button onClick={onApprove}>{t.approve}</Button>
        ) : null}
        {status === "published" ? (
          <Button onClick={onSaveChanges}>{t.saveChanges}</Button>
        ) : null}
        <Button variant="secondary" onClick={onSaveDraft}>
          {t.saveDraft}
        </Button>
      </div>
    </>
  )
}
