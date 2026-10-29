"use client"

import Link from "next/link"
import { ArrowRight, Globe, Layers, Monitor, Smartphone } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { SectionHeading } from "@/components/site/section-heading"
import { Button } from "@/components/ui/button"

const solutions = [
  { icon: Globe, titleKey: "solution.web.title", descKey: "solution.web.desc" },
  { icon: Smartphone, titleKey: "solution.mobile.title", descKey: "solution.mobile.desc" },
  { icon: Monitor, titleKey: "solution.desktop.title", descKey: "solution.desktop.desc" },
  { icon: Layers, titleKey: "solution.saas.title", descKey: "solution.saas.desc" },
] as const

export function Solutions() {
  const { t, locale } = useI18n()

  return (
    <section className="border-y border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={locale === "fr" ? "Sur mesure" : "Custom builds"}
          title={t("section.solutions.title")}
          subtitle={t("section.solutions.subtitle")}
          action={
            <Button render={<Link href="/quote" />}>
              {t("common.requestQuote")}
              <ArrowRight className="size-4" />
            </Button>
          }
        />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {solutions.map((s) => (
            <div key={s.titleKey} className="group bg-card p-7 transition-colors hover:bg-accent/40">
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#064E3B]/10 text-[#064E3B] transition-colors group-hover:bg-[#064E3B] group-hover:text-white dark:bg-emerald-950/50 dark:text-emerald-400 dark:group-hover:bg-emerald-700">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-5 font-heading text-lg font-semibold">{t(s.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(s.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
