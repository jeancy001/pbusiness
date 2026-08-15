"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { formations as allFormations, type Formation } from "@/lib/mock-data"
import { FormationCard } from "@/components/formations/formation-card"
import { Button } from "@/components/ui/button"

export function FormationsPreview({ formations = allFormations }: { formations?: Formation[] }) {
  const { t } = useI18n()

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
              {t("section.formations.title")}
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">{t("section.formations.subtitle")}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/formations">
              {t("common.viewAll")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {formations.slice(0, 3).map((f) => (
            <FormationCard key={f.id} formation={f} />
          ))}
        </div>
      </div>
    </section>
  )
}
