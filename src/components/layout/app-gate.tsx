"use client"

import { Icon } from "@/components/icons/icon"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { routes } from "@/routes"
import { getAppStore } from "@/stores/instance"

import type { Persona } from "./notifications"

/* Gate: js/amk-shell.jsx (wrong or no demo session), .amk-gate* and .amk-app-gate */
export function AppGate({ persona }: { persona: Persona }) {
  const club = persona === "club"
  return (
    <div className="grid min-h-screen place-content-center justify-items-center gap-3 p-6">
      <Logo size="lg" />
      <div className="mx-auto my-[clamp(24px,6vh,64px)] grid max-w-[680px] justify-items-start gap-4 rounded-lg border border-border-2 bg-surface-elevated p-[clamp(24px,4vw,40px)] shadow-(--shadow-md)">
        <span
          aria-hidden="true"
          className="grid size-16 place-items-center rounded-full bg-fg-1 text-bg-0"
        >
          <Icon name="lock" size={26} />
        </span>
        <h1 className="font-display text-[clamp(28px,3.4vw,44px)] leading-[1.02] font-bold tracking-[-0.025em] text-fg-1 uppercase">
          {club ? "Academy dashboard" : "Family account"}
        </h1>
        <p className="text-fs-16 leading-lh-relaxed text-fg-2">
          {club
            ? "This area is for clubs and academies. In the prototype you can continue as Marta, director of Valencia International."
            : "Sign in to see saved academies, applications and messages. In the prototype you can continue as Amara, parent of Tobi and Zara."}
        </p>
        <div className="flex flex-wrap gap-[10px]">
          <Button
            variant="primary"
            size="lg"
            onClick={() => getAppStore().setRole(club ? "host" : "family")}
          >
            Continue as {club ? "Marta (academy)" : "Amara (family)"}
          </Button>
          <ButtonLink href={routes.home} variant="secondary" size="lg">
            Back to the marketplace
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
