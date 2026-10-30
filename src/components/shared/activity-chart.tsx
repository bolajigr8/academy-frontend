"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useMedia } from "@/hooks/use-media"

type Row = {
  /** the full name (tooltip, screen readers) */
  label: string
  /** the name under the column; wraps onto two lines */
  short?: string
  value: number
}

/** A category name under its column, wrapped onto at most two lines */
function ColumnTick({
  x,
  y,
  payload,
  angled = false,
}: {
  x?: number
  y?: number
  payload?: { value: string }
  /** narrow screens: one line, angled, so neighbours never collide */
  angled?: boolean
}) {
  if (angled)
    return (
      <g transform={`translate(${x ?? 0},${y ?? 0})`}>
        <text
          x={0}
          y={0}
          dy={12}
          textAnchor="end"
          transform="rotate(-40)"
          fill="var(--fg-2)"
          fontSize={11}
        >
          {String(payload?.value ?? "")}
        </text>
      </g>
    )
  const words = String(payload?.value ?? "").split(" ")
  const lines =
    words.length > 1
      ? [
          words.slice(0, Math.ceil(words.length / 2)).join(" "),
          words.slice(Math.ceil(words.length / 2)).join(" "),
        ]
      : words
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={0}
          dy={14 + i * 14}
          textAnchor="middle"
          fill="var(--fg-2)"
          fontSize={12}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

/*
 * A column bar chart (Recharts): one bar per measure rising from a zero
 * baseline, a numbered axis with gridlines, the value on top of each bar and
 * the full name in the tooltip. Colours are the app's tokens, so it follows
 * the light and dark themes. The numbers are also in a visually hidden list
 * for screen readers.
 */
export function ActivityChart({
  label,
  rows,
  highlight,
}: {
  label: string
  rows: Row[]
  /** the bar drawn in the accent colour (by its full label) */
  highlight?: string
}) {
  // labels as text, so a zero still shows "0" (Recharts skips a 0 value)
  const data = rows.map((r) => ({
    ...r,
    name: r.short ?? r.label,
    text: r.value.toLocaleString("en-US"),
  }))
  const max = Math.max(1, ...rows.map((r) => r.value))
  const narrow = useMedia("(max-width: 520px)")
  return (
    <figure className="m-0 grid min-w-0 gap-2">
      <div
        aria-hidden="true"
        className="h-[300px] w-full min-w-0 le-480:h-[290px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 24, right: 8, bottom: 8, left: -12 }}
            barCategoryGap="22%"
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border-1)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="name"
              interval={0}
              height={narrow ? 72 : 44}
              tick={<ColumnTick angled={narrow} />}
              axisLine={{ stroke: "var(--border-2)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, Math.ceil(max * 1.15)]}
              tick={{ fill: "var(--fg-3)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ fill: "var(--tint-neon-1)" }}
              contentStyle={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-2)",
                borderRadius: 10,
                color: "var(--fg-1)",
                fontSize: 13,
              }}
              labelFormatter={(_, payload) =>
                String(payload?.[0]?.payload?.label ?? "")
              }
              labelStyle={{ color: "var(--fg-1)", fontWeight: 600 }}
              itemStyle={{ color: "var(--fg-2)" }}
              formatter={(v) => [Number(v).toLocaleString("en-US"), ""]}
              separator=""
            />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              maxBarSize={64}
              // a zero still gets a thin stub, so its "0" label shows
              minPointSize={3}
              isAnimationActive={false}
            >
              {data.map((r) => (
                <Cell
                  key={r.label}
                  fill={
                    r.label === highlight ? "var(--gf-neon)" : "var(--fg-3)"
                  }
                />
              ))}
              <LabelList
                dataKey="text"
                position="top"
                fill="var(--fg-1)"
                fontSize={13}
                fontWeight={700}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="am-sr">
        <ul aria-label={label}>
          {rows.map((r) => (
            <li key={r.label}>
              {r.label}: {r.value}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
