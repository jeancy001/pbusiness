"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { services } from "@/lib/mock-data"
import { ServiceCard } from "@/components/services/service-card"
import { SectionHeading } from "@/components/site/section-heading"
import { Button } from "@/components/ui/button"

export function ServicesPreview() {
  const { t, locale } = useI18n()

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow={locale === "fr" ? "Agence" : "Agency"}
        title={t("section.services.title")}
        subtitle={t("section.services.subtitle")}
        action={
          <Button variant="outline" render={<Link href="/services" />}>
            {t("common.viewAll")}
            <ArrowRight className="size-4" />
          </Button>
        }
      />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.slice(0, 3).map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
    </section>
  )
}
