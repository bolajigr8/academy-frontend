import { AUTH } from "@/data/auth-copy"
import { cn } from "@/lib/utils"

/*
 * .amk-strength: css/amk-pages.css:382-388. Four bars; the first `score` are filled,
 * warning color up to 2, success from 3. The label stays blank until someone types.
 */
export function PasswordStrength({
  score,
  hasValue,
}: {
  score: number
  hasValue: boolean
}) {
  return (
    <div
      data-score={score}
      aria-live="polite"
      className="mt-2 flex min-h-4 items-center gap-[10px] text-fs-12 text-fg-2"
    >
      <span
        aria-hidden="true"
        className="grid grid-cols-[repeat(4,28px)] gap-1"
      >
        {[1, 2, 3, 4].map((n) => (
          <i
            key={n}
            className={cn(
              "h-[5px] rounded-[3px] bg-bg-4",
              score >= n && (score <= 2 ? "bg-gf-warning" : "bg-gf-success")
            )}
          />
        ))}
      </span>
      <span>{hasValue ? AUTH.register.strength[score] : "\u00a0"}</span>
    </div>
  )
}
