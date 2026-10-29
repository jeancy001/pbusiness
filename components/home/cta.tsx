"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  const { t } = useI18n()

  return (
    <section className="border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">{t("section.cta.title")}</h2>
          <p className="mt-3 text-pretty text-muted-foreground">{t("section.cta.subtitle")}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Button size="lg" className="h-11 px-5" render={<Link href="/register" />}>
            {t("common.getStarted")}
            <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline" className="h-11 px-5" render={<Link href="/quote" />}>
            {t("common.requestQuote")}
          </Button>
        </div>
      </div>
    </section>
  )
}
