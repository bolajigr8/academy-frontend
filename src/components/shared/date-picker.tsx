"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { Icon } from "@/components/icons/icon"
import { fieldControl } from "@/components/ui/input"
import { useHydrated } from "@/hooks/use-hydrated"
import { MONTHS, formatDate, parseDate, toISODate } from "@/lib/date"
import { cn } from "@/lib/utils"

type Props = {
  /** ISO 'YYYY-MM-DD' or '' */
  value: string
  onChange: (iso: string) => void
  /** earliest selectable day (ISO, inclusive) */
  min?: string
  /** latest selectable day (ISO, inclusive) */
  max?: string
  placeholder?: string
  disabled?: boolean
  /** Months shown side by side. 2 collapses to 1 below 640px. */
  months?: 1 | 2
  id?: string
  name?: string
  "aria-describedby"?: string
  /** shown as the error border (a button cannot carry aria-invalid) */
  "aria-invalid"?: boolean
}

const MONTH_SHORT = MONTHS.map((m) => m.slice(0, 3))
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

/* One month grid, and the padding and gap the panel adds around them. */
const MONTH_WIDTH = 256
const PANEL_GAP = 16
const PANEL_PADDING = 24
const TWO_MONTH_MIN_VIEWPORT = 640
const POPOVER_EST_HEIGHT = 360

const popoverWidth = (months: number) =>
  months * MONTH_WIDTH + (months - 1) * PANEL_GAP + PANEL_PADDING

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()
const dayKey = (d: Date) =>
  d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate()
const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth()
const addMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1)

type PanelView = "days" | "months" | "years"

const navButton =
  "grid size-7 place-items-center rounded-full text-fg-3 hover:bg-bg-3 hover:text-fg-1 disabled:cursor-not-allowed disabled:opacity-30"
const headButton =
  "rounded-sm px-2 py-1 font-mono text-fs-12 font-bold hover:bg-tint-neon-1"
const pickCell =
  "rounded-sm py-2 font-mono text-[11px] font-bold transition-colors"
const selectedCell =
  "bg-primary text-primary-foreground shadow-(--glow-neon-sm)"

/**
 * Drop-in replacement for <input type="date"> (ported from matchday).
 * value / onChange are ISO 'YYYY-MM-DD' strings. The panel is portaled to
 * <body> and positioned in pixels from the trigger's bounding box, so no
 * ancestor stacking context can cover it. It always uses the floating-surface
 * tokens, so it is correct in both themes.
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Select a date",
  disabled = false,
  months = 1,
  id,
  name,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: Props) {
  const selected = parseDate(value)
  const minDate = parseDate(min)
  const maxDate = parseDate(max)
  const mounted = useHydrated()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<PanelView>("days")
  const [cursor, setCursor] = useState<Date>(
    () => selected ?? minDate ?? new Date()
  )
  const [decadeStart, setDecadeStart] = useState(
    () =>
      Math.floor((selected ?? minDate ?? new Date()).getFullYear() / 12) * 12
  )
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  )
  const [effectiveMonths, setEffectiveMonths] = useState<1 | 2>(1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  function measure() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const visible: 1 | 2 =
      months === 2 && window.innerWidth >= TWO_MONTH_MIN_VIEWPORT ? 2 : 1
    setEffectiveMonths(visible)
    const width = popoverWidth(visible)
    let left = rect.left
    let top = rect.bottom + 8
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8)
    }
    if (top + POPOVER_EST_HEIGHT > window.innerHeight - 8) {
      top = Math.max(8, rect.top - POPOVER_EST_HEIGHT - 8)
    }
    setCoords({ top, left })
  }

  function close() {
    setOpen(false)
    setView("days")
  }

  function toggle() {
    if (open) {
      close()
      return
    }
    const base = selected ?? minDate ?? new Date()
    setCursor(base)
    setDecadeStart(Math.floor(base.getFullYear() / 12) * 12)
    setView("days")
    measure()
    setOpen(true)
  }

  /* keep the panel attached on scroll and resize; close on outside press or Escape */
  useEffect(() => {
    if (!open) return undefined
    const reposition = () => measure()
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        close()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close()
        triggerRef.current?.focus()
      }
    }
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
    // measure and close only read refs and props; they are re-created each render by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, months])

  const isDisabledDay = (d: Date) =>
    (minDate !== null && dayKey(d) < dayKey(minDate)) ||
    (maxDate !== null && dayKey(d) > dayKey(maxDate))

  function selectDay(d: Date) {
    if (isDisabledDay(d)) return
    onChange(toISODate(d))
    close()
  }

  function gridDays(month: Date) {
    const year = month.getFullYear()
    const m = month.getMonth()
    const startOffset = new Date(year, m, 1).getDay()
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(year, m, 1 - startOffset + i)
      return { date, inMonth: date.getMonth() === m }
    })
  }

  /* Stepping is always one month, even with two panels on screen. */
  const visibleMonths = Array.from({ length: effectiveMonths }, (_, i) =>
    addMonths(cursor, i)
  )
  const canGoPrev =
    !minDate || monthIndex(visibleMonths[0]) > monthIndex(minDate)
  const canGoNext =
    !maxDate ||
    monthIndex(visibleMonths[visibleMonths.length - 1]) < monthIndex(maxDate)
  const today = new Date()

  const panel = open && coords && (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Choose a date"
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: popoverWidth(effectiveMonths),
      }}
      className="z-(--amk-z-overlay) rounded-lg border border-border-2 bg-surface-elevated p-3 text-fg-1 shadow-(--shadow-xl)"
    >
      {view === "days" && (
        <div className="flex" style={{ gap: PANEL_GAP }}>
          {visibleMonths.map((month, i) => (
            <div key={monthIndex(month)} style={{ width: MONTH_WIDTH }}>
              <div className="mb-2 flex items-center justify-between">
                {i === 0 ? (
                  <button
                    type="button"
                    disabled={!canGoPrev}
                    onClick={() => setCursor(addMonths(cursor, -1))}
                    className={navButton}
                    aria-label="Previous month"
                  >
                    <Icon name="chevl" size={14} />
                  </button>
                ) : (
                  <span aria-hidden="true" className="size-7" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCursor(month)
                    setView("months")
                  }}
                  className={headButton}
                >
                  {MONTHS[month.getMonth()]} {month.getFullYear()}
                </button>
                {i === visibleMonths.length - 1 ? (
                  <button
                    type="button"
                    disabled={!canGoNext}
                    onClick={() => setCursor(addMonths(cursor, 1))}
                    className={navButton}
                    aria-label="Next month"
                  >
                    <Icon name="chevr" size={14} />
                  </button>
                ) : (
                  <span aria-hidden="true" className="size-7" />
                )}
              </div>
              <div className="grid grid-cols-7 gap-1 pb-1">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    className="grid h-6 place-items-center font-mono text-[9px] text-fg-4"
                  >
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {gridDays(month).map(({ date, inMonth }) => {
                  const isSel = selected !== null && sameDay(date, selected)
                  const off = isDisabledDay(date)
                  return (
                    <button
                      key={dayKey(date)}
                      type="button"
                      disabled={off}
                      aria-label={formatDate(toISODate(date))}
                      aria-pressed={isSel}
                      onClick={() => selectDay(date)}
                      className={cn(
                        "grid h-7 place-items-center rounded-full font-mono text-[11px] transition-colors",
                        !inMonth && "opacity-30",
                        off && "cursor-not-allowed opacity-20",
                        !off && !isSel && "hover:bg-accent",
                        isSel && cn(selectedCell, "font-bold"),
                        !isSel &&
                          sameDay(date, today) &&
                          "ring-1 ring-amk-accent-ink/50"
                      )}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* The month and year pickers stay one panel wide and centred. */}
      {view === "months" && (
        <div className="mx-auto" style={{ maxWidth: MONTH_WIDTH }}>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous year"
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear() - 1, cursor.getMonth(), 1)
                )
              }
              className={navButton}
            >
              <Icon name="chevl" size={14} />
            </button>
            <button
              type="button"
              onClick={() => setView("years")}
              className={headButton}
            >
              {cursor.getFullYear()}
            </button>
            <button
              type="button"
              aria-label="Next year"
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear() + 1, cursor.getMonth(), 1)
                )
              }
              className={navButton}
            >
              <Icon name="chevr" size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_SHORT.map((m, i) => {
              const isSel =
                selected !== null &&
                selected.getFullYear() === cursor.getFullYear() &&
                selected.getMonth() === i
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setCursor(new Date(cursor.getFullYear(), i, 1))
                    setView("days")
                  }}
                  className={cn(
                    pickCell,
                    isSel ? selectedCell : "hover:bg-accent"
                  )}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {view === "years" && (
        <div className="mx-auto" style={{ maxWidth: MONTH_WIDTH }}>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Earlier years"
              onClick={() => setDecadeStart((d) => d - 12)}
              className={navButton}
            >
              <Icon name="chevl" size={14} />
            </button>
            <span className="font-mono text-fs-12 font-bold">
              {decadeStart} – {decadeStart + 11}
            </span>
            <button
              type="button"
              aria-label="Later years"
              onClick={() => setDecadeStart((d) => d + 12)}
              className={navButton}
            >
              <Icon name="chevr" size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => decadeStart + i).map((y) => {
              const isSel = selected !== null && selected.getFullYear() === y
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setCursor(new Date(y, cursor.getMonth(), 1))
                    setView("months")
                  }}
                  className={cn(
                    pickCell,
                    isSel ? selectedCell : "hover:bg-accent"
                  )}
                >
                  {y}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-border-1 pt-2">
        <button
          type="button"
          onClick={() => selectDay(new Date())}
          className="font-mono text-[10px] font-bold text-amk-accent-ink hover:underline"
        >
          Today
        </button>
        {selected ? (
          <button
            type="button"
            onClick={() => {
              onChange("")
              close()
            }}
            className="font-mono text-[10px] text-fg-4 hover:text-fg-1"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  )

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        onClick={toggle}
        className={cn(
          fieldControl,
          "flex items-center gap-2 text-left text-fs-14 font-medium disabled:cursor-not-allowed disabled:opacity-50",
          invalid && "border-gf-danger"
        )}
      >
        <Icon name="calendar" size={16} className="shrink-0 text-fg-3" />
        <span className={cn("truncate", !selected && "text-fg-4")}>
          {selected ? formatDate(value) : placeholder}
        </span>
      </button>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  )
}
