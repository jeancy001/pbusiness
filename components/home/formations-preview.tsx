"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { formations as allFormations, type Formation } from "@/lib/mock-data"
import { FormationCard } from "@/components/formations/formation-card"
import { SectionHeading } from "@/components/site/section-heading"
import { Button } from "@/components/ui/button"

export function FormationsPreview({ formations = allFormations }: { formations?: Formation[] }) {
  const { t, locale } = useI18n()

  return (
    <section className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={locale === "fr" ? "Catalogue" : "Catalog"}
          title={t("section.formations.title")}
          subtitle={t("section.formations.subtitle")}
          action={
            <Button variant="outline" render={<Link href="/formations" />}>
              {t("common.viewAll")}
              <ArrowRight className="size-4" />
            </Button>
          }
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {formations.slice(0, 3).map((f) => (
            <FormationCard key={f.id} formation={f} />
          ))}
        </div>
      </div>
    </section>
  )
}
