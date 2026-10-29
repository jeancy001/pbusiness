import type { Locale } from "@/lib/i18n/dictionary"

const intl = (locale: Locale) => (locale === "fr" ? "fr-FR" : "en-GB")

/** "2026-10" → "oct." / "Oct" */
export function monthLabel(key: string, locale: Locale) {
  const [y, m] = key.split("-").map(Number)
  return new Intl.DateTimeFormat(intl(locale), { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)))
}

/** "2026-10-26" (week start) → "26 oct." */
export function weekLabel(key: string, locale: Locale) {
  return new Intl.DateTimeFormat(intl(locale), { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`))
}

/** $1,234 · $12.5k */
export function usdShort(n: number) {
  if (Math.abs(n) >= 10_000) return `$${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: n % 1 ? 2 : 0 })}`
}
