import type { ReactNode } from "react"

import { Icon } from "@/components/icons/icon"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/* AmErr + .amk-err: css/amk-core.css:160-162 */
export function FieldError({
  id,
  children,
}: {
  id?: string
  children?: ReactNode
}) {
  if (!children) return null
  return (
    <p
      id={id}
      className="flex items-start gap-1.5 text-fs-13 font-semibold text-fg-1"
    >
      <Icon
        name="alert"
        size={14}
        sw={2}
        className="mt-px flex-none text-gf-danger"
      />
      {children}
    </p>
  )
}

type ControlProps = {
  id: string
  "aria-describedby": string | undefined
  "aria-invalid": true | undefined
  "aria-required": true | undefined
}

type Props = {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  /** receives the id and ARIA wiring for the control */
  children: (control: ControlProps) => ReactNode
}

/* AmField + .amk-field / .amk-label / .amk-req / .amk-hint: css/amk-core.css:155-159 */
export function FormField({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: Props) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-err` : null]
      .filter(Boolean)
      .join(" ") || undefined
  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {!required && (
          <span className="ml-1 text-fs-12 font-medium text-fg-3">
            Optional
          </span>
        )}
      </Label>
      {hint ? (
        <p id={`${id}-hint`} className="text-fs-13 text-fg-3">
          {hint}
        </p>
      ) : null}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required ? true : undefined,
      })}
      <FieldError id={`${id}-err`}>{error}</FieldError>
    </div>
  )
}
