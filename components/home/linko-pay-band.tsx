"use client"

import { ArrowRight, ArrowUpRight, Globe2, Send, Smartphone, UserCheck, Wallet } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"

const LINKO_PAY_URL = "https://linkopayroll.com"

/** Countries where Linko Pay transfers are live (as listed on linkopayroll.com). */
const COUNTRIES = [
  "RD Congo", "Kenya", "Uganda", "Rwanda", "Tanzania", "Congo-Brazzaville", "Cameroun", "Gabon", "Côte d'Ivoire",
  "Sénégal", "Bénin", "Burkina Faso", "Mali", "Niger", "Togo", "Guinée", "Ghana", "Nigeria",
]

export function LinkoPayBand() {
  const { locale } = useI18n()
  const fr = locale === "fr"

  const steps = [
    { icon: Wallet, title: fr ? "Payez avec votre mobile money" : "Pay with your mobile money" },
    { icon: UserCheck, title: fr ? "Choisissez le bénéficiaire" : "Choose the recipient" },
    { icon: Send, title: fr ? "Il reçoit sur son mobile money" : "They receive it on their mobile money" },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-[#064E3B] text-white">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-emerald-300/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-[#D4A646]/10 blur-3xl" />

        <div className="relative grid gap-10 p-8 md:p-12 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <Smartphone className="size-3.5 text-emerald-300" />
              Linko Pay · {fr ? "L'argent, simplement." : "Money, simply."}
            </span>
            <h2 className="mt-5 text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
              {fr ? "Envoyez de l'argent en Afrique, simplement." : "Send money across Africa, simply."}
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-emerald-50/80">
              {fr
                ? "Vous payez avec votre mobile money, votre proche reçoit sur le sien. Disponible dès maintenant dans 18 pays africains."
                : "You pay with your mobile money, your loved one receives it on theirs. Available now in 18 African countries."}
            </p>

            <ol className="mt-7 grid gap-3 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <span className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <s.icon className="size-4" />
                    {fr ? "Étape" : "Step"} {i + 1}
                  </span>
                  <p className="mt-2 text-sm font-medium leading-snug">{s.title}</p>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="h-11 bg-white text-[#064E3B] hover:bg-emerald-50"
                render={<a href={LINKO_PAY_URL} target="_blank" rel="noopener noreferrer" />}
              >
                {fr ? "Commencer gratuitement" : "Start for free"}
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 border-white/25 bg-white/5 text-white hover:bg-white/10 dark:border-white/25 dark:bg-white/5 dark:text-white"
                render={<a href={LINKO_PAY_URL} target="_blank" rel="noopener noreferrer" />}
              >
                linkopayroll.com
                <ArrowUpRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Globe2 className="size-4 text-emerald-300" />
              {fr ? "Disponible maintenant" : "Available now"}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <li key={c} className="rounded-full bg-white/10 px-3 py-1 text-xs text-emerald-50/90">
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-emerald-100/60">
              {fr ? "Bientôt : Zambie, Asie, Europe et Amérique du Nord." : "Coming soon: Zambia, Asia, Europe and North America."}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
