'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { services } from '@/lib/mock-data'
import { ServiceCard } from '@/components/services/service-card'
import { Button } from '@/components/ui/button'

export function ServicesList() {
  const { t } = useI18n()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">

      {/* Page header */}
      <header className="mb-10 max-w-2xl">
        <h1
          className="
            text-balance
            font-heading
            text-3xl
            font-bold
            tracking-tight
            text-foreground
            md:text-4xl
          "
        >
          {t('section.services.title')}
        </h1>

        <div className="mt-3 h-1 w-14 rounded-full bg-[#064E3B]" />

        <p className="mt-4 text-pretty text-muted-foreground">
          {t('section.services.subtitle')}
        </p>
      </header>

      {/* Services */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard
            key={s.id}
            service={s}
          />
        ))}
      </div>

      {/* Quote CTA */}
      <div
        className="
          relative mt-12
          overflow-hidden
          rounded-2xl
          border border-[#064E3B]/20
          bg-[#064E3B]
          p-8
          text-white
          shadow-lg
          sm:flex
          sm:items-center
          sm:justify-between
        "
      >
        {/* Decorative glow */}
        <div
          className="
            pointer-events-none
            absolute
            -right-16
            -top-16
            size-40
            rounded-full
            bg-emerald-300/10
            blur-3xl
          "
        />

        <div className="relative">
          <h2 className="font-heading text-xl font-semibold">
            {t('quote.title')}
          </h2>

          <p className="mt-1 text-sm text-emerald-50/75">
            {t('quote.subtitle')}
          </p>
        </div>

        <Button
          asChild
          size="lg"
          className="
            relative
            mt-5
            bg-white
            text-[#064E3B]
            shadow-sm
            hover:bg-emerald-50
            hover:text-[#053D2E]
            sm:mt-0
          "
        >
          <Link href="/quote">
            {t('common.requestQuote')}

            <ArrowRight className="size-4 transition-transform hover:translate-x-0.5" />
          </Link>
        </Button>
      </div>

    </div>
  )
}