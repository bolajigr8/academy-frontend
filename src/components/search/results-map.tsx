"use client"

import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { useMemo } from "react"

import { Icon } from "@/components/icons/icon"
import { ClubCrest } from "@/components/shared/club-crest"
import { SafeImage } from "@/components/shared/safe-image"
import { SEARCH } from "@/data/search-copy"
import { HEIGHT, WIDTH, landDots, project } from "@/features/academies/map"
import { ageLabel, feeLabel, fmtEuro } from "@/features/academies/search"
import type { EnrichedListing } from "@/features/academies/types"
import { easeOut, pressIcon } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

/* Land dots never change: computed once, on first use. */
let dotsCache: number[][] | null = null
function getDots(): number[][] {
  if (!dotsCache) dotsCache = landDots(6)
  return dotsCache
}

type Props = {
  listings: EnrichedListing[]
  /** academy highlighted while a card is hovered */
  activeAcademy: string | null
  selected: string | null
  onSelect: (academyId: string | null) => void
}

/* AmMap + .amk-map*, .amk-pin*: js/amk-search.jsx, css/amk-pages.css:99-139. One pin per academy. */
export function ResultsMap({
  listings,
  activeAcademy,
  selected,
  onSelect,
}: Props) {
  const dots = getDots()
  const groups = useMemo(() => {
    const g: Record<
      string,
      {
        academy: EnrichedListing["academy"]
        crest: EnrichedListing["crest"]
        club: boolean
        items: EnrichedListing[]
      }
    > = {}
    listings.forEach((l) => {
      const k = l.academy.id
      if (!g[k])
        g[k] = {
          academy: l.academy,
          crest: l.crest,
          club: l.verification === "club",
          items: [],
        }
      g[k].items.push(l)
    })
    return Object.values(g)
  }, [listings])
  const sel = groups.find((g) => g.academy.id === selected)
  const t = SEARCH

  return (
    <div
      role="region"
      aria-label={t.mapRegion}
      className="relative grid gap-[10px]"
    >
      <div
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        className="relative w-full overflow-hidden rounded-lg border border-border-2 bg-bg-2"
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          aria-hidden="true"
          focusable="false"
          className="absolute inset-0 h-full w-full fill-border-3"
        >
          {dots.map((d, i) => (
            <circle key={i} cx={d[0]} cy={d[1]} r="1.35" />
          ))}
        </svg>
        {groups.map((g) => {
          const p = project(g.academy.lng, g.academy.lat)
          const from = Math.min(...g.items.map((l) => l.monthly))
          const on = activeAcademy === g.academy.id || selected === g.academy.id
          const n = g.items.length
          return (
            <motion.button
              whileTap={pressIcon.whileTap}
              key={g.academy.id}
              type="button"
              aria-pressed={selected === g.academy.id}
              aria-label={`${g.academy.name}, ${g.academy.city}. ${n}${n > 1 ? " programs" : " program"} ${t.from} ${fmtEuro(from)} ${t.perMonthText}`}
              onClick={() =>
                onSelect(selected === g.academy.id ? null : g.academy.id)
              }
              style={{
                left: `${(p.x / WIDTH) * 100}%`,
                top: `${(p.y / HEIGHT) * 100}%`,
              }}
              className={cn(
                "group absolute z-[1] -translate-x-1/2 -translate-y-full border-0 bg-transparent p-0 hover:z-[3]",
                on && "is-on z-[3]"
              )}
            >
              <span className="relative inline-flex items-center gap-1 rounded-[99px] border border-border-3 bg-surface-elevated px-[9px] py-[5px] font-mono text-[12px] font-bold whitespace-nowrap text-fg-1 shadow-(--shadow-md) [transition:transform_var(--dur-fast)_var(--ease-out),background_var(--dur-base)] group-hover:scale-[1.08] group-hover:border-gf-black group-hover:bg-gf-neon group-hover:text-text-on-neon group-[.is-on]:scale-[1.08] group-[.is-on]:border-gf-black group-[.is-on]:bg-gf-neon group-[.is-on]:text-text-on-neon after:absolute after:-bottom-1.5 after:left-1/2 after:size-[10px] after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:border-border-3 after:bg-inherit after:content-['']">
                {fmtEuro(from)}
                {n > 1 ? (
                  <em className="font-semibold text-fg-3 not-italic group-hover:text-text-on-neon group-[.is-on]:text-text-on-neon">
                    +{n - 1}
                  </em>
                ) : null}
              </span>
            </motion.button>
          )
        })}
      </div>
      <AnimatePresence>
        {sel ? (
          <motion.div
            key={sel.academy.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="absolute right-3 bottom-11 left-3 z-[4] grid gap-2 rounded-md border border-border-2 bg-surface-elevated p-3 shadow-(--shadow-lg)"
          >
            <div className="flex items-center gap-[10px]">
              <ClubCrest crest={sel.crest} size={34} club={sel.club} />
              <div className="grid min-w-0 flex-1">
                <b>{sel.academy.name}</b>
                <small className="text-fs-12 text-fg-3">
                  {sel.academy.city} · {sel.items.length}{" "}
                  {sel.items.length > 1 ? "programs" : "program"}
                </small>
              </div>
              <button
                type="button"
                onClick={() => onSelect(null)}
                aria-label={t.close}
                className="grid size-10 place-items-center rounded-full border border-border-2 bg-transparent p-0 text-fg-2 hover:border-border-3 hover:text-fg-1"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <ul className="grid gap-1.5">
              {sel.items.map((l) => (
                <li key={l.id}>
                  <Link
                    href={routes.academy(l.id)}
                    className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-[10px] rounded-[8px] p-1.5 hover:bg-tint-neon-2"
                  >
                    <span className="relative block h-12 w-16 overflow-hidden rounded-[6px]">
                      <SafeImage
                        src={l.image}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </span>
                    <span className="grid min-w-0">
                      <b className="truncate text-fs-14">{l.title}</b>
                      <small className="text-fs-12 text-fg-3">
                        {ageLabel(l)} · {feeLabel(l)}
                      </small>
                    </span>
                    <Icon name="chevr" size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <p className="flex items-center gap-1.5 text-fs-12 text-fg-3">
        <Icon name="info" size={14} />
        {t.mapNote}
      </p>
    </div>
  )
}
