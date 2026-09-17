"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  const { t } = useI18n()

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-[#064E3B]
          px-6
          py-16
          text-center
          text-white
          shadow-xl
          md:px-16
        "
      >
        {/* PB-pay green glow */}
        <div className="absolute inset-0 -z-0 opacity-30">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-emerald-300 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-emerald-200 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6">

          {/* Title */}
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
            {t("section.cta.title")}
          </h2>

          {/* Subtitle */}
          <p className="text-pretty text-emerald-50/85">
            {t("section.cta.subtitle")}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">

            {/* Get Started */}
            <Button
              asChild
              size="lg"
              className="
                bg-white
                text-[#064E3B]
                shadow-sm
                hover:bg-emerald-50
                hover:text-[#053D2E]
              "
            >
              <Link href="/register">
                {t("common.getStarted")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            {/* Request Quote */}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="
                border-white/30
                bg-transparent
                text-white
                hover:border-white/50
                hover:bg-white/10
                hover:text-white
              "
            >
              <Link href="/quote">
                {t("common.requestQuote")}
              </Link>
            </Button>

          </div>
        </div>
      </div>
    </section>
  )
}