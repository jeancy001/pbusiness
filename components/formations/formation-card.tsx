'use client'

import {
  ArrowRight,
  BookOpen,
  Clock,
  Lock,
  Star,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'
import {
  categoryLabels,
  type Formation,
  localize,
} from '@/lib/mock-data'

const levelKey = {
  beginner: 'common.beginner',
  intermediate: 'common.intermediate',
  advanced: 'common.advanced',
} as const

export function FormationCard({
  formation,
}: {
  formation: Formation
}) {
  const { t, locale } = useLanguage()

  return (
    <Card
      className="
        group
        overflow-hidden
        border-border
        p-0
        transition-all
        duration-200

        hover:border-[#064E3B]/30
        hover:shadow-md
      "
    >
      {/* Formation image */}
      <Link
        href={`/formations/${formation.slug}`}
        className="
          relative
          block
          aspect-[16/10]
          overflow-hidden
          bg-muted
        "
      >
        <Image
          src={formation.image || '/placeholder.svg'}
          alt={localize(formation.title, locale)}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="
            object-cover
            transition-transform
            duration-500
            group-hover:scale-105
          "
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-2">
          {formation.popular && (
            <Badge
              className="
                border-[#064E3B]/20
                bg-[#064E3B]
                text-white
              "
            >
              {t('common.popular')}
            </Badge>
          )}

          {formation.isNew && (
            <Badge variant="success">
              {t('common.new')}
            </Badge>
          )}
        </div>

        {/* Locked */}
        <div className="absolute right-3 top-3">
          <span
            className="
              inline-flex
              items-center
              gap-1
              rounded-full
              bg-background/85
              px-2
              py-1
              text-[0.7rem]
              font-medium
              text-foreground
              backdrop-blur-sm
            "
          >
            <Lock className="size-3 text-[#064E3B] dark:text-emerald-400" />
            {t('common.locked')}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">

        {/* Category / rating */}
        <div className="flex items-center justify-between gap-2">

          <Badge variant="secondary">
            {localize(
              categoryLabels[formation.category],
              locale,
            )}
          </Badge>

          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Star className="size-3.5 fill-warning text-warning" />
            {formation.rating.toFixed(1)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/formations/${formation.slug}`}>
          <h3
            className="
              font-display
              text-lg
              font-semibold
              leading-snug
              text-balance
              transition-colors

              group-hover:text-[#064E3B]
              dark:group-hover:text-emerald-400
            "
          >
            {localize(formation.title, locale)}
          </h3>
        </Link>

        {/* Summary */}
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {localize(formation.summary, locale)}
        </p>

        {/* Stats */}
        <div
          className="
            mt-auto
            flex
            flex-wrap
            items-center
            gap-x-4
            gap-y-1
            pt-2
            text-xs
            text-muted-foreground
          "
        >
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5 text-[#064E3B] dark:text-emerald-400" />
            {formation.moduleCount} {t('common.modules')}
          </span>

          <span className="flex items-center gap-1">
            <Clock className="size-3.5 text-[#064E3B] dark:text-emerald-400" />
            {formation.durationHours} {t('common.hours')}
          </span>

          <span className="flex items-center gap-1">
            <Users className="size-3.5 text-[#064E3B] dark:text-emerald-400" />
            {formation.studentsCount.toLocaleString(locale)}
          </span>
        </div>

        {/* Price / Details */}
        <div
          className="
            flex
            items-center
            justify-between
            border-t
            border-border
            pt-4
          "
        >
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              {t('common.from')}
            </span>

            <span
              className="
                font-display
                text-xl
                font-bold
                text-[#064E3B]
                dark:text-emerald-400
              "
            >
              ${formation.priceUsd}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="
              h-9
              gap-1.5
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
            render={
              <Link
                href={`/formations/${formation.slug}`}
              />
            }
          >
            {t('common.viewDetails')}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}