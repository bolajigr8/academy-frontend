"use client"

import { Icon } from "@/components/icons/icon"
import { LIVE } from "@/data/live-copy"
import { cn } from "@/lib/utils"

const t = LIVE.reviews

/** Read-only stars for a rating (rounded to the nearest whole star), with the number for screen readers */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const whole = Math.round(value)
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${value} / 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={size}
          aria-hidden="true"
          className={cn(
            n <= whole ? "fill-current text-amk-accent-ink" : "text-fg-4"
          )}
        />
      ))}
    </span>
  )
}

/*
 * A 1-to-5 rating input: a radio group drawn as stars (arrow keys move,
 * each star is named "3 stars"). Week 3 part 2, section 10: whole numbers.
 */
export function StarInput({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  error?: string
}) {
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-describedby={error ? `${id}-err` : undefined}
      className="m-0 grid min-w-0 gap-1 border-0 p-0"
    >
      <legend className="mb-1 p-0 text-fs-14 font-semibold text-fg-1">
        {label}
      </legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="grid size-10 cursor-pointer place-items-center rounded-full has-focus-visible:outline-2 has-focus-visible:outline-amk-accent-ink"
          >
            <input
              type="radio"
              name={id}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="am-sr"
            />
            <span className="am-sr">{t.stars(n)}</span>
            <Icon
              name="star"
              size={26}
              aria-hidden="true"
              className={cn(
                "[transition:color_var(--dur-fast)]",
                n <= value ? "fill-current text-amk-accent-ink" : "text-fg-4"
              )}
            />
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${id}-err`} className="text-fs-13 font-semibold text-gf-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
