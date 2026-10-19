import type { ReactNode } from "react"

type Props = {
  title: string
  sub?: string
  action?: ReactNode
  /** id for aria-labelledby on the surrounding section */
  id?: string
}

/* AmSectionHead + .amk-shead + .amk-h4: js/amk-shell.jsx, css/amk-app.css:110 and css/amk-core.css:91 */
export function SectionHead({ title, sub, action, id }: Props) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2
          id={id}
          className="font-display text-fs-18 leading-lh-snug font-bold text-fg-1"
        >
          {title}
        </h2>
        {sub ? <p className="text-fs-14 text-fg-3">{sub}</p> : null}
      </div>
      {action}
    </div>
  )
}
