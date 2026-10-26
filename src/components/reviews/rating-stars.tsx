"use client"

import { Icon } from "@/components/icons/icon"
import { REVIEWS } from "@/data/week3-copy"
import { cn } from "@/lib/utils"

/** Five stars showing a rating (the average is shown with one decimal beside it) */
export function StarsRow({
  value,
  size = 16,
  label,
}: {
  value: number
  size?: number
  label?: string
}) {
  const full = Math.round(value)
  return (
    <span
      role="img"
      aria-label={label ?? `${value.toFixed(1)} out of 5`}
      className="inline-flex items-center gap-0.5 text-fg-1"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={size}
          filled={n <= full}
          className={n <= full ? "text-fg-1" : "text-fg-4"}
        />
      ))}
    </span>
  )
}

/** One rating, 1 to 5: five real radio buttons drawn as stars */
export function RatingPicker({
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
      className="m-0 grid min-w-0 gap-1 border-0 p-0"
      aria-describedby={error ? `${id}-err` : undefined}
    >
      <legend className="p-0 text-fs-14 font-semibold text-fg-1">
        {label}
      </legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="relative grid size-10 cursor-pointer place-items-center rounded-md hover:bg-tint-neon-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg-1"
          >
            <input
              type="radio"
              name={id}
              id={n === 1 ? id : undefined}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              aria-label={REVIEWS.rateLabel(label).replace(
                "1 to 5",
                REVIEWS.star(n)
              )}
              className="am-sr"
            />
            <Icon
              name="star"
              size={26}
              filled={n <= value}
              className={cn(n <= value ? "text-fg-1" : "text-fg-4")}
            />
          </label>
        ))}
        <span
          className="ml-2 font-mono text-fs-13 text-fg-3"
          aria-hidden="true"
        >
          {value ? `${value}/5` : ""}
        </span>
      </div>
      {error ? (
        <p id={`${id}-err`} className="text-fs-13 font-semibold text-fg-1">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
