'use client'

import { Sparkles } from 'lucide-react'
import { FormationCard } from '@/components/formations/formation-card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/context'
import { formations as allFormations, type Formation } from '@/lib/mock-data'

export function Recommendations({ formations = allFormations }: { formations?: Formation[] }) {
  const { t } = useLanguage()
  // Surface the highest-rated / most popular formations as recommendations.
  const recs = [...formations]
    .sort((a, b) => (b.popular === a.popular ? b.rating - a.rating : b.popular ? 1 : -1))
    .slice(0, 3)

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3">
        <Badge variant="brand" className="w-fit">
          <Sparkles className="size-3" />
          {t('common.aiGenerated')}
        </Badge>
        <h2 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {t('section.recommended.title')}
        </h2>
        <p className="max-w-2xl text-pretty text-muted-foreground">{t('section.recommended.subtitle')}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recs.map((f) => (
          <FormationCard key={f.id} formation={f} />
        ))}
      </div>
    </section>
  )
}
