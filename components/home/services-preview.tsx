"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { services } from "@/lib/mock-data"
import { ServiceCard } from "@/components/services/service-card"
import { Button } from "@/components/ui/button"

export function ServicesPreview() {
  const { t } = useI18n()

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {t("section.services.title")}
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">{t("section.services.subtitle")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/services">
            {t("common.viewAll")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.slice(0, 3).map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
    </section>
  )
}
