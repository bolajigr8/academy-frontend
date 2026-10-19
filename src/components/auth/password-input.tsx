"use client"

import { useState, type ComponentProps } from "react"

import { Icon } from "@/components/icons/icon"
import { Input } from "@/components/ui/input"
import { AUTH } from "@/data/auth-copy"
import { cn } from "@/lib/utils"

type Props = Omit<ComponentProps<"input">, "type">

/*
 * .amk-pw + .amk-pw__toggle: css/amk-pages.css:378-381. The eye button shows or
 * hides the password; the icon switches to a crossed eye while it is visible.
 * Used by every password field (sign in, register, Golafly admin).
 */
export function PasswordInput({ className, ...props }: Props) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        {...props}
        type={show ? "text" : "password"}
        className={cn("pr-[52px]", className)}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? AUTH.login.hidePassword : AUTH.login.showPassword}
        aria-pressed={show}
        className="absolute top-1/2 right-1 grid h-[38px] w-[42px] -translate-y-1/2 place-items-center rounded-[6px] border-0 bg-transparent text-fg-2 aria-pressed:bg-tint-neon-2 aria-pressed:text-fg-1"
      >
        <Icon name={show ? "eyeoff" : "eye"} size={18} />
      </button>
    </div>
  )
}
