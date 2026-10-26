import { cn } from "@/lib/utils"

/*
 * A horizontal bar chart from real numbers (no invented series): each bar is
 * its share of the largest value, with the number at its end. Screen readers
 * read it as a list of "label: value".
 */
export function BarChart({
  label,
  rows,
  highlight,
}: {
  label: string
  rows: { label: string; value: number }[]
  /** the bar drawn in the accent colour */
  highlight?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul aria-label={label} className="grid gap-2.5">
      {rows.map((r) => (
        <li
          key={r.label}
          className="grid grid-cols-[minmax(110px,180px)_minmax(0,1fr)_auto] items-center gap-3 text-fs-13 le-480:grid-cols-[minmax(0,1fr)_auto] le-480:[&>span:nth-child(2)]:col-span-2 le-480:[&>span:nth-child(2)]:row-start-2"
        >
          <span className="truncate text-fg-2">{r.label}</span>
          <span className="h-3 overflow-hidden rounded-pill bg-bg-3">
            <span
              aria-hidden="true"
              className={cn(
                "block h-full rounded-pill bg-fg-3",
                r.label === highlight && "bg-gf-neon"
              )}
              style={{
                width: `${Math.max(r.value ? 2 : 0, (r.value / max) * 100)}%`,
              }}
            />
          </span>
          <b className="text-right font-mono tabular-nums">
            {r.value.toLocaleString("en-US")}
          </b>
        </li>
      ))}
    </ul>
  )
}
