"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  const { t } = useI18n()

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground md:px-16">
        <div className="absolute inset-0 -z-0 opacity-20">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-accent blur-3xl" />
          <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6">
          <h2 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {t("section.cta.title")}
          </h2>
          <p className="text-pretty text-primary-foreground/85">{t("section.cta.subtitle")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">
                {t("common.getStarted")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/quote">{t("common.requestQuote")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
