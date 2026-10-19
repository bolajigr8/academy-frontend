"use client"

import { motion } from "framer-motion"
import type { ElementType, ReactNode } from "react"

import { fadeUp, viewportOnce } from "@/lib/motion"

type Props = {
  children: ReactNode
  /** position in a staggered group: delay = index * 0.08s */
  index?: number
  className?: string
  as?: "div" | "section" | "li" | "article"
}

const tags = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
  article: motion.article,
} satisfies Record<NonNullable<Props["as"]>, ElementType>

/**
 * Scroll-reveal wrapper (an approved addition, not in the prototype).
 * Keeps surrounding sections Server Components; only this wrapper is client.
 * Respects prefers-reduced-motion through <MotionConfig reducedMotion="user">.
 */
export function Reveal({ children, index = 0, className, as = "div" }: Props) {
  const Tag = tags[as]
  return (
    <Tag
      className={className}
      variants={fadeUp}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {children}
    </Tag>
  )
}
