"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { SmartSearch } from "@/components/ai/smart-search"

const stats = [
  { value: "12k+", key: "hero.stat.students" as const },
  { value: "40+", key: "hero.stat.formations" as const },
  { value: "260+", key: "hero.stat.projects" as const },
  { value: "98%", key: "hero.stat.satisfaction" as const },
]

export function Hero() {
  const { t } = useI18n()

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-20 text-center md:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
          <Sparkles className="size-4 text-accent" />
          {t("hero.badge")}
        </span>
        <h1 className="max-w-4xl text-balance font-heading text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          {t("hero.title")}
        </h1>
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {t("hero.subtitle")}
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/formations">
              {t("common.discoverFormations")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/services">{t("common.viewServices")}</Link>
          </Button>
        </div>
        <div className="mt-4 w-full max-w-2xl">
          <SmartSearch />
        </div>
        <dl className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.key} className="rounded-xl border border-border bg-card px-4 py-5">
              <dt className="font-heading text-2xl font-bold text-foreground md:text-3xl">{s.value}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{t(s.key)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
