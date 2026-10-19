"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { Icon, type IconName } from "@/components/icons/icon"
import { DisplayHeading } from "@/components/shared/display-heading"
import { Eyebrow } from "@/components/shared/eyebrow"
import { Reveal } from "@/components/shared/reveal"
import { Section, SectionHeader } from "@/components/shared/section"
import { ButtonLink } from "@/components/ui/button-link"
import { TYPES } from "@/data/catalog"
import { HOME } from "@/data/home-copy"
import { typeWord } from "@/features/academies/live-search"
import { useHome } from "@/features/home/hooks"
import { useLiveHome } from "@/features/home/live-hooks"
import { isLive } from "@/lib/data-source"
import { inView, lift } from "@/lib/motion"
import { routes } from "@/routes"

const MotionLink = motion.create(Link)

/* AmTypeTiles + .amk-types/.amk-type*: js/amk-ui.jsx:280, css/amk.css:145-155 */
export function TypeTiles() {
  return isLive("discovery") ? <LiveTypeTiles /> : <DemoTypeTiles />
}

function DemoTypeTiles() {
  const { counts } = useHome()
  const t = HOME.types
  return (
    <Section aria-labelledby="amk-types-title">
      <Reveal className="am-container">
        <SectionHeader
          action={
            <ButtonLink href={routes.academies()} variant="secondary">
              {t.all} <Icon name="arrow" size={16} />
            </ButtonLink>
          }
        >
          <Eyebrow className="mb-3">{t.eyebrow}</Eyebrow>
          <DisplayHeading id="amk-types-title">{t.title}</DisplayHeading>
        </SectionHeader>
        <ul className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-[14px] le-1180:grid-cols-[repeat(3,minmax(0,1fr))] le-720:grid-cols-[repeat(2,minmax(0,1fr))] le-480:grid-cols-[1fr]">
          {TYPES.map((x, i) => {
            const n = counts[x.id] ?? 0
            return (
              <motion.li {...inView(i)} key={x.id}>
                <MotionLink
                  {...lift(-4)}
                  href={routes.academies({ type: x.id })}
                  className="group relative flex h-full flex-col gap-2 overflow-hidden rounded-lg border border-border-1 bg-surface-elevated px-5 pt-[22px] pb-[18px] [transition:border-color_var(--dur-base)_var(--ease-out),box-shadow_var(--dur-base)] hover:border-border-accent hover:shadow-(--shadow-md)"
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-3 font-display text-[64px] leading-none font-bold text-transparent [-webkit-text-stroke:1px_var(--amk-line)]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mb-1.5 grid size-11 place-items-center rounded-[12px] bg-fg-1 text-bg-0 group-hover:bg-gf-neon group-hover:text-text-on-neon"
                  >
                    <Icon name={x.icon as IconName} size={22} />
                  </span>
                  <b className="font-display text-fs-16 leading-lh-snug">
                    {x.label}
                  </b>
                  <small className="flex-1 text-fs-13 leading-[1.45] text-fg-3">
                    {x.blurb}
                  </small>
                  <span className="mt-2 flex items-center justify-between border-t border-border-1 pt-3 font-mono text-fs-12 font-bold text-fg-2">
                    {n} {n === 1 ? t.program : t.programs}
                    <Icon name="arrow" size={14} />
                  </span>
                </MotionLink>
              </motion.li>
            )
          })}
        </ul>
      </Reveal>
    </Section>
  )
}

/*
 * api mode: one tile per academy type from GET /search/filters, with the
 * prototype's icon and blurb where the value matches and a count from
 * GET /search?academy_type=… (meta.total). Links use the contract's names.
 */
function LiveTypeTiles() {
  const { filters, typeCounts } = useLiveHome()
  const t = HOME.types
  const types = filters?.academy_types ?? []
  if (!types.length) return null
  return (
    <Section aria-labelledby="amk-types-title">
      <Reveal className="am-container">
        <SectionHeader
          action={
            <ButtonLink href={routes.academies()} variant="secondary">
              {t.all} <Icon name="arrow" size={16} />
            </ButtonLink>
          }
        >
          <Eyebrow className="mb-3">{t.eyebrow}</Eyebrow>
          <DisplayHeading id="amk-types-title">{t.title}</DisplayHeading>
        </SectionHeader>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-[14px]">
          {types.map((id, i) => {
            const known = TYPES.find((x) => x.id === id)
            const n = typeCounts[id]
            return (
              <motion.li {...inView(i)} key={id}>
                <MotionLink
                  {...lift(-4)}
                  href={`${routes.academies()}?academy_type=${encodeURIComponent(id)}`}
                  className="group relative flex h-full flex-col gap-2 overflow-hidden rounded-lg border border-border-1 bg-surface-elevated px-5 pt-[22px] pb-[18px] [transition:border-color_var(--dur-base)_var(--ease-out),box-shadow_var(--dur-base)] hover:border-border-accent hover:shadow-(--shadow-md)"
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-3 font-display text-[64px] leading-none font-bold text-transparent [-webkit-text-stroke:1px_var(--amk-line)]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mb-1.5 grid size-11 place-items-center rounded-[12px] bg-fg-1 text-bg-0 group-hover:bg-gf-neon group-hover:text-text-on-neon"
                  >
                    <Icon
                      name={(known?.icon as IconName | undefined) ?? "ball"}
                      size={22}
                    />
                  </span>
                  <b className="font-display text-fs-16 leading-lh-snug">
                    {typeWord(id)}
                  </b>
                  {known ? (
                    <small className="flex-1 text-fs-13 leading-[1.45] text-fg-3">
                      {known.blurb}
                    </small>
                  ) : (
                    <span className="flex-1" />
                  )}
                  <span className="mt-2 flex items-center justify-between border-t border-border-1 pt-3 font-mono text-fs-12 font-bold text-fg-2">
                    {n === null
                      ? ""
                      : `${n} ${n === 1 ? t.program : t.programs}`}
                    <Icon name="arrow" size={14} />
                  </span>
                </MotionLink>
              </motion.li>
            )
          })}
        </ul>
      </Reveal>
    </Section>
  )
}
