import { Icon, type IconName } from "@/components/icons/icon"

/* .amk-list-check: css/amk-core.css:439-441 */
export function CheckList({
  items,
  icon = "check",
}: {
  items: { text: string; icon?: IconName; sw?: number }[]
  icon?: IconName
}) {
  return (
    <ul className="grid gap-[10px]">
      {items.map((i) => (
        <li
          key={i.text}
          className="flex items-start gap-[10px] text-fs-14 text-fg-2"
        >
          <Icon
            name={i.icon ?? icon}
            size={16}
            sw={i.sw ?? 2.2}
            className="mt-0.5 flex-none text-amk-accent-ink"
          />
          {i.text}
        </li>
      ))}
    </ul>
  )
}
