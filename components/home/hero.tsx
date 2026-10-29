"use client"

import Link from "next/link"
import { ArrowRight, Award, BadgeCheck, CheckCircle2, PlayCircle, Smartphone, Sparkles, Video } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { CERTIFIER_NAME } from "@/lib/lms/catalog"
import { Button } from "@/components/ui/button"
import { SmartSearch } from "@/components/ai/smart-search"

const stats = [
  { value: "12k+", key: "hero.stat.students" as const },
  { value: "40+", key: "hero.stat.formations" as const },
  { value: "260+", key: "hero.stat.projects" as const },
  { value: "98%", key: "hero.stat.satisfaction" as const },
]

export function Hero() {
  const { t, locale } = useI18n()
  const fr = locale === "fr"

  const trust = [
    { icon: Smartphone, label: "Mobile Money" },
    { icon: BadgeCheck, label: fr ? `Certificats ${CERTIFIER_NAME}` : `${CERTIFIER_NAME} certificates` },
    { icon: Sparkles, label: fr ? "Tuteur" : "Tutor" },
  ]

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Backdrop: soft brand glow + faint grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[1100px] -translate-x-1/2 rounded-full bg-[#064E3B]/[0.07] blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-16 pt-16 sm:px-6 md:pt-24 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pb-24">
        {/* Message */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="size-1.5 rounded-full bg-brand" />
            {t("hero.badge")}
          </span>

          <h1 className="mt-6 text-balance font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {t("hero.title")}
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">{t("hero.subtitle")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-11 px-5" render={<Link href="/formations" />}>
              {t("common.discoverFormations")}
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-5" render={<Link href="/services" />}>
              {t("common.viewServices")}
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {trust.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <item.icon className="size-4 text-[#064E3B] dark:text-emerald-400" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Product preview */}
        <div aria-hidden className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-[#064E3B]/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{fr ? "Mon parcours" : "My learning"}</p>
                <p className="font-heading font-semibold">{fr ? "Développement web full-stack" : "Full-stack web development"}</p>
              </div>
              <span className="rounded-full bg-[#064E3B]/10 px-2.5 py-1 text-xs font-semibold text-[#064E3B] dark:bg-emerald-950/60 dark:text-emerald-400">
                72%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[72%] rounded-full bg-[#064E3B] dark:bg-emerald-500" />
            </div>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
                { done: true, icon: PlayCircle, label: fr ? "Introduction à React" : "Introduction to React" },
                { done: true, icon: PlayCircle, label: fr ? "API REST avec Next.js" : "REST APIs with Next.js" },
                { done: false, icon: Video, label: fr ? "Live : déploiement en production" : "Live: production deployment" },
              ].map((row) => (
                <li key={row.label} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                  {row.done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : (
                    <row.icon className="size-4 shrink-0 text-[#064E3B] dark:text-emerald-400" />
                  )}
                  <span className={row.done ? "text-muted-foreground" : "font-medium"}>{row.label}</span>
                  {!row.done && (
                    <span className="ml-auto flex items-center gap-1 text-xs font-medium text-red-500">
                      <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                      Live
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="absolute -left-4 top-full -mt-4 hidden w-60 rounded-2xl border border-gold/40 bg-card p-4 shadow-xl sm:block lg:-left-10">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Award className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">{CERTIFIER_NAME}</p>
                <p className="text-sm font-medium">{fr ? "Certificat obtenu" : "Certificate earned"}</p>
              </div>
            </div>
          </div>

          <div className="absolute -right-3 -top-6 hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium shadow-lg sm:flex lg:-right-6">
            <Sparkles className="size-3.5 text-[#064E3B] dark:text-emerald-400" />
            {fr ? "Tuteur · Twi, Python…" : "Tutor · Twi, Python…"}
          </div>
        </div>
      </div>

      {/* Search + stats */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <SmartSearch />
        </div>
        <dl className="mx-auto mt-12 grid max-w-4xl grid-cols-2 divide-border overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-4 md:divide-x">
          {stats.map((s) => (
            <div key={s.key} className="px-6 py-5 text-center">
              <dt className="font-heading text-3xl font-bold tabular-nums">{s.value}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{t(s.key)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
