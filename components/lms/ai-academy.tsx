"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Award, Bot, Briefcase, CheckCircle2, Code2, Languages, Lock, MessageSquareText, Sparkles, Timer } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/mock-data"
import { AI_COURSE_PRICE_USD, aiModuleSlug, type AiTrack, type AiTrackKind } from "@/lib/lms/catalog"
import { CheckoutDialog } from "@/components/payments/checkout-dialog"
import { Button } from "@/components/ui/button"
import { CertificationPartner, LinkoAcademyLogo } from "@/components/brand/linko-academy-logo"
import { TrackCover, TrackMark } from "@/components/lms/track-cover"
import { RateCourse, RatingSummary } from "@/components/lms/stars"
import { cn } from "@/lib/utils"

const primaryBtn = "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"

export function AiAcademy({
  tracks: allTracks,
  owned,
  completed,
  admin,
  myRatings = {},
}: {
  tracks: AiTrack[]
  owned: string[]
  completed: string[]
  admin: boolean
  /** Stars this learner already gave, keyed "ai:<slug>". */
  myRatings?: Record<string, number>
}) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [kind, setKind] = useState<AiTrackKind>("language")
  const tracks = allTracks.filter((track) => track.kind === kind)
  const kinds = (["language", "programming", "skills"] as const).filter((k) => allTracks.some((track) => track.kind === k))
  const kindLabel = { language: t("lms.languages"), programming: t("lms.programming"), skills: locale === "fr" ? "Compétences pro" : "Professional skills" }
  const KindIcon = { language: Languages, programming: Code2, skills: Briefcase }

  const perks = [
    { icon: MessageSquareText, fr: "Conversation guidée, exercices et corrections", en: "Guided conversation, exercises and corrections" },
    { icon: Timer, fr: "À votre rythme, 24h/24", en: "At your own pace, 24/7" },
    { icon: Languages, fr: "Expliqué en français, anglais, twi, ga ou ewe", en: "Explained in French, English, Twi, Ga or Ewe" },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-[#064E3B] text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <LinkoAcademyLogo tone="light" />
            </span>
            <span className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm ring-1 ring-white/20 sm:inline-flex">
              <Sparkles className="size-4 text-emerald-300" />
              {t("lms.aiTutor")}
            </span>
          </div>
          <h1 className="mt-5 max-w-3xl text-balance font-heading text-4xl font-bold tracking-tight md:text-5xl">
            {locale === "fr"
              ? "Apprenez une langue ou un langage de programmation avec votre tuteur"
              : "Learn a language or a programming language with your own tutor"}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-emerald-50/80">
            {locale === "fr"
              ? "Twi, Ga, Ewe, français, anglais, Python, JavaScript, compétences professionnelles et plus. Payez une fois par cours, terminez chaque module, réussissez l'examen final et recevez votre certificat."
              : "Twi, Ga, Ewe, French, English, Python, JavaScript, professional skills and more. Pay once per course, finish every module, pass the final exam and receive your certificate."}
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-6">
            <div>
              <p className="font-heading text-4xl font-bold">${AI_COURSE_PRICE_USD}</p>
              <p className="text-sm text-emerald-100/70">{t("lms.perModule")} · {locale === "fr" ? "tous les modules inclus" : "all modules included"} · Mobile Money</p>
            </div>
            <CertificationPartner tone="light" className="rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10" />
            <ul className="grid gap-2 text-sm text-emerald-50/90">
              {perks.map((p) => (
                <li key={p.en} className="flex items-center gap-2">
                  <p.icon className="size-4 text-emerald-300" />
                  {locale === "fr" ? p.fr : p.en}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div role="tablist" className="inline-flex rounded-xl border border-border bg-muted/50 p-1">
          {kinds.map((k) => {
            const Icon = KindIcon[k]
            return (
            <button
              key={k}
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                kind === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {kindLabel[k]}
            </button>
            )
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {tracks.map((track) => {
            const bought = owned.includes(track.slug)
            const doneCount = track.modules.filter((_, i) => completed.includes(aiModuleSlug(track.slug, i + 1))).length
            return (
            <article key={track.slug} className="overflow-hidden rounded-2xl border border-border bg-card">
              <TrackCover track={track} className="aspect-[21/9]" />
              <header className="flex items-center gap-4 border-b border-border p-5">
                <span
                  className={cn(
                    "flex h-12 min-w-12 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-[#064E3B]/10 px-2.5 font-heading font-bold text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-400",
                    track.kind === "language" ? "text-xs" : "font-mono text-sm",
                  )}
                >
                  <TrackMark track={track} logoClassName="size-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-lg font-semibold">{localize(track.name, locale)}</h2>
                  <RatingSummary rating={track.rating ?? 5} count={track.ratingCount} />
                  <p className="text-sm text-muted-foreground">
                    {track.modules.length} modules · {bought ? `${doneCount}/${track.modules.length} ${locale === "fr" ? "terminés" : "done"}` : `$${AI_COURSE_PRICE_USD} ${t("lms.perModule")}`}
                  </p>
                </div>
                {admin || bought ? (
                  <span className="shrink-0 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                    {locale === "fr" ? "Débloqué" : "Unlocked"}
                  </span>
                ) : (
                  <CheckoutDialog
                    kind="ai_module"
                    targetSlug={track.slug}
                    amountUsd={AI_COURSE_PRICE_USD}
                    onSuccess={() => router.push(`/academy/${track.slug}-1`)}
                    trigger={
                      <Button size="sm" className={`shrink-0 ${primaryBtn}`}>
                        {t("lms.unlockModule")} · ${AI_COURSE_PRICE_USD}
                      </Button>
                    }
                  />
                )}
              </header>
              {track.description && <p className="border-b border-border px-5 py-3 text-sm text-muted-foreground">{localize(track.description, locale)}</p>}
              <ol className="divide-y divide-border">
                {track.modules.map((mod, i) => {
                  const slug = aiModuleSlug(track.slug, i + 1)
                  const unlocked = admin || bought
                  return (
                    <li key={slug} className="flex items-center gap-3 px-5 py-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        {localize(mod.title, locale)}
                        {mod.advanced && (
                          <span className="ml-2 rounded-full bg-[#B8893B]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A6420] dark:text-amber-300">
                            {locale === "fr" ? "Avancé" : "Advanced"}
                          </span>
                        )}
                      </span>
                      {completed.includes(slug) && <CheckCircle2 className="size-4 shrink-0 text-success" aria-label={locale === "fr" ? "Terminé" : "Completed"} />}
                      {unlocked ? (
                        <Button size="sm" variant="outline" render={<Link href={`/academy/${slug}`} />}>
                          <Bot className="size-4" />
                          {t("lms.aiTutor")}
                          <ArrowRight className="size-3.5" />
                        </Button>
                      ) : (
                        <Lock className="size-4 text-muted-foreground" aria-label={locale === "fr" ? "Verrouillé" : "Locked"} />
                      )}
                    </li>
                  )
                })}
              </ol>
              {bought && (
                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-3">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="size-4 text-[#064E3B] dark:text-emerald-400" />
                    {doneCount === track.modules.length
                      ? locale === "fr" ? "Prêt pour l'examen final" : "Ready for the final exam"
                      : locale === "fr" ? "Terminez tous les modules pour la certification" : "Finish all modules to get certified"}
                  </span>
                  {doneCount === track.modules.length && (
                    <Button size="sm" className={primaryBtn} render={<Link href={`/academy/certification/${track.slug}`} />}>
                      {t("lms.certification")}
                      <ArrowRight className="size-3.5" />
                    </Button>
                  )}
                  <div className="w-full border-t border-border/60 pt-2">
                    <RateCourse kind="ai" slug={track.slug} initial={myRatings[`ai:${track.slug}`]} />
                  </div>
                </footer>
              )}
            </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
