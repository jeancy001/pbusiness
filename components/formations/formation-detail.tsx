"use client"

import Image from "next/image"
import Link from "next/link"
import { Award, BookOpen, Check, Clock, Code2, GraduationCap, Lock, PlayCircle, Star, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { localize, categoryLabels, type Formation } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckoutDialog } from "@/components/payments/checkout-dialog"

export function FormationDetail({ formation }: { formation: Formation }) {
  const { t, locale } = useI18n()

  return (
    <article className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{localize(categoryLabels[formation.category], locale)}</Badge>
            <Badge variant="outline">{t(`common.${formation.level}` as const)}</Badge>
            {formation.popular && <Badge variant="brand">{t("common.popular")}</Badge>}
            {formation.isNew && <Badge variant="success">{t("common.new")}</Badge>}
          </div>
          <h1 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {localize(formation.title, locale)}
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            {localize(formation.description, locale)}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 fill-warning text-warning" /> {formation.rating.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" /> {formation.studentsCount.toLocaleString()} {t("common.students")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" /> {formation.durationHours} {t("common.hours")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-4" /> {formation.moduleCount} {t("common.modules")}
            </span>
          </div>

          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border">
            <Image
              src={formation.image || "/placeholder.svg"}
              alt={localize(formation.title, locale)}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 640px"
            />
          </div>

          <section className="mt-10">
            <h2 className="font-heading text-xl font-semibold">{localize({ fr: "Objectifs", en: "Objectives" }, locale)}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {formation.objectives.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{localize(o, locale)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-xl font-semibold">
                {localize({ fr: "Programme", en: "Curriculum" }, locale)}
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5" />
                {t("common.unlockAfterPayment")}
              </span>
            </div>
            <ol className="mt-4 space-y-2">
              {formation.modules.map((m, i) => {
                // The first module is a free preview; all others are locked until payment.
                const locked = i > 0
                return (
                  <li
                    key={m.id}
                    className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
                      locked ? "border-border bg-muted/40" : "border-primary/30 bg-card"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                          locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {locked ? <Lock className="size-3.5" /> : <PlayCircle className="size-4" />}
                      </span>
                      <span className={`truncate text-sm ${locked ? "text-muted-foreground" : ""}`}>
                        {localize(m.title, locale)}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      {locked ? (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="size-3" />
                          {t("common.locked")}
                        </Badge>
                      ) : (
                        <Badge variant="success">{t("common.freePreview")}</Badge>
                      )}
                      {m.hasSourceCode && <Code2 className="size-4 text-brand" aria-label="Source code" />}
                      <span>
                        {m.lessons} · {m.duration}h
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>

          <section className="mt-10">
            <h2 className="font-heading text-xl font-semibold">
              {localize({ fr: "Prérequis", en: "Prerequisites" }, locale)}
            </h2>
            <ul className="mt-4 space-y-2">
              {formation.prerequisites.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{localize(p, locale)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-3xl font-bold">${formation.priceUsd}</span>
              <span className="text-sm text-muted-foreground">USD</span>
            </div>
            <CheckoutDialog
              kind="formation"
              targetSlug={formation.slug}
              amountUsd={formation.priceUsd}
              trigger={
                <Button size="lg" className="mt-5 w-full">
                  {t("common.payNow")}
                </Button>
              }
            />
            <Button asChild variant="outline" size="lg" className="mt-3 w-full">
              <Link href={`/formations`}>{t("common.viewAll")}</Link>
            </Button>
            <ul className="mt-6 space-y-3 text-sm">
              <FeatureLine icon={GraduationCap} label={t("feature.videos.title")} />
              <FeatureLine icon={Code2} label={t("feature.sourceCode.title")} />
              <FeatureLine icon={Award} label={t("common.certificate")} />
            </ul>
          </div>
        </aside>
      </div>
    </article>
  )
}

function FeatureLine({ icon: Icon, label }: { icon: typeof Award; label: string }) {
  return (
    <li className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-4 text-primary" />
      <span>{label}</span>
    </li>
  )
}
