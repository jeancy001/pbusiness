"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowDownToLine, Banknote, Clock, Receipt, TrendingUp, Wallet } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/mock-data"
import type { Balance, PayoutView, SaleView } from "@/lib/payments/payouts"
import { MIN_PAYOUT_USD, PAYOUT_FEE_HIGH_RATE, PAYOUT_FEE_LOW_RATE, PAYOUT_FEE_THRESHOLD_USD, payoutFee } from "@/lib/payments/fees"
import { cancelPayoutAction, requestPayoutAction, withdrawPlatformRevenueAction } from "@/lib/payments/actions"
import { DashboardShell, StatCard } from "@/components/dashboard/dashboard-shell"
import { teacherNav } from "@/components/dashboard/teacher-dashboard"
import { EmptyState, Field, FormError, Panel, formatDate, selectClass } from "@/components/lms/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
const pct = (r: number) => `${(r * 100).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`

export function PayoutStatusBadge({ status }: { status: PayoutView["status"] }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const map = {
    requested: { variant: "warning", label: fr ? "Demandé" : "Requested" },
    approved: { variant: "default", label: fr ? "Approuvé" : "Approved" },
    processing: { variant: "default", label: fr ? "Envoi en cours" : "Sending" },
    paid: { variant: "success", label: fr ? "Payé" : "Paid" },
    failed: { variant: "destructive", label: fr ? "Échec — remboursé" : "Failed — refunded" },
    rejected: { variant: "destructive", label: fr ? "Refusé" : "Rejected" },
  } as const
  return <Badge variant={map[status].variant}>{map[status].label}</Badge>
}

export function TeacherPayouts({ balance, payouts, sales }: { balance: Balance; payouts: PayoutView[]; sales: SaleView[] }) {
  const { t, locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <DashboardShell nav={teacherNav} titleKey="teacher.payouts">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={fr ? "Disponible" : "Available"} value={usd(balance.availableUsd)} icon={Wallet} />
        <StatCard label={fr ? "Revenus totaux" : "Total earned"} value={usd(balance.earnedUsd)} icon={TrendingUp} />
        <StatCard label={fr ? "En cours de retrait" : "Payouts in progress"} value={usd(balance.reservedUsd)} icon={Clock} />
        <StatCard label={fr ? "Déjà versé" : "Paid out"} value={usd(balance.paidUsd)} icon={Banknote} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <Panel title={fr ? "Historique des retraits" : "Payout history"} icon={ArrowDownToLine}>
            {payouts.length === 0 ? (
              <EmptyState icon={Wallet} title={t("lms.empty")} />
            ) : (
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-2 font-medium">{t("common.date")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("common.amount")}</th>
                      <th className="px-3 py-2 text-right font-medium">{fr ? "Frais" : "Fee"}</th>
                      <th className="px-3 py-2 text-right font-medium">{fr ? "Net reçu" : "You receive"}</th>
                      <th className="px-3 py-2 font-medium">{fr ? "Vers" : "To"}</th>
                      <th className="px-5 py-2 text-right font-medium">{t("common.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payouts.map((p) => (
                      <tr key={p.id}>
                        <td className="px-5 py-3 text-muted-foreground">{formatDate(p.createdAt, locale)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{usd(p.amountUsd)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                          −{usd(p.feeUsd)} <span className="text-xs">({pct(p.feeRate)})</span>
                        </td>
                        <td className="px-3 py-3 text-right font-medium tabular-nums">
                          {usd(p.netUsd)}
                          {p.amountLocal && p.currency && (
                            <p className="text-xs font-normal text-muted-foreground">
                              {p.amountLocal.toLocaleString(fr ? "fr-FR" : "en-GB")} {p.currency}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {p.method} · {p.mobile}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <PayoutStatusBadge status={p.status} />
                            {p.status === "requested" && (
                              <button
                                type="button"
                                disabled={pending}
                                className="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                                onClick={() =>
                                  start(async () => {
                                    await cancelPayoutAction(p.id)
                                    router.refresh()
                                  })
                                }
                              >
                                {t("common.cancel")}
                              </button>
                            )}
                          </div>
                          {p.providerReference && <p className="mt-1 text-xs text-muted-foreground">Ref. {p.providerReference}</p>}
                          {(p.status === "rejected" || p.status === "failed") && p.note && (
                            <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title={fr ? "Ventes récentes" : "Recent sales"} icon={Receipt}>
            {sales.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("lms.empty")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {sales.map((s) => (
                  <li key={s.reference} className="flex items-center justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{localize(s.label, locale)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(s.date, locale)} · {fr ? "prix" : "price"} {usd(s.amountUsd)}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums text-success">+{usd(s.teacherShareUsd)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <RequestPayoutForm available={balance.availableUsd} />
      </div>
    </DashboardShell>
  )
}

/**
 * Mobile Money withdrawal form.
 *   teacher  — payout request with the 3.5% / 2.6% fee, reviewed by an admin
 *   platform — admin withdrawal of platform revenue, sent immediately, no fee
 */
export function RequestPayoutForm({ available, mode = "teacher" }: { available: number; mode?: "teacher" | "platform" }) {
  const platform = mode === "platform"
  const minimum = platform ? 1 : MIN_PAYOUT_USD
  const { t, locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const [amount, setAmount] = useState("")
  const [countries, setCountries] = useState<string[]>([])
  const [country, setCountry] = useState("")
  const [methods, setMethods] = useState<{ method: string; mobileFormat: string }[]>([])
  const [method, setMethod] = useState("")
  const [mobile, setMobile] = useState("")

  const regionName = useMemo(() => {
    try {
      const names = new Intl.DisplayNames([fr ? "fr-FR" : "en-GB"], { type: "region" })
      return (c: string) => names.of(c) ?? c
    } catch {
      return (c: string) => c
    }
  }, [fr])

  useEffect(() => {
    fetch("/api/payments/methods")
      .then((r) => r.json())
      .then((d: { countries?: string[] }) => setCountries(d.countries ?? []))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!country) return
    setMethods([])
    setMethod("")
    fetch(`/api/payments/methods?country=${country}`)
      .then((r) => r.json())
      .then((d: { ok: boolean; methods?: { method: string; mobileFormat: string }[] }) => {
        // Payouts are sent to mobile money wallets only.
        const mobile = (d.methods ?? []).filter((m) => !/bank/i.test(m.method))
        setMethods(mobile)
        setMethod(mobile[0]?.method ?? "")
      })
      .catch(() => undefined)
  }, [country])

  const value = Number(amount)
  const quote = value > 0 ? (platform ? { rate: 0, feeUsd: 0, netUsd: value } : payoutFee(value)) : null
  const format = methods.find((m) => m.method === method)?.mobileFormat

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(false)
    start(async () => {
      const input = { amountUsd: value, country, method, mobile }
      const res = platform ? await withdrawPlatformRevenueAction(input) : await requestPayoutAction(input)
      if (!res.ok) return setError(res.error)
      setDone(true)
      setAmount("")
      router.refresh()
    })
  }

  return (
    <Panel
      title={platform ? (fr ? "Retirer les revenus" : "Withdraw revenue") : fr ? "Demander un retrait" : "Request a payout"}
      icon={ArrowDownToLine}
      className="self-start"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field
          label={`${t("common.amount")} (USD)`}
          htmlFor="po-amount"
          hint={`${fr ? "Disponible" : "Available"} : ${usd(available)} · min. ${usd(minimum)}`}
        >
          <div className="flex gap-2">
            <Input placeholder={fr ? "Ex. : 50" : "e.g. 50"}
              id="po-amount"
              type="number"
              min={minimum}
              max={available}
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button type="button" variant="outline" disabled={available < minimum} onClick={() => setAmount(available.toFixed(2))}>
              Max
            </Button>
          </div>
        </Field>

        {quote && !platform && (
          <dl className="space-y-1.5 rounded-xl border border-border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {fr ? "Frais de retrait" : "Payout fee"} ({pct(quote.rate)})
              </dt>
              <dd className="tabular-nums">−{usd(quote.feeUsd)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5 font-medium">
              <dt>{fr ? "Vous recevez" : "You receive"}</dt>
              <dd className="tabular-nums">{usd(quote.netUsd)}</dd>
            </div>
          </dl>
        )}

        <Field label={fr ? "Pays" : "Country"} htmlFor="po-country">
          <select id="po-country" required value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass}>
            <option value="" disabled>
              {fr ? "Choisissez" : "Choose"}
            </option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {regionName(c)}
              </option>
            ))}
          </select>
        </Field>

        {methods.length > 0 && (
          <>
            <Field label={t("checkout.network")} htmlFor="po-method">
              <select id="po-method" required value={method} onChange={(e) => setMethod(e.target.value)} className={selectClass}>
                {methods.map((m) => (
                  <option key={m.method} value={m.method}>
                    {m.method}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("checkout.phone")} htmlFor="po-mobile" hint={format}>
              <Input id="po-mobile" required inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder={format} />
            </Field>
          </>
        )}

        <FormError message={error} />
        {done && (
          <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            {platform
              ? fr ? "Retrait envoyé via Swychr." : "Withdrawal sent via Swychr."
              : fr ? "Demande envoyée. L'administrateur va la traiter." : "Request sent. An administrator will process it."}
          </p>
        )}

        <Button type="submit" className="h-10 w-full" disabled={pending || !method || available < minimum}>
          {pending ? t("common.loading") : platform ? (fr ? "Retirer maintenant" : "Withdraw now") : fr ? "Demander le retrait" : "Request payout"}
        </Button>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {platform
            ? fr
              ? "Envoyé immédiatement sur votre Mobile Money via Swychr, au taux du jour. Swychr prélève ses frais sur votre portefeuille."
              : "Sent immediately to your Mobile Money via Swychr at today's rate. Swychr takes its fee from your wallet."
            : fr
            ? `Frais : ${pct(PAYOUT_FEE_LOW_RATE)} en dessous de ${usd(PAYOUT_FEE_THRESHOLD_USD)}, ${pct(PAYOUT_FEE_HIGH_RATE)} à partir de ${usd(PAYOUT_FEE_THRESHOLD_USD)}. Versé par Mobile Money via Swychr.`
            : `Fees: ${pct(PAYOUT_FEE_LOW_RATE)} below ${usd(PAYOUT_FEE_THRESHOLD_USD)}, ${pct(PAYOUT_FEE_HIGH_RATE)} from ${usd(PAYOUT_FEE_THRESHOLD_USD)}. Sent by Mobile Money via Swychr.`}
        </p>
      </form>
    </Panel>
  )
}
