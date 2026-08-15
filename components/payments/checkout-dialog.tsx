"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Provider = "pawapay" | "avadapay"
type Phase = "form" | "processing" | "success" | "failed"

const NETWORKS: Record<string, string> = {
  MTN_MOMO_RWA: "MTN MoMo (Rwanda)",
  AIRTEL_RWA: "Airtel Money (Rwanda)",
  MTN_MOMO_CMR: "MTN MoMo (Cameroun)",
  ORANGE_CMR: "Orange Money (Cameroun)",
  MPESA_KEN: "M-Pesa (Kenya)",
}

export function CheckoutDialog({
  kind,
  targetSlug,
  amountUsd,
  trigger,
}: {
  kind: "formation" | "subscription" | "project"
  targetSlug?: string
  amountUsd: number
  trigger: React.ReactNode
}) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState<Provider>("pawapay")
  const [network, setNetwork] = useState<string>("MTN_MOMO_RWA")
  const [phone, setPhone] = useState("")
  const [phase, setPhase] = useState<Phase>("form")
  const [simulated, setSimulated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pollStatus(reference: string) {
    // Poll up to ~30s for a final status.
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      const res = await fetch(`/api/payments/status?reference=${encodeURIComponent(reference)}`)
      const data = await res.json()
      if (data.status === "success") return "success"
      if (data.status === "failed") return "failed"
    }
    return "failed"
  }

  async function handlePay() {
    setError(null)
    setPhase("processing")
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, kind, targetSlug, phone, network, currency: "USD" }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Payment failed")
      setSimulated(Boolean(data.simulated))

      if (data.status === "success") {
        setPhase("success")
        return
      }
      const final = await pollStatus(data.reference)
      setPhase(final === "success" ? "success" : "failed")
    } catch (err) {
      setError((err as Error).message)
      setPhase("failed")
    }
  }

  function reset() {
    setPhase("form")
    setError(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="size-5 text-primary" />
            {t("checkout.title")}
          </DialogTitle>
          <DialogDescription>{t("checkout.subtitle")}</DialogDescription>
        </DialogHeader>

        {!user && phase === "form" && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {t("checkout.loginRequired")}{" "}
            <Link href="/login" className="font-medium text-primary underline">
              {t("nav.login")}
            </Link>
          </p>
        )}

        {phase === "form" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">{t("common.amount")}</span>
              <span className="font-heading text-xl font-bold">${amountUsd}</span>
            </div>

            <div className="grid gap-2">
              <Label>{t("checkout.provider")}</Label>
              <Select value={provider} onValueChange={(v) => v && setProvider(v as Provider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pawapay">PawaPay</SelectItem>
                  <SelectItem value="avadapay">AvadaPay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t("checkout.network")}</Label>
              <Select value={network} onValueChange={(v) => v && setNetwork(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NETWORKS).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">{t("checkout.phone")}</Label>
              <Input
                id="phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("checkout.phonePlaceholder")}
              />
            </div>

            <Button size="lg" onClick={handlePay} disabled={phone.trim().length < 6}>
              {t("checkout.pay")} ${amountUsd}
            </Button>
          </div>
        )}

        {phase === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("checkout.pending")}</p>
          </div>
        )}

        {phase === "success" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="size-12 text-success" />
            <p className="font-medium">{t("checkout.success")}</p>
            {simulated && <p className="text-xs text-muted-foreground">{t("checkout.simulated")}</p>}
            <Button asChild className="mt-2 w-full">
              <Link href="/dashboard/student">{t("checkout.goToDashboard")}</Link>
            </Button>
          </div>
        )}

        {phase === "failed" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <XCircle className="size-12 text-destructive" />
            <p className="font-medium">{error ?? t("checkout.failed")}</p>
            <Button variant="outline" className="mt-2 w-full" onClick={reset}>
              {t("common.previous")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
