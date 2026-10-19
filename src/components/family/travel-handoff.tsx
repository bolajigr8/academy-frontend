"use client"

import { motion } from "framer-motion"

import { Icon, type IconName } from "@/components/icons/icon"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { TRAVEL } from "@/data/copy"
import { FAMILY } from "@/data/family-copy"
import { inView, press } from "@/lib/motion"

/* AmTravelHandoff + .amk-handoff*: only after a place is offered (js/amk-shell.jsx, css/amk-app.css:215-224). Always dark. */
/** The prototype's icon for each backend link key */
const ICONS: Record<string, IconName> = {
  flights: "plane",
  hotels: "bed",
  esim: "sim",
  transfers: "car",
  insurance: "umbrella",
}

/*
 * api mode passes `links` (travel.links from the backend, section 15): those
 * labels and URLs are shown as they come. Demo mode keeps the prototype's list.
 */
export function TravelHandoff({
  city,
  start,
  links,
}: {
  city: string
  start: string
  links?: { key: string; label: string; url: string }[]
}) {
  const t = FAMILY.travel
  const items = links
    ? links.map((l) => ({
        label: l.label,
        href: l.url,
        icon: ICONS[l.key] ?? ("external" as IconName),
      }))
    : TRAVEL.items
  return (
    <motion.div
      {...inView(0)}
      className="grid gap-3 rounded-lg border border-gf-steel bg-gf-black p-[18px] text-gf-white"
    >
      <div className="flex items-start gap-3">
        <Icon
          name="plane"
          size={20}
          className="mt-0.5 flex-none text-gf-neon"
        />
        <div className="grid gap-0.5">
          <b>{t.title(city)}</b>
          <small className="text-fs-13 text-gf-mist">
            {t.sub(DATES.fmt(start))}
          </small>
        </div>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <li key={i.label}>
            <motion.a
              {...press}
              href={i.href}
              className="inline-flex items-center gap-1.5 rounded-[99px] border border-gf-ash px-[10px] py-1.5 text-fs-13 font-semibold text-gf-white hover:border-gf-neon"
            >
              <Icon
                name={i.icon as IconName}
                size={16}
                className="text-gf-neon"
              />
              {i.label}
            </motion.a>
          </li>
        ))}
      </ul>
      <ButtonLink
        external
        href={TRAVEL.href}
        variant="ink"
        size="sm"
        className="justify-self-start bg-gf-neon text-text-on-neon hover:bg-gf-neon"
      >
        {t.cta} <Icon name="external" size={14} />
      </ButtonLink>
    </motion.div>
  )
}
