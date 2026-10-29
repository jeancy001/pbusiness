'use client'

import { ArrowRight, Award, BookOpen, Clock, Users } from 'lucide-react'
import { RatingSummary } from '@/components/lms/stars'
import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'
import { categoryLabels, type Formation, localize } from '@/lib/mock-data'

const levelKey = {
  beginner: 'common.beginner',
  intermediate: 'common.intermediate',
  advanced: 'common.advanced',
} as const

export function FormationCard({ formation }: { formation: Formation }) {
  const { t, locale } = useLanguage()
  const href = `/formations/${formation.slug}`
  const numberLocale = locale === 'fr' ? 'fr-FR' : 'en-GB'

  return (
    <Card className="group flex h-full flex-col gap-0 overflow-hidden border-border p-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#064E3B]/30 hover:shadow-lg">
      <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-muted">
        <Image
          src={formation.image || '/placeholder.svg'}
          alt={localize(formation.title, locale)}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />

        <div className="absolute left-3 top-3 flex gap-2">
          {formation.popular && <Badge className="border-transparent bg-[#064E3B] text-white">{t('common.popular')}</Badge>}
          {formation.isNew && <Badge className="border-transparent bg-white text-[#064E3B]">{t('common.new')}</Badge>}
        </div>

        <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[0.7rem] font-medium text-white backdrop-blur-sm">
          {t(levelKey[formation.level])}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-sm">
          <RatingSummary rating={formation.rating} count={formation.ratingCount} light />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-[#064E3B] dark:text-emerald-400">
          {localize(categoryLabels[formation.category], locale)}
        </p>

        <Link href={href} className="mt-2">
          <h3 className="text-balance font-display text-lg font-semibold leading-snug transition-colors group-hover:text-[#064E3B] dark:group-hover:text-emerald-400">
            {localize(formation.title, locale)}
          </h3>
        </Link>

        {formation.teacherName && <p className="mt-1 text-xs text-muted-foreground">{formation.teacherName}</p>}

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{localize(formation.summary, locale)}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {formation.moduleCount} {t('common.modules')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {formation.durationHours} {t('common.hours')}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {formation.studentsCount.toLocaleString(numberLocale)}
          </span>
          <span className="flex items-center gap-1 text-[#B8893B]">
            <Award className="size-3.5" />
            {t('common.certificate')}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="font-display text-2xl font-bold tabular-nums">
            {formation.priceUsd > 0 ? `$${formation.priceUsd}` : locale === 'fr' ? 'Gratuit' : 'Free'}
          </span>
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-[#064E3B] text-white hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"
            render={<Link href={href} />}
          >
            {t('common.viewDetails')}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
