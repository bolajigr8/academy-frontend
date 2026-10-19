import type { ReactNode } from "react"

import { Icon, type IconName } from "@/components/icons/icon"

/* .amk-doclist: css/amk-app.css:264-269 */
export function DocList({ children }: { children: ReactNode }) {
  return <ul className="grid gap-2">{children}</ul>
}

type ItemProps = {
  /** a square icon tile, or any leading element (an avatar) */
  icon?: IconName
  lead?: ReactNode
  title: string
  sub: string
  trailing?: ReactNode
}

export function DocItem({ icon, lead, title, sub, trailing }: ItemProps) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[10px] rounded-sm border border-border-1 px-3 py-[10px] text-fs-14 le-480:grid-cols-[auto_minmax(0,1fr)]">
      {icon ? (
        <span
          aria-hidden="true"
          className="grid size-[34px] place-items-center rounded-[8px] bg-bg-3"
        >
          <Icon name={icon} size={16} />
        </span>
      ) : (
        lead
      )}
      <span className="grid min-w-0">
        <b>{title}</b>
        <small className="text-fs-12 [overflow-wrap:anywhere] text-fg-3">
          {sub}
        </small>
      </span>
      {/* Added for small phones (<=480px): the row's actions move to their own
          line under the name, so the name is not squeezed to a few letters */}
      {trailing ? (
        <span className="justify-self-end le-480:col-start-2 le-480:justify-self-start le-480:[&>*]:justify-start">
          {trailing}
        </span>
      ) : (
        <span className="le-480:hidden" />
      )}
    </li>
  )
}
