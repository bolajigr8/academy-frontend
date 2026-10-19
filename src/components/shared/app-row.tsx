"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { Icon } from "@/components/icons/icon"
import { ButtonLink } from "@/components/ui/button-link"
import { DATES } from "@/data/catalog"
import { FAMILY } from "@/data/family-copy"
import { fmtStamp, STATUS } from "@/features/applications/flow"
import type { AppRowData } from "@/features/family/hooks"
import { inView } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { routes } from "@/routes"

import { AvatarInitials } from "./avatar-initials"
import { SafeImage } from "./safe-image"
import { StatusBadge } from "./status-badge"

/* AmAppRow + .amk-arow*: js/amk-shell.jsx:411, css/amk-app.css:187-202 */
export function AppRow({
  row,
  index = 0,
}: {
  row: AppRowData
  index?: number
}) {
  const { app: a, listing: l } = row
  const m = STATUS[a.status]
  const draft = a.status === "draft"
  const href = draft
    ? routes.apply(l.id, undefined, a.id)
    : routes.family.application(a.id)
  const t = FAMILY.row
  return (
    <motion.li
      {...inView(index)}
      className={cn(
        "grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-4 rounded-md border border-border-1 bg-surface-elevated p-3 le-720:grid-cols-[72px_minmax(0,1fr)]",
        m.group === "action" && "border-border-3",
        m.group === "closed" && "opacity-80"
      )}
    >
      <span className="relative block h-[72px] w-24 overflow-hidden rounded-sm le-720:w-[72px]">
        <SafeImage
          src={l.image}
          alt=""
          fill
          sizes="96px"
          className="object-cover [filter:var(--filter-media)]"
        />
      </span>
      <div className="grid min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-[10px]">
          <StatusBadge status={a.status} />
          {a.ref ? (
            <span className="font-mono text-fs-12 tracking-gf-wide text-fg-3 uppercase">
              {a.ref}
            </span>
          ) : null}
        </div>
        <Link
          href={href}
          className="font-display text-fs-16 font-bold hover:underline hover:underline-offset-3"
        >
          {l.title}
        </Link>
        <p className="text-fs-14 text-fg-3">
          {l.academy.name} · {l.city}
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-fs-12 text-fg-3 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5">
          {row.playerFirst ? (
            <span>
              <AvatarInitials
                initials={row.playerInitials ?? ""}
                size={20}
                tone="soft"
              />
              {row.playerFirst}
            </span>
          ) : null}
          <span>
            <Icon name="calendar" size={14} />
            {t.starts} {DATES.fmt(row.intakeStart)}
          </span>
          <span>
            <Icon name="clock" size={14} />
            {t.updated} {fmtStamp(row.lastAt).split(" · ")[0]}
          </span>
        </p>
      </div>
      <div className="le-720:col-[1/-1]">
        {m.next && m.group === "action" ? (
          <ButtonLink
            href={
              draft
                ? href
                : `${href}${a.status === "enrollment_pending" ? "#payment" : "#respond"}`
            }
            size="sm"
            className="le-720:w-full"
          >
            {m.next}
          </ButtonLink>
        ) : (
          <ButtonLink
            href={href}
            variant="secondary"
            size="sm"
            className="le-720:w-full"
          >
            {draft ? t.continue : t.view}
          </ButtonLink>
        )}
      </div>
    </motion.li>
  )
}
