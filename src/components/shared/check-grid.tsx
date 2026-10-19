import { cn } from "@/lib/utils"

type Option = { value: string; label: string }

/* .amk-checkgrid: tiles of native checkboxes, the chosen ones outlined (css/amk-app.css:372-375) */
export function CheckGrid({
  options,
  value,
  onChange,
  className,
}: {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(min(210px,100%),1fr))] gap-2",
        className
      )}
    >
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-center gap-[10px] rounded-sm border border-border-2 px-3 py-[10px] text-fs-14 has-checked:border-fg-1 has-checked:bg-tint-neon-1"
        >
          <input
            type="checkbox"
            className="m-0 size-[18px] accent-gf-neon"
            checked={value.includes(o.value)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? value.concat(o.value)
                  : value.filter((x) => x !== o.value)
              )
            }
          />
          {o.label}
        </label>
      ))}
    </div>
  )
}
