"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { FieldError, FormField } from "@/components/shared/form-field"
import { Kv, KvLines } from "@/components/shared/key-value"
import { Modal } from "@/components/shared/modal"
import { Notice } from "@/components/shared/notice"
import { notify } from "@/components/shared/notify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import { getListing } from "@/features/club/api"
import {
  moveToEnrollment,
  type ApiApplicant,
} from "@/features/club/applications-api"
import { clubKeys } from "@/features/club/query-keys"
import type { EnrollmentPlan } from "@/features/enrollments/api"
import {
  depositPlansAvailable,
  installmentsLeft,
  isFree,
  planBody,
  planFieldMap,
  previewSchedule,
  validatePlan,
  type PlanDraft,
  type PlanListing,
} from "@/features/enrollments/logic"
import { getApiFieldErrors, getCurrentStatus } from "@/lib/api/errors"
import { addDays, todayISO } from "@/lib/date"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

const t = LIVE.enrollment
let seq = 0
const key = () => `k${++seq}`

/*
 * Week 3 part 1, section 2: the academy turns an accepted application into an
 * enrollment. The listing sets the amounts (price, deposit, registration fee:
 * read from GET /academy/portal/listings/{id}); the academy picks the plan,
 * the dates and optional extras. The preview is the schedule the backend will
 * build; the backend's rules are checked first so a mistake is shown before
 * sending, and every refusal (field errors, plan_not_available,
 * invalid_schedule, intake_full, current_status) is shown as it comes.
 */
export function MoveToEnrollmentDialog({
  a,
  open,
  onClose,
  onDone,
}: {
  a: ApiApplicant
  open: boolean
  onClose: () => void
  onDone: (next: ApiApplicant) => void
}) {
  const today = todayISO()
  const listingQuery = useQuery({
    queryKey: clubKeys.listing(a.listing.id),
    queryFn: () => getListing(a.listing.id),
    enabled: open,
  })
  const l = listingQuery.data
  const L: PlanListing | null = useMemo(
    () =>
      l
        ? {
            currency: l.price?.currency ?? l.currency ?? "EUR",
            price: l.price?.amount_minor ?? 0,
            deposit: l.deposit?.amount_minor ?? 0,
            registrationFee: l.registration_fee?.amount_minor ?? 0,
            intakeEnd: a.intake.end_date ?? null,
          }
        : null,
    [l, a.intake.end_date]
  )
  const [d, setD] = useState<PlanDraft>({
    plan: "full",
    balanceDate: "",
    installments: [{ key: key(), amount: "", date: "" }],
    extras: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<PlanDraft>) => setD((x) => ({ ...x, ...patch }))
  const money = (minor: number) =>
    formatMoney({
      amount_minor: minor,
      amount: (minor / 100).toFixed(2),
      currency: L?.currency ?? "EUR",
    })
  const deadline = addDays(today, 7)
  const first = a.player.first_name ?? ""

  const send = async () => {
    if (!L) return
    const e = validatePlan(L, d, today)
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      const { application, message } = await moveToEnrollment(
        a.id,
        planBody(L, d)
      )
      // "Application moved to enrollment." or, for a free listing, "Enrollment confirmed."
      notify(message || t.move)
      onDone(application)
      onClose()
    } catch (err) {
      // the backend's message is in the error toast; field errors go under their box
      setErrors(getApiFieldErrors(err, planFieldMap(d)).byControl)
      if (getCurrentStatus(err)) onClose()
    } finally {
      setBusy(false)
    }
  }

  const preview = L ? previewSchedule(L, d) : null
  const free = L ? isFree(L, d) : false
  const depositOk = L ? depositPlansAvailable(L) : false
  const plans: EnrollmentPlan[] = ["full", "deposit_balance", "installments"]
  const minDate = addDays(deadline, 1)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.moveTitle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {LIVE.changeIntake.cancel}
          </Button>
          <Button
            onClick={() => send()}
            disabled={!L || busy}
            aria-busy={busy}
            data-autofocus
          >
            {t.send}
          </Button>
        </>
      }
    >
      <p className="text-fs-15 leading-lh-relaxed text-fg-2">
        {t.moveLead(first)}
      </p>
      {!L ? (
        <p className="text-fs-14 text-fg-3" aria-busy="true">
          …
        </p>
      ) : free ? (
        <Notice tone="success" icon="checkcircle">
          {t.free}
        </Notice>
      ) : (
        <>
          <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0">
            <legend className="mb-1 text-fs-14 font-semibold text-fg-1">
              {t.plan}
            </legend>
            {plans.map((p) => {
              const disabled = p !== "full" && !depositOk
              return (
                <label
                  key={p}
                  className={cn(
                    "grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border border-border-2 p-3",
                    d.plan === p && "border-fg-1",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <input
                    type="radio"
                    name="enr-plan"
                    id={p === "full" ? "enr-plan" : undefined}
                    checked={d.plan === p}
                    disabled={disabled}
                    onChange={() => set({ plan: p })}
                    className="mt-1"
                  />
                  <span className="grid gap-0.5">
                    <b className="text-fs-14">{t.plans[p]}</b>
                    <small className="text-fs-13 text-fg-3">
                      {t.planHints[p]}
                    </small>
                  </span>
                </label>
              )
            })}
            {!depositOk ? (
              <p className="text-fs-13 text-fg-3">{t.planOnlyFull}</p>
            ) : null}
            {errors["enr-plan"] ? (
              <FieldError id="enr-plan-err">{errors["enr-plan"]}</FieldError>
            ) : null}
          </fieldset>

          {d.plan === "deposit_balance" ? (
            <FormField
              id="enr-balance-date"
              label={t.balanceDate}
              required
              error={errors["enr-balance-date"]}
            >
              {(p) => (
                <Input
                  {...p}
                  type="date"
                  min={minDate}
                  max={L.intakeEnd ?? undefined}
                  value={d.balanceDate}
                  onChange={(e) => set({ balanceDate: e.target.value })}
                />
              )}
            </FormField>
          ) : null}

          {d.plan === "installments" ? (
            <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0">
              <legend
                id="enr-inst"
                tabIndex={-1}
                className="mb-1 text-fs-14 font-semibold text-fg-1"
              >
                {t.installmentsTitle}
              </legend>
              {d.installments.map((r, i) => (
                <div
                  key={r.key}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2 le-480:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                >
                  <FormField
                    id={`enr-inst-${i}-amount`}
                    required
                    label={t.installmentAmount(i + 1)}
                    error={errors[`enr-inst-${i}-amount`]}
                  >
                    {(p) => (
                      <Input
                        {...p}
                        inputMode="decimal"
                        value={r.amount}
                        onChange={(e) =>
                          set({
                            installments: d.installments.map((x) =>
                              x.key === r.key
                                ? { ...x, amount: e.target.value }
                                : x
                            ),
                          })
                        }
                      />
                    )}
                  </FormField>
                  <FormField
                    id={`enr-inst-${i}-date`}
                    required
                    label={t.installmentDate(i + 1)}
                    error={errors[`enr-inst-${i}-date`]}
                  >
                    {(p) => (
                      <Input
                        {...p}
                        type="date"
                        min={minDate}
                        max={L.intakeEnd ?? undefined}
                        value={r.date}
                        onChange={(e) =>
                          set({
                            installments: d.installments.map((x) =>
                              x.key === r.key
                                ? { ...x, date: e.target.value }
                                : x
                            ),
                          })
                        }
                      />
                    )}
                  </FormField>
                  {d.installments.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-7 le-480:mt-0"
                      aria-label={`${t.remove} ${t.installmentAmount(i + 1)}`}
                      onClick={() =>
                        set({
                          installments: d.installments.filter(
                            (x) => x.key !== r.key
                          ),
                        })
                      }
                    >
                      <Icon name="x" size={14} />
                    </Button>
                  ) : null}
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {d.installments.length < 24 ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      set({
                        installments: [
                          ...d.installments,
                          { key: key(), amount: "", date: "" },
                        ],
                      })
                    }
                  >
                    <Icon name="plus" size={14} /> {t.addInstallment}
                  </Button>
                ) : (
                  <span />
                )}
                <small
                  className={cn(
                    "text-fs-13 font-semibold",
                    installmentsLeft(L, d) === 0
                      ? "text-fg-3"
                      : "text-gf-warning"
                  )}
                >
                  {installmentsLeft(L, d) < 0
                    ? t.over(money(-installmentsLeft(L, d)))
                    : t.left(money(installmentsLeft(L, d)))}
                </small>
              </div>
              {errors["enr-inst"] ? (
                <FieldError id="enr-inst-err">{errors["enr-inst"]}</FieldError>
              ) : null}
            </fieldset>
          ) : null}
        </>
      )}

      {L ? (
        <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0">
          <legend
            id="enr-extras"
            tabIndex={-1}
            className="mb-1 text-fs-14 font-semibold text-fg-1"
          >
            {t.extrasTitle}
          </legend>
          <p className="text-fs-13 text-fg-3">{t.extrasHint}</p>
          {d.extras.map((x, i) => (
            <div
              key={x.key}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] items-start gap-2 le-480:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
            >
              <FormField
                id={`enr-extra-${i}-label`}
                required
                label={t.extraLabel}
                error={errors[`enr-extra-${i}-label`]}
              >
                {(p) => (
                  <Input
                    {...p}
                    maxLength={100}
                    value={x.label}
                    onChange={(e) =>
                      set({
                        extras: d.extras.map((y) =>
                          y.key === x.key ? { ...y, label: e.target.value } : y
                        ),
                      })
                    }
                  />
                )}
              </FormField>
              <FormField
                id={`enr-extra-${i}-amount`}
                required
                label={`${t.extraAmount} (${L.currency})`}
                error={errors[`enr-extra-${i}-amount`]}
              >
                {(p) => (
                  <Input
                    {...p}
                    inputMode="decimal"
                    value={x.amount}
                    onChange={(e) =>
                      set({
                        extras: d.extras.map((y) =>
                          y.key === x.key ? { ...y, amount: e.target.value } : y
                        ),
                      })
                    }
                  />
                )}
              </FormField>
              <Button
                variant="ghost"
                size="sm"
                className="mt-7 le-480:mt-0"
                aria-label={`${t.remove} ${x.label || t.extraLabel}`}
                onClick={() =>
                  set({ extras: d.extras.filter((y) => y.key !== x.key) })
                }
              >
                <Icon name="x" size={14} />
              </Button>
            </div>
          ))}
          {d.extras.length < 10 ? (
            <Button
              variant="secondary"
              size="sm"
              className="justify-self-start"
              onClick={() =>
                set({
                  extras: [...d.extras, { key: key(), label: "", amount: "" }],
                })
              }
            >
              <Icon name="plus" size={14} /> {t.addExtra}
            </Button>
          ) : null}
          {errors["enr-extras"] ? (
            <FieldError id="enr-extras-err">{errors["enr-extras"]}</FieldError>
          ) : null}
        </fieldset>
      ) : null}

      {preview && !free ? (
        <div className="grid gap-2 rounded-md border border-border-2 bg-bg-2 p-3">
          <p className="text-fs-14 font-semibold text-fg-1">{t.preview}</p>
          <KvLines>
            {preview.lines.map((x, i) => (
              <Kv
                key={`${x.name}-${i}`}
                label={`${x.name} · ${
                  x.due === "now" ? t.dueNow : x.due ? DATES.fmt(x.due) : "…"
                }${x.required ? ` · ${t.confirmsPlace}` : ""}`}
              >
                {money(x.amount)}
              </Kv>
            ))}
            <Kv label={t.total} total>
              {money(preview.total)}
            </Kv>
          </KvLines>
        </div>
      ) : null}
    </Modal>
  )
}
