"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Award,
  BookOpen,
  Check,
  Clock,
  Code2,
  GraduationCap,
  Lock,
  PlayCircle,
  Star,
  Users,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import {
  localize,
  categoryLabels,
  type Formation,
} from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckoutDialog } from "@/components/payments/checkout-dialog"

export function FormationDetail({
  formation,
}: {
  formation: Formation
}) {
  const { t, locale } = useI18n()

  return (
    <article className="mx-auto max-w-6xl px-4 py-12">

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">

        {/* Main content */}
        <div className="min-w-0">

          {/* Badges */}
          <div className="mb-4 flex flex-wrap items-center gap-2">

            <Badge variant="secondary">
              {localize(
                categoryLabels[formation.category],
                locale,
              )}
            </Badge>

            <Badge variant="outline">
              {t(`common.${formation.level}` as const)}
            </Badge>

            {formation.popular && (
              <Badge
                className="bg-[#064E3B] text-white"
              >
                {t("common.popular")}
              </Badge>
            )}

            {formation.isNew && (
              <Badge variant="success">
                {t("common.new")}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1
            className="
              text-balance
              font-heading
              text-3xl
              font-bold
              tracking-tight
              md:text-4xl
            "
          >
            {localize(formation.title, locale)}
          </h1>

          {/* Description */}
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            {localize(formation.description, locale)}
          </p>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">

            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 fill-warning text-warning" />
              {formation.rating.toFixed(1)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-[#064E3B] dark:text-emerald-400" />
              {formation.studentsCount.toLocaleString(locale)}{" "}
              {t("common.students")}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-[#064E3B] dark:text-emerald-400" />
              {formation.durationHours} {t("common.hours")}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-4 text-[#064E3B] dark:text-emerald-400" />
              {formation.moduleCount} {t("common.modules")}
            </span>

          </div>

          {/* Image */}
          <div
            className="
              relative
              mt-8
              aspect-[16/9]
              overflow-hidden
              rounded-2xl
              border
              border-[#064E3B]/15
            "
          >
            <Image
              src={formation.image || "/placeholder.svg"}
              alt={localize(formation.title, locale)}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 640px"
            />
          </div>

          {/* Objectives */}
          <section className="mt-10">

            <h2 className="font-heading text-xl font-semibold">
              {localize(
                {
                  fr: "Objectifs",
                  en: "Objectives",
                },
                locale,
              )}
            </h2>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {formation.objectives.map((o, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
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

                  <span>{localize(o, locale)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Curriculum */}
          <section className="mt-10">

            <div className="flex flex-wrap items-center justify-between gap-2">

              <h2 className="font-heading text-xl font-semibold">
                {localize(
                  {
                    fr: "Programme",
                    en: "Curriculum",
                  },
                  locale,
                )}
              </h2>

              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5 text-[#064E3B] dark:text-emerald-400" />
                {t("common.unlockAfterPayment")}
              </span>

            </div>

            <ol className="mt-4 space-y-2">

              {formation.modules.map((m, i) => {

                // First module is a free preview.
                // Remaining modules are locked until payment.
                const locked = i > 0

                return (
                  <li
                    key={m.id}
                    className={`
                      flex
                      items-center
                      justify-between
                      gap-4
                      rounded-xl
                      border
                      px-4
                      py-3

                      ${
                        locked
                          ? "border-border bg-muted/40"
                          : "border-[#064E3B]/30 bg-card"
                      }
                    `}
                  >

                    <div className="flex min-w-0 items-center gap-3">

                      <span
                        className={`
                          flex
                          size-7
                          shrink-0
                          items-center
                          justify-center
                          rounded-md
                          text-xs
                          font-semibold

                          ${
                            locked
                              ? "bg-muted text-muted-foreground"
                              : "bg-[#064E3B]/10 text-[#064E3B] dark:bg-emerald-950/40 dark:text-emerald-400"
                          }
                        `}
                      >
                        {locked ? (
                          <Lock className="size-3.5" />
                        ) : (
                          <PlayCircle className="size-4" />
                        )}
                      </span>

                      <span
                        className={`
                          truncate
                          text-sm
                          ${locked ? "text-muted-foreground" : ""}
                        `}
                      >
                        {localize(m.title, locale)}
                      </span>

                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">

                      {locked ? (
                        <Badge
                          variant="outline"
                          className="gap-1"
                        >
                          <Lock className="size-3" />
                          {t("common.locked")}
                        </Badge>
                      ) : (
                        <Badge
                          className="
                            bg-[#064E3B]
                            text-white
                            hover:bg-[#053D2E]
                          "
                        >
                          {t("common.freePreview")}
                        </Badge>
                      )}

                      {m.hasSourceCode && (
                        <Code2
                          className="
                            size-4
                            text-[#064E3B]
                            dark:text-emerald-400
                          "
                          aria-label="Source code"
                        />
                      )}

                      <span>
                        {m.lessons} · {m.duration}h
                      </span>

                    </div>
                  </li>
                )
              })}

            </ol>
          </section>

          {/* Prerequisites */}
          <section className="mt-10">

            <h2 className="font-heading text-xl font-semibold">
              {localize(
                {
                  fr: "Prérequis",
                  en: "Prerequisites",
                },
                locale,
              )}
            </h2>

            <ul className="mt-4 space-y-2">

              {formation.prerequisites.map((p, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
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

                  <span>{localize(p, locale)}</span>
                </li>
              ))}

            </ul>
          </section>

        </div>

        {/* Payment sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">

          <div
            className="
              rounded-2xl
              border
              border-[#064E3B]/20
              bg-card
              p-6
              shadow-sm
            "
          >

            {/* Price */}
            <div className="flex items-baseline gap-1">

              <span
                className="
                  font-heading
                  text-3xl
                  font-bold
                  text-[#064E3B]
                  dark:text-emerald-400
                "
              >
                ${formation.priceUsd}
              </span>

              <span className="text-sm text-muted-foreground">
                USD
              </span>

            </div>

            {/* Payment */}
            <CheckoutDialog
              kind="formation"
              targetSlug={formation.slug}
              amountUsd={formation.priceUsd}
              trigger={
                <Button
                  size="lg"
                  className="
                    mt-5
                    w-full
                    bg-[#064E3B]
                    text-white
                    shadow-sm
                    hover:bg-[#053D2E]
                  "
                >
                  {t("common.payNow")}
                </Button>
              }
            />

            {/* View all */}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="
                mt-3
                w-full
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
              <Link href="/formations">
                {t("common.viewAll")}
              </Link>
            </Button>

            {/* Features */}
            <ul className="mt-6 space-y-3 text-sm">

              <FeatureLine
                icon={GraduationCap}
                label={t("feature.videos.title")}
              />

              <FeatureLine
                icon={Code2}
                label={t("feature.sourceCode.title")}
              />

              <FeatureLine
                icon={Award}
                label={t("common.certificate")}
              />

            </ul>

          </div>
        </aside>

      </div>
    </article>
  )
}

function FeatureLine({
  icon: Icon,
  label,
}: {
  icon: typeof Award
  label: string
}) {
  return (
    <li className="flex items-center gap-2 text-muted-foreground">

      <Icon
        className="
          size-4
          text-[#064E3B]
          dark:text-emerald-400
        "
      />

      <span>{label}</span>

    </li>
  )
}