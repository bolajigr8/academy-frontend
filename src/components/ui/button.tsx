"use client"

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, type HTMLMotionProps } from "framer-motion"

import { press, pressWide } from "@/lib/motion"
import { cn } from "@/lib/utils"

/*
 * .amk-btn and its modifiers: css/amk-core.css:121-153.
 * Buttons are motion.button: a spring hover and press (framer-motion) replace the
 * source's 1px :active nudge. For a link that looks like a button use <ButtonLink>.
 */
const buttonStyles = cva(
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm border border-transparent px-5 py-[11px] font-body text-fs-14 font-bold tracking-[-0.005em] whitespace-nowrap no-underline [transition:background_var(--dur-base)_var(--ease-out),border-color_var(--dur-base)_var(--ease-out),color_var(--dur-base)_var(--ease-out),box-shadow_var(--dur-base)_var(--ease-out)] disabled:cursor-not-allowed disabled:border-border-2 disabled:bg-bg-3 disabled:text-fg-3 disabled:shadow-none aria-disabled:cursor-not-allowed aria-disabled:border-border-2 aria-disabled:bg-bg-3 aria-disabled:text-fg-3 aria-disabled:shadow-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-(--glow-neon-sm) hover:bg-gf-neon-bright hover:shadow-(--glow-neon-md)",
        secondary:
          "border-border-3 bg-transparent text-fg-1 hover:border-border-accent hover:bg-tint-neon-1",
        ink: "bg-fg-1 text-bg-0 hover:bg-fg-2",
        ghost: "bg-transparent text-fg-2 hover:bg-tint-neon-1 hover:text-fg-1",
        white: "bg-gf-white text-gf-black hover:bg-gf-chalk",
        onphoto:
          "border-gf-mist bg-transparent text-gf-white hover:border-gf-neon",
        danger:
          "border-gf-danger bg-transparent text-fg-1 hover:bg-tint-neon-1",
      },
      size: {
        default: "",
        sm: "min-h-9 px-[14px] py-[7px] text-fs-13",
        lg: "min-h-[52px] px-[26px] py-[14px] text-fs-16",
        icon: "w-11 px-0 py-0",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      // .amk-btn--ghost { padding-inline: 12px } only beats the base padding;
      // --sm and --lg are declared later in the source and override it.
      { variant: "ghost", size: "default", className: "px-3" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
      block: false,
    },
  }
)

type Props = HTMLMotionProps<"button"> & VariantProps<typeof buttonStyles>

/*
 * Busy state (a request is running): a spinner before the label, the button
 * keeps its colours (only dimmed) and ignores further clicks, including a
 * form's Enter key. It turns on in two ways:
 *   - aria-busy={pending} from the caller (forms and mutations), or
 *   - automatically while an onClick that returns a Promise is running
 *     (onClick={() => save()}), so no action button can be left without one.
 */
function Button({
  className,
  variant,
  size,
  block,
  type = "button",
  disabled,
  children,
  onClick,
  ...props
}: Props) {
  const feel = block ? pressWide : press
  const [running, setRunning] = useState(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const busy =
    running || props["aria-busy"] === true || props["aria-busy"] === "true"
  const still = disabled || busy

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      e.preventDefault()
      return
    }
    const result: unknown = onClick?.(e)
    if (result instanceof Promise) {
      setRunning(true)
      void result
        .catch(() => undefined)
        .finally(() => {
          if (mounted.current) setRunning(false)
        })
    }
  }

  return (
    <motion.button
      data-slot="button"
      type={type}
      disabled={disabled}
      whileHover={still ? undefined : feel.whileHover}
      whileTap={still ? undefined : feel.whileTap}
      className={cn(
        buttonVariants({ variant, size, block }),
        busy && !disabled && "cursor-progress opacity-85",
        className
      )}
      {...props}
      aria-busy={busy || undefined}
      onClick={handleClick}
    >
      <>
        {busy ? <Spinner /> : null}
        {children as ReactNode}
      </>
    </motion.button>
  )
}

/** A small rotating ring in the button's text colour (keeps turning with reduced motion, see globals.css) */
function Spinner() {
  return (
    <svg
      aria-hidden="true"
      data-slot="spinner"
      className="size-4 flex-none animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  )
}

/**
 * Class string for a button. It is merged with cn() so base and variant classes never
 * conflict (e.g. border-transparent vs border-border-3). ButtonLink uses it; use it
 * directly only on an element that must not move (e.g. a disabled preview).
 */
function buttonVariants(options?: VariantProps<typeof buttonStyles>) {
  return cn(buttonStyles(options))
}

export { Button, buttonVariants }
