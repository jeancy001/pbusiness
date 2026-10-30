"use client"

import { useRouter } from "next/navigation"
import { BadgeCheck, Eye, Home, Sparkles, TrendingUp } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { TEACHER_BADGE_DAYS, TEACHER_BADGE_PRICE_USD } from "@/lib/payments/fees"
import { CheckoutDialog } from "@/components/payments/checkout-dialog"
import { formatDate } from "@/components/lms/ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const blueBtn = "bg-[#1D9BF0] text-white shadow-sm hover:bg-[#1A8CD8]"

/**
 * Certified Teacher offer on the teacher dashboard: the pitch when the badge
 * isn't active, the end date (and renewal) when it is.
 */
export function BadgeOffer({ until, daysLeft }: { until: string | null; daysLeft: number }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const active = daysLeft > 0
  const price = fr ? `${TEACHER_BADGE_PRICE_USD.toFixed(2).replace(".", ",")} $` : `$${TEACHER_BADGE_PRICE_USD.toFixed(2)}`

  const checkout = (label: string) => (
    <CheckoutDialog
      kind="teacher_badge"
      amountUsd={TEACHER_BADGE_PRICE_USD}
      onSuccess={() => router.refresh()}
      trigger={
        <Button className={cn("w-full sm:w-auto", blueBtn)}>
          <BadgeCheck className="size-4" />
          {label}
        </Button>
      }
    />
  )

  if (active) {
    return (
      <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#1D9BF0]/30 bg-[#1D9BF0]/[0.06] p-5 sm:flex-row sm:items-center">
        <BadgeCheck className="size-10 shrink-0 fill-[#1D9BF0] text-white" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-heading font-semibold">{fr ? "Vous êtes Formateur certifié" : "You are a Certified Teacher"}</p>
          <p className="text-sm text-muted-foreground">
            {fr ? "Badge bleu actif jusqu'au" : "Blue badge active until"} <span className="font-medium text-foreground">{formatDate(until!, locale)}</span>
            {" · "}
            {daysLeft} {fr ? (daysLeft > 1 ? "jours restants" : "jour restant") : daysLeft > 1 ? "days left" : "day left"}
          </p>
        </div>
        {daysLeft <= 7 && checkout(fr ? `Prolonger · ${price}` : `Renew · ${price}`)}
      </section>
    )
  }

  const perks = [
    { icon: BadgeCheck, text: fr ? "Badge bleu à côté de votre nom, partout" : "Blue check next to your name, everywhere" },
    { icon: TrendingUp, text: fr ? "Vos cours affichés en premier dans le catalogue" : "Your courses listed first in the catalog" },
    { icon: Home, text: fr ? "Mis en avant sur la page d'accueil" : "Featured on the homepage" },
    { icon: Sparkles, text: fr ? "Recommandé par l'assistant IA" : "Recommended by the AI assistant" },
  ]

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-[#1D9BF0]/30 bg-gradient-to-br from-[#1D9BF0]/10 via-card to-card">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#1D9BF0]/10 px-2.5 py-1 text-xs font-semibold text-[#1D9BF0]">
            <BadgeCheck className="size-3.5" />
            {fr ? "Formateur certifié" : "Certified Teacher"}
          </p>
          <h2 className="mt-3 font-heading text-xl font-semibold">
            {until
              ? fr
                ? "Votre badge a expiré — vos cours sont moins visibles"
                : "Your badge expired — your courses are less visible"
              : fr
                ? "Faites voir vos cours à plus d'étudiants"
                : "Get your courses seen by more students"}
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Eye className="mt-0.5 size-4 shrink-0" />
            {fr
              ? "Sans badge, vos cours n'apparaissent que dans le catalogue, après ceux des formateurs certifiés. Ils ne sont ni sur la page d'accueil, ni recommandés par l'assistant."
              : "Without the badge, your courses only appear in the catalog, after certified teachers' courses. They are not on the homepage or recommended by the assistant."}
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-sm">
                <Icon className="size-4 shrink-0 text-[#1D9BF0]" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-start gap-2 rounded-xl bg-card p-4 ring-1 ring-border lg:items-center lg:text-center">
          <p className="font-heading text-3xl font-bold tabular-nums">
            {price}
            <span className="text-sm font-normal text-muted-foreground"> / {fr ? "mois" : "month"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {fr ? `${TEACHER_BADGE_DAYS} jours · Mobile Money · sans engagement` : `${TEACHER_BADGE_DAYS} days · Mobile Money · no commitment`}
          </p>
          {checkout(fr ? "Obtenir le badge bleu" : "Get the blue badge")}
        </div>
      </div>
    </section>
  )
}
