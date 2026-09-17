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

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

        <div className="max-w-2xl">
          <h2
            className="
              text-balance
              font-heading
              text-3xl
              font-bold
              tracking-tight
              md:text-4xl
            "
          >
            {t("section.services.title")}
          </h2>

          <div className="mt-3 h-1 w-14 rounded-full bg-[#064E3B]" />

          <p className="mt-4 text-pretty text-muted-foreground">
            {t("section.services.subtitle")}
          </p>
        </div>

        {/* View all */}
        <Button
          asChild
          variant="outline"
          className="
            border-[#064E3B]/30
            text-[#064E3B]
            transition-colors

            hover:border-[#064E3B]
            hover:bg-[#064E3B]
            hover:text-white

            dark:border-emerald-800
            dark:text-emerald-400
            dark:hover:bg-[#064E3B]
            dark:hover:text-white
          "
        >
          <Link href="/services">
            {t("common.viewAll")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {/* Services */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.slice(0, 3).map((s) => (
          <ServiceCard
            key={s.id}
            service={s}
          />
        ))}
      </div>

    </section>
  )
}