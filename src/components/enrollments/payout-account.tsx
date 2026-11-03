"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

import { Icon } from "@/components/icons/icon"
import { CardBlock } from "@/components/shared/card-block"
import { Notice } from "@/components/shared/notice"
import { SectionHead } from "@/components/shared/section-head"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import { DATES } from "@/data/catalog"
import { LIVE } from "@/data/live-copy"
import { useCountries } from "@/features/auth/hooks"
import { useSession } from "@/features/auth/session"
import { getOrganization } from "@/features/club/api"
import { clubKeys } from "@/features/club/query-keys"
import type { ApiMoney } from "@/lib/api/types"
import { formatMoney } from "@/lib/money"
import {
  createPayoutLink,
  getPayoutAccount,
  paymentKeys,
  payoutKeys,
  PAYOUT_COUNTRIES,
  type PayoutAccountStatus,
} from "@/features/payments/api"

import { browser } from "./use-pay"

const t = LIVE.payoutAccount
/** "ask every 3 seconds for about 30 seconds" after Stripe's form (section 22) */
const POLL_MS = 3000
const POLL_FOR_MS = 30_000
const TONE: Record<
  PayoutAccountStatus,
  "success" | "warning" | "info" | "ghost"
> = {
  ready: "success",
  onboarding: "info",
  restricted: "warning",
  none: "ghost",
  disconnected: "warning",
}

/*
 * The academy's payout account (week 3 part 4, section 22). Any member sees
 * the status; only the organization's owner gets the button, which asks the
 * API for a single-use Stripe link (never kept) and sends the browser there.
 * Coming back from Stripe ("return") the card asks every 3 seconds until the
 * status is no longer onboarding; an expired link ("refresh") fetches a new
 * one and goes straight back to Stripe.
 */
export function PayoutAccountCard({
  back,
  waiting,
}: {
  /** the academy's payouts not sent yet (meta.totals.EUR.payout_pending) */
  waiting?: ApiMoney | null
  /** set when Stripe sent the owner back: "return" or "refresh" */
  back?: "return" | "refresh" | null
}) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const [busy, setBusy] = useState(false)
  const [polling, setPolling] = useState(back === "return")
  const org = useQuery({
    queryKey: clubKeys.organization(),
    queryFn: getOrganization,
  })
  const account = useQuery({
    queryKey: payoutKeys.account(),
    queryFn: getPayoutAccount,
    refetchInterval: (q) =>
      polling && (q.state.data?.status ?? "onboarding") === "onboarding"
        ? POLL_MS
        : false,
  })
  // stop polling after about 30 seconds
  useEffect(() => {
    if (!polling) return
    const id = setTimeout(() => setPolling(false), POLL_FOR_MS)
    return () => clearTimeout(id)
  }, [polling])
  // once it is ready, the waiting payouts are being sent: refresh the lists
  const status = account.data?.status
  useEffect(() => {
    if (status === "ready")
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
  }, [status, queryClient])

  // the country's name, not its code ("the Bahamas", not "BS")
  const countries = useCountries()
  const countryName =
    countries?.find((c) => c.code === org.data?.country_code)?.name ??
    org.data?.country_code ??
    ""
  const isOwner = Boolean(
    user && org.data && org.data.owner_user_id === user.id
  )
  const country = org.data?.country_code ?? ""
  const supported = !country || PAYOUT_COUNTRIES.has(country)

  const open = async () => {
    if (busy) return
    setBusy(true)
    try {
      const { url } = await createPayoutLink()
      browser.go(url)
      // the browser is leaving: keep the button busy
    } catch {
      // owner_required, payout_country_unsupported, 502, 429: the toast says why
      setBusy(false)
      void account.refetch()
    }
  }

  // an expired or used link: get a new one and go straight back to Stripe
  const refreshed = useRef(false)
  useEffect(() => {
    if (back !== "refresh" || refreshed.current || !isOwner) return
    refreshed.current = true
    void open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [back, isOwner])

  const a = account.data
  let text = ""
  let action: { label: string } | null = null
  if (a) {
    if (a.disabled_reason === "recipient_agreement") text = t.contactGolafly
    else if (a.status === "none")
      text = supported ? t.none : t.country(countryName)
    else if (a.status === "onboarding")
      text = polling || back === "return" ? t.checking : t.onboarding
    else if (a.status === "restricted") text = t.restricted(a.requirements_due)
    else if (a.status === "ready") text = t.ready
    else text = t.disconnected
    const canAct =
      a.status !== "disconnected" &&
      a.disabled_reason !== "recipient_agreement" &&
      (a.status !== "none" || supported)
    if (canAct)
      action = {
        label:
          a.status === "none"
            ? t.connect
            : a.status === "ready"
              ? t.manage
              : a.status === "restricted"
                ? t.finish
                : t.continue,
      }
  }

  return (
    <CardBlock
      id="payout-account"
      aria-labelledby="h-payout-account"
      className="grid scroll-mt-24 gap-3"
    >
      <SectionHead
        id="h-payout-account"
        title={t.title}
        action={
          a ? (
            <StatusPill tone={TONE[a.status] ?? "ghost"}>
              {t.statusLabel[a.status] ?? a.status}
            </StatusPill>
          ) : undefined
        }
      />
      {!a ? (
        <p className="text-fs-14 text-fg-3" aria-busy="true">
          {back === "refresh"
            ? t.refreshing
            : back === "return"
              ? t.returning
              : "…"}
        </p>
      ) : (
        <>
          {a.status !== "ready" && waiting && waiting.amount_minor > 0 ? (
            <p className="text-fs-18 font-semibold text-fg-1">
              {t.waiting(formatMoney(waiting))}
            </p>
          ) : null}
          <Notice
            tone={
              a.status === "ready"
                ? "success"
                : a.status === "none"
                  ? "neutral"
                  : "warning"
            }
            icon={
              a.status === "ready" ? "checkcircle" : polling ? "clock" : "info"
            }
          >
            <span aria-live="polite">{text}</span>
          </Notice>
          {action ? (
            isOwner ? (
              <Button
                className="justify-self-start"
                variant={a.status === "ready" ? "secondary" : "primary"}
                onClick={() => open()}
                aria-busy={busy}
              >
                <Icon name="external" size={16} /> {action.label}
              </Button>
            ) : (
              <p className="text-fs-13 text-fg-3">{t.ownerOnly}</p>
            )
          ) : null}
          {a.checked_at ? (
            <small className="text-fs-12 text-fg-3">
              {t.lastChecked(DATES.fmt(a.checked_at.slice(0, 10)))}
            </small>
          ) : null}
        </>
      )}
    </CardBlock>
  )
}
