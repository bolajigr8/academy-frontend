"use client"

import { motion } from "framer-motion"

import { Icon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { easeOut } from "@/lib/motion"

type Props = {
  id: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  addLabel: string
}

/* New rows slide in. Rows are keyed by position, as in the prototype.
   ListEditor (host/listing-edit.html) + .amk-rows-edit: editable rows with a remove button and an add button */
export function ListEditor({
  id,
  items,
  onChange,
  placeholder,
  addLabel,
}: Props) {
  return (
    <div className="grid gap-1.5">
      <ul className="grid gap-2">
        {items.map((it, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: easeOut }}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
          >
            <label className="am-sr" htmlFor={`${id}-${i}`}>
              {placeholder} {i + 1}
            </label>
            <Input
              id={`${id}-${i}`}
              value={it}
              placeholder={placeholder}
              onChange={(e) =>
                onChange(items.map((x, j) => (j === i ? e.target.value : x)))
              }
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${it || "row"}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <Icon name="trash" size={16} />
            </Button>
          </motion.li>
        ))}
      </ul>
      <Button
        variant="secondary"
        size="sm"
        className="justify-self-start"
        onClick={() => onChange(items.concat(""))}
      >
        <Icon name="plus" size={15} /> {addLabel}
      </Button>
    </div>
  )
}
