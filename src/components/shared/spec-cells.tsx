/* .amk-cells: css/amk-app.css:286-289. Label/value cells separated by 1px lines. */
export function SpecCells({
  items,
  className,
}: {
  items: { label: string; value: string }[]
  className?: string
}) {
  return (
    <dl
      className={`grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-px overflow-hidden rounded-md border border-border-1 bg-border-1 ${className ?? ""}`}
    >
      {items.map((i) => (
        <div
          key={i.label}
          className="grid gap-1 bg-surface-elevated px-4 py-[14px]"
        >
          <dt className="font-mono text-[11px] tracking-gf-wide text-fg-3 uppercase">
            {i.label}
          </dt>
          <dd className="text-fs-14 font-semibold">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}
