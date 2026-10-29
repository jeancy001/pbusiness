import "server-only"

// USD → local currency conversion.
//
// Rates come from a live feed (ExchangeRate-API open access, refreshed
// daily) cached in memory for 6 hours. FX_USD_<CURRENCY> values in the
// environment are only a fallback for when the feed is unreachable, so
// hand-entered rates can no longer silently over- or under-charge.

const SOURCE = process.env.FX_RATES_URL || "https://open.er-api.com/v6/latest/USD"
const TTL_MS = 6 * 60 * 60_000

let cache: { at: number; rates: Record<string, number>; updatedAt: string } | null = null
let inflight: Promise<void> | null = null

async function refresh() {
  try {
    const res = await fetch(SOURCE, { cache: "no-store", signal: AbortSignal.timeout(8000) })
    const json = (await res.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string }
    if (json.result === "success" && json.rates) {
      cache = { at: Date.now(), rates: json.rates, updatedAt: json.time_last_update_utc ?? new Date().toUTCString() }
    }
  } catch (error) {
    console.error("FX feed unavailable:", error)
  }
}

/** Optional margin on top of the market rate, e.g. FX_MARKUP_PERCENT=1. */
function markup() {
  const pct = Number(process.env.FX_MARKUP_PERCENT)
  return Number.isFinite(pct) && pct > 0 && pct < 20 ? 1 + pct / 100 : 1
}

export type FxRate = { rate: number; source: "live" | "fallback"; updatedAt?: string }

export async function usdRate(currency: string): Promise<FxRate> {
  if (currency === "USD") return { rate: 1, source: "live" }

  if (!cache || Date.now() - cache.at > TTL_MS) {
    inflight ??= refresh().finally(() => (inflight = null))
    await inflight
  }

  // A stale cache is still better than a hand-entered rate.
  const live = cache?.rates[currency]
  if (live && live > 0) return { rate: live * markup(), source: "live", updatedAt: cache!.updatedAt }

  const fallback = Number(process.env[`FX_USD_${currency}`])
  if (Number.isFinite(fallback) && fallback > 0) return { rate: fallback, source: "fallback" }

  throw new Error(`No exchange rate available for ${currency}.`)
}

/**
 * Mobile money is collected in whole units of the local currency, so the
 * converted price is rounded up to the next unit.
 */
export async function convertFromUsd(amountUsd: number, currency: string) {
  const { rate, source } = await usdRate(currency)
  return { amount: currency === "USD" ? amountUsd : Math.ceil(amountUsd * rate), rate, source }
}

/** Swychr's digital charge, added on top when ACCOUNTPE_PASS_DIGITAL_CHARGE=true (customer pays it). */
export const SWYCHR_DIGITAL_CHARGE_RATE = 0.025

export function customerPaysDigitalCharge() {
  return (process.env.ACCOUNTPE_PASS_DIGITAL_CHARGE ?? process.env.SWYCHR_PASS_DIGITAL_CHARGE)?.trim() === "true"
}
