import { FieldError } from "./form-field"

type Option<T extends string> = { value: T; label: string; sub?: string }

type Props<T extends string> = {
  id: string
  name: string
  legend?: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  error?: string
}

/*
 * AmChoice (js/amk-core.jsx) + .amk-choice*: css/amk-core.css:185-196.
 * Radio inputs sit invisibly over a bordered box; the first one carries `${id}-first`
 * so the error summary can focus it.
 */
export function ChoiceGroup<T extends string>({
  id,
  name,
  legend,
  value,
  options,
  onChange,
  error,
}: Props<T>) {
  return (
    <fieldset
      id={id}
      aria-describedby={error ? `${id}-err` : undefined}
      className="m-0 grid min-w-0 gap-1.5 border-0 p-0"
    >
      {legend ? (
        <legend className="p-0 text-fs-14 font-semibold text-fg-1">
          {legend}
        </legend>
      ) : null}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-2">
        {options.map((o, i) => (
          <label className="relative" key={o.value}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              id={i === 0 ? `${id}-first` : undefined}
              onChange={() => onChange(o.value)}
              className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
            />
            <span className="grid h-full gap-0.5 rounded-sm border border-border-2 bg-surface-elevated px-[14px] py-3 [transition:border-color_var(--dur-base)_var(--ease-out),background_var(--dur-base)_var(--ease-out)] peer-checked:border-amk-accent-ink peer-checked:bg-tint-neon-2 peer-checked:shadow-[inset_0_0_0_1px_var(--amk-accent-ink)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amk-accent-ink">
              <b className="text-fs-14 text-fg-1">{o.label}</b>
              {o.sub ? (
                <small className="text-fs-13 text-fg-3">{o.sub}</small>
              ) : null}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={`${id}-err`}>{error}</FieldError>
    </fieldset>
  )
}
