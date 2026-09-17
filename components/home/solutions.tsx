"use client"

import Link from "next/link"
import {
  Globe,
  Smartphone,
  Monitor,
  Layers,
  ArrowRight,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"

const solutions = [
  {
    icon: Globe,
    titleKey: "solution.web.title",
    descKey: "solution.web.desc",
  },
  {
    icon: Smartphone,
    titleKey: "solution.mobile.title",
    descKey: "solution.mobile.desc",
  },
  {
    icon: Monitor,
    titleKey: "solution.desktop.title",
    descKey: "solution.desktop.desc",
  },
  {
    icon: Layers,
    titleKey: "solution.saas.title",
    descKey: "solution.saas.desc",
  },
] as const

export function Solutions() {
  const { t } = useI18n()

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20">

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
              {t("section.solutions.title")}
            </h2>

            <div className="mt-3 h-1 w-14 rounded-full bg-[#064E3B]" />

            <p className="mt-4 text-pretty text-muted-foreground">
              {t("section.solutions.subtitle")}
            </p>
          </div>

          {/* CTA */}
          <Button
            asChild
            variant="outline"
            className="
              border-[#064E3B]/30
              text-[#064E3B]
              hover:border-[#064E3B]
              hover:bg-[#064E3B]
              hover:text-white

              dark:border-emerald-800
              dark:text-emerald-400
              dark:hover:bg-[#064E3B]
              dark:hover:text-white
            "
          >
            <Link href="/quote">
              {t("common.requestQuote")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {/* Solutions */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {solutions.map((s) => {
            const Icon = s.icon

            return (
              <div
                key={s.titleKey}
                className="
                  group flex flex-col
                  rounded-2xl
                  border border-border
                  bg-card
                  p-6
                  transition-all duration-200

                  hover:border-[#064E3B]/40
                  hover:shadow-md
                "
              >
                {/* Icon */}
                <span
                  className="
                    flex size-11
                    items-center justify-center
                    rounded-xl
                    bg-[#064E3B]/10
                    text-[#064E3B]
                    transition-all duration-200

                    group-hover:bg-[#064E3B]
                    group-hover:text-white
                    group-hover:shadow-sm

                    dark:bg-emerald-950/40
                    dark:text-emerald-400
                    dark:group-hover:bg-[#064E3B]
                    dark:group-hover:text-white
                  "
                >
                  <Icon className="size-5" />
                </span>

                {/* Title */}
                <h3
                  className="
                    mt-4
                    font-heading
                    text-lg
                    font-semibold
                    transition-colors

                    group-hover:text-[#064E3B]
                    dark:group-hover:text-emerald-400
                  "
                >
                  {t(s.titleKey)}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(s.descKey)}
                </p>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}