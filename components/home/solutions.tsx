"use client"

import Link from "next/link"
import { Globe, Smartphone, Monitor, Layers, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"

const solutions = [
  { icon: Globe, titleKey: "solution.web.title", descKey: "solution.web.desc" },
  { icon: Smartphone, titleKey: "solution.mobile.title", descKey: "solution.mobile.desc" },
  { icon: Monitor, titleKey: "solution.desktop.title", descKey: "solution.desktop.desc" },
  { icon: Layers, titleKey: "solution.saas.title", descKey: "solution.saas.desc" },
] as const

export function Solutions() {
  const { t } = useI18n()

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
              {t("section.solutions.title")}
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">{t("section.solutions.subtitle")}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/quote">
              {t("common.requestQuote")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {solutions.map((s) => (
            <div
              key={s.titleKey}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold">{t(s.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(s.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
