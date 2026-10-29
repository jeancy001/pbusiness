"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Clock, Loader2, ShieldCheck, Smartphone, XCircle } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { selectClass } from "@/components/lms/ui"
import { normalizeMobile } from "@/lib/payments/mobile"

export type PaymentKind = "formation" | "subscription" | "project" | "ticket" | "event" | "certificate" | "ai_module"

type Phase = "form" | "processing" | "success" | "failed" | "pending"

type Methods = {
  currency: string
  methods: { method: string; mobileFormat: string; mobileLength: number }[]
  otpRequired: string[]
  usdRate: number | null
  rateUpdatedAt: string | null
  digitalChargeRate: number
}

type CheckoutDialogProps = {
  kind: PaymentKind
  /** Formation slug, event slug, AI module slug… */
  targetSlug?: string
  /** Display-only; the server always computes the amount charged. */
  amountUsd?: number
  trigger: React.ReactNode
  /** Called once the payment is confirmed. */
  onSuccess?: () => void
}

const POLL_EVERY_MS = 3000
const POLL_FOR_MS = 3 * 60_000

const money = (amount: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: currency === "USD" ? 2 : 0 }).format(amount)

export function CheckoutDialog({ kind, targetSlug, amountUsd, trigger, onSuccess }: CheckoutDialogProps) {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const fr = locale === "fr"
  const intl = fr ? "fr-FR" : "en-GB"

  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>("form")
  const [error, setError] = useState<string | null>(null)

  const [countries, setCountries] = useState<string[]>([])
  const [country, setCountry] = useState("")
  const [methods, setMethods] = useState<Methods | null>(null)
  const [loadingMethods, setLoadingMethods] = useState(false)
  const [method, setMethod] = useState("")
  const [mobile, setMobile] = useState("")
  const [otp, setOtp] = useState("")
  const [charged, setCharged] = useState<{ amount: number; currency: string } | null>(null)

  const countryName = useMemo(() => {
    try {
      const names = new Intl.DisplayNames([intl], { type: "region" })
      return (code: string) => names.of(code) ?? code
    } catch {
      return (code: string) => code
    }
  }, [intl])

  // Countries are loaded when the dialog first opens.
  useEffect(() => {
    if (!open || countries.length) return
    fetch("/api/payments/methods")
      .then((r) => r.json())
      .then((data: { ok: boolean; countries?: string[]; error?: string }) => {
        if (!data.ok || !data.countries) return setError(data.error ?? "Payments unavailable")
        const sorted = [...data.countries].sort((a, b) => countryName(a).localeCompare(countryName(b)))
        setCountries(sorted)
      })
      .catch(() => setError(fr ? "Paiements indisponibles." : "Payments unavailable."))
  }, [open, countries.length, countryName, fr])

  // Payment methods and currency follow the chosen country.
  useEffect(() => {
    if (!country) return
    setLoadingMethods(true)
    setMethods(null)
    setMethod("")
    setError(null)
    fetch(`/api/payments/methods?country=${country}`)
      .then((r) => r.json())
      .then((data: Methods & { ok: boolean; error?: string }) => {
        if (!data.ok) return setError(data.error ?? "Unavailable")
        setMethods(data)
        setMethod(data.methods[0]?.method ?? "")
      })
      .catch(() => setError(fr ? "Impossible de charger les moyens de paiement." : "Could not load payment methods."))
      .finally(() => setLoadingMethods(false))
  }, [country, fr])

  const selected = methods?.methods.find((m) => m.method === method)
  const needsOtp = Boolean(methods?.otpRequired.includes(method.toUpperCase()))
  // Mirrors the server: whole local units, rounded up, then Swychr's charge if the customer pays it.
  const local = amountUsd && methods?.usdRate ? Math.ceil(amountUsd * methods.usdRate) : null
  const fee = local !== null && methods?.digitalChargeRate ? Math.ceil(local * (1 + methods.digitalChargeRate)) - local : 0
  const total = local !== null ? local + fee : null

  function close() {
    setOpen(false)
    if (phase === "success") onSuccess?.()
    reset()
  }

  function reset() {
    setPhase("form")
    setError(null)
    setOtp("")
    setCharged(null)
  }

  async function poll(reference: string): Promise<"success" | "failed" | "pending"> {
    const until = Date.now() + POLL_FOR_MS
    while (Date.now() < until) {
      await new Promise((r) => setTimeout(r, POLL_EVERY_MS))
      try {
        const res = await fetch(`/api/payments/status?reference=${encodeURIComponent(reference)}`, { cache: "no-store" })
        const data = (await res.json()) as { status?: string }
        if (data.status === "success" || data.status === "failed") return data.status
      } catch {
        // keep polling
      }
    }
    return "pending"
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const digits = normalizeMobile(country, mobile, selected?.mobileLength ?? 0)
    if (!digits) {
      return setError(
        fr ? `Numéro invalide. Format attendu : ${selected?.mobileFormat}.` : `Invalid number. Expected format: ${selected?.mobileFormat}.`,
      )
    }

    setPhase("processing")
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: kind === "ticket" ? "event" : kind,
          targetSlug,
          country,
          paymentMethod: method,
          mobile: digits,
          omOtp: needsOtp ? otp : undefined,
        }),
      })
      const data = (await res.json()) as {
        ok: boolean
        reference?: string
        amount?: number
        customerTotal?: number
        currency?: string
        error?: string
      }
      if (!data.ok || !data.reference) throw new Error(data.error ?? (fr ? "Paiement impossible." : "Payment failed."))
      if (data.currency) setCharged({ amount: data.customerTotal ?? data.amount ?? 0, currency: data.currency })

      const outcome = await poll(data.reference)
      setPhase(outcome)
      // onSuccess runs when the dialog closes, so the confirmation stays on screen.
    } catch (err) {
      setError((err as Error).message)
      setPhase("form")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        // Don't let a click outside abandon a payment being confirmed.
        if (!value && phase === "processing") return
        if (!value) close()
        else setOpen(true)
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("checkout.title")}</DialogTitle>
          <DialogDescription>
            {fr ? "Payez par Mobile Money dans votre devise locale." : "Pay with Mobile Money in your local currency."}
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{t("checkout.loginRequired")}</p>
            <Button className="w-full" render={<Link href="/login" />}>
              {t("nav.login")}
            </Button>
          </div>
        ) : phase === "form" ? (
          <form onSubmit={pay} className="space-y-4">
            {typeof amountUsd === "number" && (
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("common.price")}</p>
                    <p className="font-heading text-2xl font-bold tabular-nums">{money(amountUsd, "USD", intl)}</p>
                  </div>
                  {total !== null && methods && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{fr ? "À payer" : "You pay"}</p>
                      <p className="font-heading text-xl font-bold tabular-nums">{money(total, methods.currency, intl)}</p>
                    </div>
                  )}
                </div>
                {local !== null && methods && (
                  <dl className="mt-3 space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <dt>
                        1 USD = {methods.usdRate?.toLocaleString(intl, { maximumFractionDigits: 2 })} {methods.currency}
                      </dt>
                      <dd className="tabular-nums">{money(local, methods.currency, intl)}</dd>
                    </div>
                    {fee > 0 && (
                      <div className="flex justify-between">
                        <dt>
                          {fr ? "Frais Swychr" : "Swychr charge"} ({(methods.digitalChargeRate * 100).toLocaleString(intl)} %)
                        </dt>
                        <dd className="tabular-nums">+{money(fee, methods.currency, intl)}</dd>
                      </div>
                    )}
                    {methods.rateUpdatedAt && (
                      <p className="pt-1 text-[11px]">
                        <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                          {fr ? "Taux par ExchangeRate-API" : "Rates by ExchangeRate-API"}
                        </a>{" "}
                        · {new Date(methods.rateUpdatedAt).toLocaleDateString(intl)}
                      </p>
                    )}
                  </dl>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="pay-country">{fr ? "Pays" : "Country"}</Label>
              <select id="pay-country" required value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass}>
                <option value="" disabled>
                  {countries.length ? (fr ? "Choisissez votre pays" : "Choose your country") : t("common.loading")}
                </option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {countryName(c)}
                  </option>
                ))}
              </select>
            </div>

            {loadingMethods && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t("common.loading")}
              </p>
            )}

            {methods && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="pay-method">{t("checkout.network")}</Label>
                  <select id="pay-method" required value={method} onChange={(e) => setMethod(e.target.value)} className={selectClass}>
                    {methods.methods.map((m) => (
                      <option key={m.method} value={m.method}>
                        {m.method}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pay-mobile">{t("checkout.phone")}</Label>
                  <Input
                    id="pay-mobile"
                    required
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder={selected?.mobileFormat}
                  />
                  {selected?.mobileFormat && (
                    <p className="text-xs text-muted-foreground">
                      {fr ? "Format" : "Format"} : {selected.mobileFormat}
                    </p>
                  )}
                </div>

                {needsOtp && (
                  <div className="grid gap-2">
                    <Label htmlFor="pay-otp">{fr ? "Code Orange Money" : "Orange Money code"}</Label>
                    <Input id="pay-otp" required inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    <p className="text-xs text-muted-foreground">
                      {fr
                        ? "Générez le code de paiement depuis votre compte Orange Money, puis saisissez-le ici."
                        : "Generate the payment code from your Orange Money account, then enter it here."}
                    </p>
                  </div>
                )}
              </>
            )}

            {error && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="h-11 w-full" disabled={!methods || !method}>
              <Smartphone className="size-4" />
              {t("checkout.pay")}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              {fr ? "Paiement sécurisé par Swychr" : "Secure payment by Swychr"}
            </p>
          </form>
        ) : (
          <StatusView phase={phase} charged={charged} intl={intl} onRetry={reset} onClose={close} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function StatusView({
  phase,
  charged,
  intl,
  onRetry,
  onClose,
}: {
  phase: Exclude<Phase, "form">
  charged: { amount: number; currency: string } | null
  intl: string
  onRetry: () => void
  onClose: () => void
}) {
  const { t, locale } = useI18n()
  const fr = locale === "fr"

  const view = {
    processing: {
      icon: <Loader2 className="size-10 animate-spin text-[#064E3B] dark:text-emerald-400" />,
      title: t("checkout.pending"),
      body: fr ? "Validez la demande de paiement sur votre téléphone." : "Approve the payment request on your phone.",
    },
    success: {
      icon: <CheckCircle2 className="size-10 text-success" />,
      title: t("checkout.success"),
      body: fr ? "Votre accès est débloqué." : "Your access is unlocked.",
    },
    failed: {
      icon: <XCircle className="size-10 text-destructive" />,
      title: t("checkout.failed"),
      body: fr ? "Aucun montant n'a été débité." : "No money was taken.",
    },
    pending: {
      icon: <Clock className="size-10 text-warning" />,
      title: fr ? "Confirmation en attente" : "Awaiting confirmation",
      body: fr
        ? "Le paiement n'est pas encore confirmé. Votre accès sera débloqué automatiquement dès sa confirmation."
        : "The payment isn't confirmed yet. Your access will unlock automatically as soon as it is.",
    },
  }[phase]

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center" aria-live="polite">
      {view.icon}
      <p className="font-heading text-lg font-semibold">{view.title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{view.body}</p>
      {charged && (
        <p className="text-sm font-medium tabular-nums">
          {new Intl.NumberFormat(intl, { style: "currency", currency: charged.currency, maximumFractionDigits: 0 }).format(charged.amount)}
        </p>
      )}
      {phase === "failed" && (
        <Button className="mt-2" onClick={onRetry}>
          {t("lms.retry")}
        </Button>
      )}
      {(phase === "success" || phase === "pending") && (
        <div className="mt-2 flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {fr ? "Fermer" : "Close"}
          </Button>
          <Button render={<Link href="/dashboard/student" />}>{t("checkout.goToDashboard")}</Button>
        </div>
      )}
    </div>
  )
}
