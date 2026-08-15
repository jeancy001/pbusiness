'use client'

import { ArrowRight, BookOpen, Clock, Lock, Star, Users } from 'lucide-react'
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

  return (
    <Card className="group overflow-hidden p-0 transition-shadow hover:shadow-md">
      <Link href={`/formations/${formation.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={formation.image || '/placeholder.svg'}
          alt={localize(formation.title, locale)}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {formation.popular && <Badge variant="brand">{t('common.popular')}</Badge>}
          {formation.isNew && <Badge variant="success">{t('common.new')}</Badge>}
        </div>
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-[0.7rem] font-medium text-foreground backdrop-blur-sm">
            <Lock className="size-3" />
            {t('common.locked')}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{localize(categoryLabels[formation.category], locale)}</Badge>
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Star className="size-3.5 fill-warning text-warning" />
            {formation.rating.toFixed(1)}
          </span>
        </div>

        <Link href={`/formations/${formation.slug}`}>
          <h3 className="font-display text-lg font-semibold leading-snug text-balance transition-colors group-hover:text-primary">
            {localize(formation.title, locale)}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {localize(formation.summary, locale)}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
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
            {formation.studentsCount.toLocaleString(locale)}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{t('common.from')}</span>
            <span className="font-display text-xl font-bold text-foreground">${formation.priceUsd}</span>
          </div>
          <Button size="sm" variant="outline" className="h-9 gap-1.5" render={<Link href={`/formations/${formation.slug}`} />}>
            {t('common.viewDetails')}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
