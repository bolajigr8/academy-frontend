"use client"

import { motion } from "framer-motion"
import { createContext, use, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { useMedia } from "@/hooks/use-media"
import { enter } from "@/lib/motion"

/*
 * The family and club layouts own the shell, but each page owns its title,
 * subtitle and top-bar actions (AmShell props in the prototype). The shell
 * exposes two slots; <PageHeading> fills them from the page.
 */
export type HeadingSlots = {
  title: HTMLElement | null
  actions: HTMLElement | null
  /** Phones: a row at the top of the page content (the top bar is too narrow). */
  phoneActions: HTMLElement | null
}

export const HeadingSlotsContext = createContext<HeadingSlots>({
  title: null,
  actions: null,
  phoneActions: null,
})

type Props = {
  title: string
  subtitle?: string
  actions?: ReactNode
  /** Drop the 1240px content cap for this page (AmShell wide). */
  wide?: boolean
}

export function PageHeading({ title, subtitle, actions, wide = false }: Props) {
  const slots = use(HeadingSlotsContext)
  // Added for small screens: actions leave the top bar at <=600px (le-600)
  const phone = useMedia("(max-width: 600px)")
  const actionsSlot = phone ? slots.phoneActions : slots.actions
  return (
    <>
      {wide ? <span hidden data-shell-wide="" /> : null}
      {slots.title
        ? createPortal(
            <>
              <motion.h1
                key={title}
                {...enter(0, 8)}
                className="line-clamp-2 font-display text-[clamp(20px,2.2vw,26px)] leading-[1.1] font-bold tracking-[-0.02em] uppercase le-600:text-[18px]"
              >
                {title}
              </motion.h1>
              {subtitle ? (
                <motion.p
                  key={subtitle}
                  {...enter(1, 6)}
                  className="mt-0.5 overflow-hidden text-fs-13 text-ellipsis whitespace-nowrap text-fg-3 le-600:hidden"
                >
                  {subtitle}
                </motion.p>
              ) : null}
            </>,
            slots.title
          )
        : null}
      {actionsSlot && actions ? createPortal(actions, actionsSlot) : null}
    </>
  )
}
