"use client"

import type { CSSProperties } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { Icon } from "@/components/icons/icon"

/*
 * shadcn/ui Sonner, top-right on every screen (full width at the top on phones,
 * sonner's own breakpoint). Colours are the designer tokens through the shadcn
 * aliases: the toast is a popover surface (--surface-elevated, --fg-1,
 * --border-2) and the icon carries the meaning (success / error / warning /
 * info / loading). It sits above dialogs, so a failed request inside a modal
 * is still announced.
 * Toasts are raised through notify() / notifyError() in
 * components/shared/notify.tsx, never with toast() directly.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  return (
    <Sonner
      theme={resolvedTheme === "light" ? "light" : "dark"}
      position="top-right"
      visibleToasts={3}
      closeButton
      offset={{ top: 16, right: 16 }}
      mobileOffset={{ top: 12, right: 12, left: 12 }}
      className="toaster group"
      icons={{
        success: (
          <Icon name="checkcircle" size={18} className="text-amk-accent-ink" />
        ),
        info: <Icon name="info" size={18} className="text-fg-2" />,
        warning: <Icon name="alert" size={18} className="text-gf-warning" />,
        error: <Icon name="alert" size={18} className="text-gf-danger" />,
        loading: (
          <Icon name="spinner" size={18} className="animate-spin text-fg-2" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-md)",
          "--width": "380px",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group/toast font-body items-start! gap-3! shadow-(--shadow-lg)!",
          title: "text-fs-14! font-semibold! leading-lh-snug! text-fg-1",
          description: "text-fs-13! leading-lh-normal! text-fg-2!",
          icon: "mt-px!",
          actionButton:
            "rounded-xs! bg-fg-1! px-2.5! text-fs-12! font-bold! text-bg-0!",
          closeButton:
            "border-border-2! bg-surface-elevated! text-fg-2! hover:text-fg-1!",
          error: "border-l-4! border-l-gf-danger!",
          success: "border-l-4! border-l-gf-neon!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
