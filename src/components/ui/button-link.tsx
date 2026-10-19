"use client"

import type { VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import Link from "next/link"
import type { ComponentProps } from "react"

import { press, pressWide } from "@/lib/motion"
import { cn } from "@/lib/utils"

import { buttonVariants } from "./button"

const MotionLink = motion.create(Link)

type Variants = VariantProps<typeof buttonVariants> & {
  variant?:
    "primary" | "secondary" | "ink" | "ghost" | "white" | "onphoto" | "danger"
  size?: "default" | "sm" | "lg" | "icon"
  block?: boolean
}

type Props = Variants &
  Omit<ComponentProps<typeof MotionLink>, "ref"> & {
    /** a plain <a> (another site, or a #hash on the same page) instead of next/link */
    external?: boolean
  }

/* A link that looks and moves like a Button (.amk-btn on an <a>, with the same spring). */
export function ButtonLink({
  variant,
  size,
  block,
  className,
  external = false,
  href,
  ...props
}: Props) {
  const feel = block ? pressWide : press
  const classes = cn(buttonVariants({ variant, size, block }), className)
  if (external)
    return (
      <motion.a
        href={typeof href === "string" ? href : undefined}
        className={classes}
        {...feel}
        {...(props as ComponentProps<typeof motion.a>)}
      />
    )
  return <MotionLink href={href} className={classes} {...feel} {...props} />
}
