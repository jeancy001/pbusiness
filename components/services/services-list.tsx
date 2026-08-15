"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { services } from "@/lib/mock-data"
import { ServiceCard } from "@/components/services/service-card"
import { Button } from "@/components/ui/button"

export function ServicesList() {
  const { t } = useI18n()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {t("section.services.title")}
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">{t("section.services.subtitle")}</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>

      <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-border bg-muted/40 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">{t("quote.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("quote.subtitle")}</p>
        </div>
        <Button asChild size="lg">
          <Link href="/quote">
            {t("common.requestQuote")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
