"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { pricing, services, localize } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function PricingView() {
  const { t, locale } = useI18n()

  const formationTiers = [
    {
      key: "pricing.registration",
      price: pricing.registrationFee,
      unit: "",
    },
    {
      key: "pricing.module",
      price: pricing.programmingModule,
      unit: "",
      highlight: true,
    },
    {
      key: "pricing.studentSub",
      price: pricing.studentSubscription,
      unit: t("common.perMonth"),
    },
    {
      key: "pricing.certificate",
      price: pricing.certificate,
      unit: "",
    },
  ] as const

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {t("pricing.title")}
        </h1>

        <div className="mx-auto mt-3 h-1 w-14 rounded-full bg-[#064E3B]" />

        <p className="mt-4 text-pretty text-muted-foreground">
          {t("pricing.subtitle")}
        </p>
      </header>

      {/* =====================================================
          FORMATION PRICING
      ====================================================== */}

      <section>
        <h2 className="mb-6 font-heading text-xl font-semibold">
          {t("pricing.formations")}
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {formationTiers.map((tier) => {
            const highlight =
              "highlight" in tier && tier.highlight

            return (
              <div
                key={tier.key}
                className={`
                  group
                  flex
                  flex-col
                  rounded-2xl
                  border
                  bg-card
                  p-6
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-[#064E3B]/30
                  hover:shadow-md
                  ${
                    highlight
                      ? "border-[#064E3B] ring-1 ring-[#064E3B]/30"
                      : "border-border"
                  }
                `}
              >
                {highlight && (
                  <Badge
                    className="
                      mb-3
                      w-fit
                      bg-[#064E3B]
                      text-white
                      hover:bg-[#053D2E]
                    "
                  >
                    {t("common.popular")}
                  </Badge>
                )}

                <h3 className="text-sm font-medium text-muted-foreground">
                  {t(tier.key)}
                </h3>

                <div className="mt-2 flex items-baseline gap-1">
                  <span
                    className="
                      font-heading
                      text-3xl
                      font-bold
                      text-[#064E3B]
                      dark:text-emerald-400
                    "
                  >
                    ${tier.price}
                  </span>

                  <span className="text-sm text-muted-foreground">
                    {tier.unit || "USD"}
                  </span>
                </div>

                <Button
                  asChild
                  variant={highlight ? "default" : "outline"}
                  className={`
                    mt-6
                    w-full
                    ${
                      highlight
                        ? "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E]"
                        : `
                          border-[#064E3B]/30
                          text-[#064E3B]
                          hover:border-[#064E3B]
                          hover:bg-[#064E3B]
                          hover:text-white
                          dark:border-emerald-800
                          dark:text-emerald-400
                          dark:hover:bg-[#064E3B]
                          dark:hover:text-white
                        `
                    }
                  `}
                >
                  <Link href="/register">
                    {t("common.getStarted")}
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>
      </section>

      {/* =====================================================
          SERVICES PRICING
      ====================================================== */}

      <section className="mt-16">

        <h2 className="mb-2 font-heading text-xl font-semibold">
          {t("pricing.services")}
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          {t("pricing.indicative")}
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="
                group
                flex
                flex-col
                rounded-2xl
                border
                border-border
                bg-card
                p-6
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:border-[#064E3B]/30
                hover:shadow-md
              "
            >
              <h3
                className="
                  font-heading
                  text-lg
                  font-semibold
                  transition-colors
                  group-hover:text-[#064E3B]
                  dark:group-hover:text-emerald-400
                "
              >
                {localize(s.title, locale)}
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  font-medium
                  text-[#064E3B]
                  dark:text-emerald-400
                "
              >
                {localize(s.priceLabel, locale)}
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {s.features.map((f, i) => (
                  <li
                    key={i}
                    className="
                      flex
                      items-start
                      gap-2
                      text-sm
                      text-muted-foreground
                    "
                  >
                    <Check
                      className="
                        mt-0.5
                        size-4
                        shrink-0
                        text-[#064E3B]
                        dark:text-emerald-400
                      "
                    />

                    <span>
                      {localize(f, locale)}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant="outline"
                className="
                  mt-6
                  w-full
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
                <Link href="/quote">
                  {t("common.requestQuote")}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}