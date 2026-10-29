"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, Smartphone, Sparkles, Ticket, Users } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/mock-data"
import type { EventView } from "@/lib/events/data"
import { registerFreeEventAction } from "@/lib/events/actions"
import { CheckoutDialog } from "@/components/payments/checkout-dialog"
import { FormError, formatDateTime } from "@/components/lms/ui"
import { Button } from "@/components/ui/button"

const buyBtn = "mt-6 w-full gap-2 bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E]"

export function EventCard({ event: e }: { event: EventView }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ticketCode, setTicketCode] = useState<string | null>(null)
  const free = e.priceUsd === 0
  const when = e.startAt ? formatDateTime(e.startAt, locale) : fr ? "Date bientôt annoncée" : "Date coming soon"

  function register() {
    setError(null)
    start(async () => {
      const res = await registerFreeEventAction(e.slug)
      if (!res.ok) {
        if (res.error.startsWith("Log in")) return router.push("/login")
        return setError(res.error)
      }
      setTicketCode(res.data!.code)
    })
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#064E3B] text-white shadow-xl">
      <div className="pointer-events-none absolute right-0 top-0 size-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="relative grid gap-8 p-6 md:grid-cols-[1.4fr_1fr] md:p-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-emerald-50 ring-1 ring-white/20">
            <CalendarDays className="size-4" />
            {fr ? "Événement à venir" : "Upcoming event"}
          </span>
          <h2 className="mt-5 max-w-2xl font-heading text-3xl font-bold tracking-tight">{localize(e.title, locale)}</h2>
          <p className="mt-4 max-w-2xl whitespace-pre-line leading-relaxed text-emerald-50/80">{localize(e.description, locale)}</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-emerald-300" />
              {when}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-emerald-300" />
              {e.location}
            </span>
            {e.audience && (
              <span className="flex items-center gap-2">
                <Users className="size-4 text-emerald-300" />
                {e.audience}
              </span>
            )}
          </div>
          {e.highlights.length > 0 && (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {e.highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 text-sm text-emerald-50/90">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                    <Sparkles className="size-3.5 text-emerald-300" />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="rounded-2xl bg-white p-6 text-foreground shadow-xl dark:bg-card">
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#064E3B]/10 text-[#064E3B]">
                <Ticket className="size-5" />
              </span>
              <span className="font-heading text-2xl font-bold">{free ? (fr ? "Gratuit" : "Free") : `$${e.priceUsd}`}</span>
            </div>
            <dl className="mt-6 space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              {[
                ["Type", fr ? "Événement" : "Event"],
                [fr ? "Durée" : "Duration", e.duration],
                [fr ? "Lieu" : "Location", e.location],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            {ticketCode ? (
              <div className="mt-6 rounded-xl bg-success/10 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-success">
                  <CheckCircle2 className="size-4" />
                  {fr ? "Inscription confirmée" : "You're registered"}
                </p>
                <a href={`/api/tickets/${ticketCode}/pdf`} target="_blank" rel="noreferrer" className="mt-2 inline-flex font-medium text-[#064E3B] underline dark:text-emerald-400">
                  {fr ? "Télécharger mon billet" : "Download my ticket"} · {ticketCode}
                </a>
              </div>
            ) : free ? (
              <Button size="lg" className={buyBtn} disabled={pending} onClick={register}>
                <Ticket className="size-4" />
                {fr ? "Je m'inscris" : "Register"}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {fr
                    ? "Payez votre billet par Mobile Money. Le montant est calculé par notre serveur, puis votre billet personnel est généré automatiquement."
                    : "Pay for your ticket with Mobile Money. The amount is calculated by our server, then your personal ticket is generated automatically."}
                </p>
                <CheckoutDialog
                  kind="event"
                  targetSlug={e.slug}
                  amountUsd={e.priceUsd}
                  onSuccess={() => router.push("/dashboard/student#tickets")}
                  trigger={
                    <Button size="lg" className={buyBtn}>
                      <Ticket className="size-4" />
                      {fr ? "Acheter mon billet" : "Buy my ticket"}
                      <ArrowRight className="size-4" />
                    </Button>
                  }
                />
                <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Smartphone className="size-4 text-[#064E3B] dark:text-emerald-400" />
                  {fr ? "Paiement sécurisé par Mobile Money" : "Secure Mobile Money payment"}
                </p>
              </>
            )}
            <div className="mt-2">
              <FormError message={error} />
            </div>
            {!ticketCode && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {fr ? "Vos billets sont aussi dans votre " : "Your tickets are also in your "}
                <Link href="/dashboard/student#tickets" className="underline">
                  {fr ? "tableau de bord" : "dashboard"}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
