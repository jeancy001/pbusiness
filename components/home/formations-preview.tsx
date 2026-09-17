"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { formations as allFormations, type Formation } from "@/lib/mock-data"
import { FormationCard } from "@/components/formations/formation-card"
import { Button } from "@/components/ui/button"

export function FormationsPreview({
  formations = allFormations,
}: {
  formations?: Formation[]
}) {
  const { t } = useI18n()

  return (
    <section className="border-y border-[#064E3B]/10 bg-[#064E3B]/[0.02] dark:border-emerald-900/40 dark:bg-emerald-950/[0.08]">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
              {t("section.formations.title")}
            </h2>

            <div className="mt-2 h-1 w-16 rounded-full bg-[#064E3B] dark:bg-emerald-500" />

            <p className="mt-3 text-pretty text-muted-foreground">
              {t("section.formations.subtitle")}
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="border-[#064E3B]/30 text-[#064E3B] hover:bg-[#064E3B] hover:text-white dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-800 dark:hover:text-white"
          >
            <Link href="/formations">
              {t("common.viewAll")}
              <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
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