"use client"

import { useCallback } from "react"

import { getAppStore } from "@/stores/instance"

import { notify } from "./notify"

/* useSaveToggle (js/amk-core.jsx:348): save or unsave a program, with an Undo toast. Same on every page. */
export function useSaveToggle() {
  return useCallback((id: string) => {
    const api = getAppStore()
    const nowSaved = api.toggleSave(id)
    const l = api.get().listingsById[id]
    notify(nowSaved ? `Saved ${l.academy.name}.` : "Removed from saved.", {
      label: "Undo",
      run: () => {
        api.toggleSave(id)
      },
    })
  }, [])
}
