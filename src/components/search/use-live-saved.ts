"use client"

import { useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import { notify } from "@/components/shared/notify"
import {
  saveListing,
  unsaveListing,
  type ApiSearchCard,
} from "@/features/academies/api"
import { discoveryKeys } from "@/features/academies/query-keys"
import { useSession } from "@/features/auth/session"
import { routes } from "@/routes"

type Saveable = Pick<ApiSearchCard, "id" | "is_saved"> & {
  academy: { name: string }
}

/*
 * The save heart in api mode (week 1 part 2, section 16). Any signed-in
 * account can save; a guest is sent to sign in and comes back here. The heart
 * changes at once and goes back if the request fails (the error toast says
 * why). Saving twice or removing twice is safe on the backend. The toast keeps
 * the prototype's wording and its Undo.
 */
export function useLiveSaved() {
  const { user, hydrated } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [overrides, setOverrides] = useState<Record<number, boolean>>({})

  const isSaved = useCallback(
    (c: Saveable) => overrides[c.id] ?? c.is_saved,
    [overrides]
  )

  const write = useCallback(
    async (c: Saveable, save: boolean) => {
      setOverrides((o) => ({ ...o, [c.id]: save }))
      try {
        if (save) await saveListing(c.id)
        else await unsaveListing(c.id)
        void queryClient.invalidateQueries({ queryKey: discoveryKeys.saved() })
        // other search pages pick the change up the next time they load
        void queryClient.invalidateQueries({
          queryKey: [...discoveryKeys.all, "search"],
          refetchType: "none",
        })
        return true
      } catch {
        setOverrides((o) => ({ ...o, [c.id]: !save }))
        return false
      }
    },
    [queryClient]
  )

  const toggle = useCallback(
    async (c: Saveable) => {
      if (!hydrated) return
      if (!user) {
        const next =
          pathname +
          (typeof window === "undefined" ? "" : window.location.search)
        router.push(routes.login(next))
        return
      }
      const save = !(overrides[c.id] ?? c.is_saved)
      if (!(await write(c, save))) return
      notify(save ? `Saved ${c.academy.name}.` : "Removed from saved.", {
        label: "Undo",
        run: () => void write(c, !save),
      })
    },
    [hydrated, user, pathname, router, overrides, write]
  )

  return { isSaved, toggle }
}
