"use client"

import { useMutation, useQuery } from "@tanstack/react-query"

import { isLive } from "@/lib/data-source"

import { listCountries, login, register, type ApiCountry } from "./api"

export const authKeys = {
  countries: ["countries"] as const,
}

/** GET /countries: the list for every country dropdown. Cached for the session. */
function useCountriesLive(): ApiCountry[] | undefined {
  return useQuery({
    queryKey: authKeys.countries,
    queryFn: listCountries,
    staleTime: Infinity,
    gcTime: Infinity,
  }).data
}

/** mock mode uses the prototype's own country list; nothing is fetched */
function useCountriesDemo(): ApiCountry[] | undefined {
  return undefined
}

export const useCountries = isLive("auth") ? useCountriesLive : useCountriesDemo

export function useLogin() {
  return useMutation({ mutationFn: login })
}

export function useRegister() {
  return useMutation({ mutationFn: register })
}
