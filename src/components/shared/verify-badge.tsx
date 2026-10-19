import { Icon } from "@/components/icons/icon"
import { VERIFICATION } from "@/data/catalog"
import type { Verification } from "@/data/types"
import { cn } from "@/lib/utils"

/* AmVerify (js/amk-core.jsx) + .amk-verify*: css/amk-core.css:225-230 */
export function VerifyBadge({
  v,
  compact = false,
}: {
  v: Verification
  compact?: boolean
}) {
  const meta = VERIFICATION[v]
  if (!meta) return null
  return (
    <span
      title={meta.text}
      className={cn(
        "inline-flex items-center gap-1.5 justify-self-start text-fs-13 font-bold whitespace-nowrap text-fg-1 [&_svg]:flex-none [&_svg]:text-amk-accent-ink",
        v === "club" &&
          "rounded-pill bg-gf-neon py-[3px] pr-[10px] pl-[6px] text-text-on-neon [&_svg]:text-text-on-neon",
        v === "pending" &&
          "rounded-pill border border-dashed border-border-3 py-[3px] pr-[10px] pl-[6px] font-semibold text-fg-2 [&_svg]:text-fg-3"
      )}
    >
      <Icon name={v === "pending" ? "clock" : "shieldcheck"} size={15} sw={2} />
      {compact ? meta.short : meta.label}
    </span>
  )
}
