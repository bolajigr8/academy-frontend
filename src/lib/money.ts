import type { ApiMoney } from "@/lib/api/types"

/*
 * Money from the API is integer minor units + a 3-letter currency
 * (contract section 1). Format it here; never parse the `amount` string.
 */

/** Digits after the decimal point for a currency (EUR 2, JPY 0 ...) */
function fractionDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2
    )
  } catch {
    return 2
  }
}

/** 850000 EUR -> 8500 */
export function minorToMajor(minor: number, currency: string): number {
  return minor / 10 ** fractionDigits(currency)
}

/** 8500 EUR -> 850000 (what every write sends) */
export function majorToMinor(major: number, currency: string): number {
  return Math.round(major * 10 ** fractionDigits(currency))
}

/**
 * "€8,500" the way the prototype shows fees (fmtEuro: whole units, en-US
 * grouping); cents are shown only when the amount has them.
 */
export function formatMoney(money: ApiMoney | null | undefined): string {
  if (!money) return "—"
  const major = minorToMajor(money.amount_minor, money.currency)
  const whole = Number.isInteger(major)
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: money.currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(major)
  } catch {
    return `${money.currency} ${major}`
  }
}
