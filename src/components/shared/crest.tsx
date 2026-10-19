import { brand } from "@/data/brand"
import { cn } from "@/lib/utils"

type Props = {
  /** Height in px. Omit inside <Logo>, where --amk-logo-h sets the height. */
  size?: number
  title?: string
  className?: string
}

/* AmCrest (js/amk-core.jsx) + .amk-crest__* (css/amk-core.css:249-252) */
export function Crest({ size, title, className }: Props) {
  const c = brand.crest
  return (
    <svg
      className={cn(
        "h-(--amk-logo-h) w-auto flex-none drop-shadow-[0_2px_6px_var(--overlay-soft)]",
        className
      )}
      viewBox={c.viewBox}
      style={size ? { height: size } : undefined}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <path
        d={c.outer}
        className="fill-gf-black stroke-gf-neon stroke-3 [stroke-linejoin:round]"
      />
      <path
        d={c.inner}
        className="fill-none stroke-gf-neon stroke-1 [stroke-linejoin:round] [stroke-opacity:0.45]"
      />
      <g className="fill-gf-neon" transform={c.markTransform}>
        {brand.mark.paths.map((d) => (
          <path key={d} d={d} fillRule="evenodd" />
        ))}
      </g>
      <path
        d={c.band}
        className="stroke-gf-neon stroke-[1.6] [stroke-linecap:round]"
      />
    </svg>
  )
}
