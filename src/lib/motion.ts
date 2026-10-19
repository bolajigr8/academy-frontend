import type { Variants } from "framer-motion"

/** --ease-out, colors_and_type.css:103 */
export const easeOut = [0.22, 1, 0.36, 1] as const

/** --dur-base and --dur-slow in seconds (220ms, 420ms) */
export const duration = { base: 0.22, slow: 0.42 } as const

/** Delay between siblings in a staggered group */
export const staggerStep = 0.08

/** Scroll-reveal preset (an approved addition, not in the prototype). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.slow,
      delay: index * staggerStep,
      ease: easeOut,
    },
  }),
}

export const viewportOnce = { once: true, margin: "-60px" } as const

/*
 * Interaction motion, the way the matchday project uses framer-motion:
 * spring hover/press on buttons, a hover lift on cards, a staggered entrance
 * on scroll for cards and on mount for page headings and the hero.
 * All of it is switched off by <MotionConfig reducedMotion="user"> when the
 * visitor asks for reduced motion.
 */

/** A soft, quick spring for hover and press feedback */
export const spring = {
  type: "spring",
  stiffness: 420,
  damping: 30,
  mass: 0.6,
} as const

/** Buttons and other pressable controls (matchday: hover 1.03, tap 0.97) */
export const press = {
  whileHover: { scale: 1.03, transition: spring },
  whileTap: { scale: 0.97, transition: spring },
} as const

/** Full-width buttons and wide rows: the same feel, scaled for their size */
export const pressWide = {
  whileHover: { scale: 1.01, transition: spring },
  whileTap: { scale: 0.985, transition: spring },
} as const

/** Small round controls (heart, close, pins) */
export const pressIcon = {
  whileHover: { scale: 1.08, transition: spring },
  whileTap: { scale: 0.92, transition: spring },
} as const

/** Cards and tiles rising on hover (the prototype's translateY hovers) */
export const lift = (y = -4) =>
  ({ whileHover: { y, transition: spring } }) as const

/** Rows nudging sideways on hover (the prototype's translateX hovers) */
export const nudge = (x = 4) =>
  ({ whileHover: { x, transition: spring } }) as const

/** Entrance when a card scrolls into view, staggered by its index (matchday cards) */
export const inView = (index = 0) =>
  ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.4, delay: (index % 4) * 0.05, ease: easeOut },
  }) as const

/** Entrance on mount, staggered by step (hero copy, page headings, matchday heroes) */
export const enter = (step = 0, y = 14) =>
  ({
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: step * 0.08, ease: easeOut },
  }) as const

/** A parent that reveals its children one after another (KPI rows, lists) */
export const staggerParent = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-40px" },
  variants: {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  },
} as const

/** A child of staggerParent */
export const staggerItem = {
  variants: {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: easeOut },
    },
  },
} as const
