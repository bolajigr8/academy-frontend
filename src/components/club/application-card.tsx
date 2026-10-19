"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { AvatarInitials } from "@/components/shared/avatar-initials"
import { DATES } from "@/data/catalog"
import { CLUB } from "@/data/club-copy"
import type { ApplicationEntry } from "@/features/club/hooks"
import { spring } from "@/lib/motion"
import { routes } from "@/routes"

const MotionLink = motion.create(Link)

/* AmAppCard + .amk-acard*: js/amk-host.jsx, css/amk-app.css:337-344 */
export function ApplicationCard({ entry }: { entry: ApplicationEntry }) {
  const { app: a, who, listing, age } = entry
  const docs = a.documents ?? []
  const ok = docs.filter((d) => d.status === "accepted").length
  const sub = a.events.find((e) => e.status === "submitted")
  const t = CLUB.applications
  return (
    <li>
      <MotionLink
        whileHover={{ y: -2, transition: spring }}
        whileTap={{ scale: 0.98, transition: spring }}
        href={routes.club.applicant(a.id)}
        className="grid gap-2 rounded-sm border border-border-1 bg-surface-elevated p-3 [transition:border-color_var(--dur-base)] hover:border-border-accent"
      >
        <div className="flex items-center gap-[10px]">
          <AvatarInitials initials={who.initials} size={34} tone="soft" />
          <span className="grid min-w-0">
            <b className="text-fs-14">{who.name}</b>
            <small className="text-fs-12 text-fg-3">
              {age} · {who.position}
            </small>
          </span>
          {a.status === "submitted" ? (
            <i
              aria-label={t.new}
              className="ml-auto size-2 flex-none rounded-full bg-gf-neon shadow-[0_0_0_1px_var(--fg-1)]"
            />
          ) : null}
        </div>
        <p className="text-fs-14 text-fg-3">{listing.title}</p>
        <div className="flex justify-between gap-2 text-fs-12 text-fg-3">
          <span>
            {sub ? `${t.applied} ${DATES.fmtShort(sub.at.split(" ")[0])}` : ""}
          </span>
          <span>
            {t.docs} {ok}/{docs.length}
          </span>
        </div>
      </MotionLink>
    </li>
  )
}
