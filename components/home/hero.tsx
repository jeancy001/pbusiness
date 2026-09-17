"use client"

import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Globe,
  Download,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { SmartSearch } from "@/components/ai/smart-search"
import { PBPayLogo } from "../ui/pb-pay-logo"

const stats = [
  { value: "12k+", key: "hero.stat.students" as const },
  { value: "40+", key: "hero.stat.formations" as const },
  { value: "260+", key: "hero.stat.projects" as const },
  { value: "98%", key: "hero.stat.satisfaction" as const },
]

export function Hero() {
  const { t } = useI18n()

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-20 text-center md:py-28">

        {/* Badge */}
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
          <Sparkles className="size-4 text-accent" />
          {t("hero.badge")}
        </span>

        {/* Heading */}
        <h1 className="max-w-4xl text-balance font-heading text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          {t("hero.title")}
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {t("hero.subtitle")}
        </p>

        {/* Main actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/formations">
              {t("common.discoverFormations")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline">
            <Link href="/services">
              {t("common.viewServices")}
            </Link>
          </Button>
        </div>

        {/* =====================================================
            PB-PAY MOBILE APP
            ===================================================== */}
        <div className="w-full max-w-4xl">
          <div
            className="
              relative overflow-hidden rounded-3xl
              border border-emerald-800/30
              bg-[#064E3B]
              p-6 text-white
              shadow-xl
              md:p-8
            "
          >
            {/* Green glow */}
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative flex flex-col items-center gap-6 md:flex-row md:justify-between md:text-left">

              {/* PB-pay identity */}
              <div className="flex items-start gap-4">

                {/* PB-pay icon */}
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg">
                  <PBPayLogo className="size-11" />
                </div>

                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-2xl font-bold">
                      PB-pay
                    </h2>

                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-50 ring-1 ring-white/20">
                      Coming Soon
                    </span>
                  </div>

                  <p className="max-w-xl text-sm leading-relaxed text-emerald-50/80">
                    The upcoming PB-pay fintech mobile application.
                    Manage your payments, transactions and financial
                    services directly from your smartphone.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row md:flex-col">

                {/* Mobile app */}
                <Button
                  size="lg"
                  disabled
                  className="
                    w-full sm:w-auto md:min-w-[190px]
                    bg-white
                    text-[#064E3B]
                    hover:bg-emerald-50
                    disabled:cursor-not-allowed
                    disabled:opacity-100
                  "
                >
                  <Download className="size-4" />
                  Download App
                </Button>

                {/* Web app */}
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="
                    w-full sm:w-auto md:min-w-[190px]
                    border-white/30
                    bg-white/5
                    text-white
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  <Link href="/pb-pay">
                    <Globe className="size-4" />
                    Use Web App
                  </Link>
                </Button>

              </div>
            </div>

            {/* Availability */}
            <div
              className="
                relative mt-6 flex flex-wrap
                items-center justify-center
                gap-x-6 gap-y-2
                border-t border-white/15
                pt-5 text-xs text-emerald-50/70
                md:justify-start
              "
            >
              <span>Android & iOS</span>

              <span>Web application available</span>

              <span className="font-semibold text-white">
                Mobile app coming soon
              </span>
            </div>
          </div>
        </div>

        {/* AI Search */}
        <div className="mt-2 w-full max-w-2xl">
          <SmartSearch />
        </div>

        {/* Stats */}
        <dl className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.key}
              className="rounded-xl border border-border bg-card px-4 py-5"
            >
              <dt className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                {s.value}
              </dt>

              <dd className="mt-1 text-sm text-muted-foreground">
                {t(s.key)}
              </dd>
            </div>
          ))}
        </dl>

      </div>
    </section>
  )
}