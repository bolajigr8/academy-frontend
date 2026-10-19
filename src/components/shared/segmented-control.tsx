"use client"

import { motion } from "framer-motion"
import { useId, useRef, type KeyboardEvent } from "react"

import { Icon, type IconName } from "@/components/icons/icon"
import { spring } from "@/lib/motion"

type Tab<T extends string> = {
  value: T
  label: string
  count?: number
  icon?: IconName
}

type Props<T extends string> = {
  tabs: Tab<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}

/* AmSeg (js/amk-core.jsx) + .amk-seg*: css/amk-core.css:297-308. Arrow keys move between tabs. */
export function SegmentedControl<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: Props<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const pill = useId()

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    const i = tabs.findIndex((t) => t.value === value)
    const n =
      (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length
    onChange(tabs[n].value)
    ref.current?.querySelectorAll<HTMLElement>('[role="tab"]')[n]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      ref={ref}
      onKeyDown={onKey}
      className="flex max-w-full [scrollbar-width:none] gap-1 overflow-x-auto rounded-sm border border-border-1 bg-bg-3 p-1 [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((t) => (
        <motion.button
          key={t.value}
          whileTap={{ scale: 0.96, transition: spring }}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          tabIndex={value === t.value ? 0 : -1}
          onClick={() => onChange(t.value)}
          className="group relative inline-flex min-h-[38px] items-center gap-2 rounded-[6px] border-0 bg-transparent px-[14px] py-[7px] text-fs-14 font-semibold whitespace-nowrap text-fg-3 [transition:color_var(--dur-base)_var(--ease-out)] hover:text-fg-1 aria-selected:text-fg-1 [&>*:not([data-pill])]:relative"
        >
          {value === t.value ? (
            <motion.span
              data-pill=""
              layoutId={pill}
              transition={spring}
              aria-hidden="true"
              className="absolute inset-0 rounded-[6px] bg-surface-elevated shadow-(--shadow-xs)"
            />
          ) : null}
          {t.icon ? <Icon name={t.icon} size={16} /> : null}
          <span>{t.label}</span>
          {t.count != null ? (
            <span
              data-count=""
              className="min-w-[22px] rounded-[99px] bg-bg-4 px-[7px] py-px text-center font-mono text-[11px] font-bold text-fg-2 group-aria-selected:bg-gf-neon group-aria-selected:text-text-on-neon"
            >
              {t.count}
            </span>
          ) : null}
        </motion.button>
      ))}
    </div>
  )
}
