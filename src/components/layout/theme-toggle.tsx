"use client"

import { useTheme } from "next-themes"

import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"

type Props = {
  small?: boolean
  className?: string
}

/*
 * Port of theme-toggle.js (button factory) + .gf-theme-toggle*: colors_and_type.css:360-440.
 * The sun/moon swap is driven by CSS on :root[data-theme], so it is correct on first
 * paint with no hydration mismatch. Only the label depends on the stored theme, so it
 * waits for useHydrated().
 */
const iconBase =
  "absolute inset-0 flex items-center justify-center [transition:transform_var(--dur-base)_var(--ease-spring),opacity_var(--dur-base)_var(--ease-out)] motion-reduce:transition-none!"

export function ThemeToggle({ small = false, className }: Props) {
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()
  const isDark = !hydrated || theme !== "light"
  const label = isDark ? "Switch to light mode" : "Switch to dark mode"
  const svgSize = small ? "size-4" : "size-[18px]"

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill border border-border-2 bg-transparent p-0 text-fg-2 [transition:border-color_var(--dur-base)_var(--ease-out),background_var(--dur-base)_var(--ease-out),color_var(--dur-base)_var(--ease-out)] hover:border-border-accent hover:bg-tint-neon-1 hover:text-fg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gf-neon motion-reduce:transition-none!",
        small ? "size-[34px]" : "size-10",
        className
      )}
    >
      <span
        className={cn(
          iconBase,
          "[transform:rotate(0)_scale(1)] opacity-100 [:root[data-theme=light]_&]:[transform:rotate(90deg)_scale(0.5)] [:root[data-theme=light]_&]:opacity-0"
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={svgSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>
      <span
        className={cn(
          iconBase,
          "[transform:rotate(-90deg)_scale(0.5)] opacity-0 [:root[data-theme=light]_&]:[transform:rotate(0)_scale(1)] [:root[data-theme=light]_&]:opacity-100"
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={svgSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  )
}
