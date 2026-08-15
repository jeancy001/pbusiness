'use client'

import {
  ArrowRight,
  Check,
  Cloud,
  Globe,
  LayoutDashboard,
  type LucideIcon,
  MonitorSmartphone,
  Smartphone,
  Webhook,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'
import { localize, type Service } from '@/lib/mock-data'

const ICONS: Record<string, LucideIcon> = {
  Globe,
  LayoutDashboard,
  Smartphone,
  MonitorSmartphone,
  Cloud,
  Webhook,
}

export function ServiceCard({ service }: { service: Service }) {
  const { t, locale } = useLanguage()
  const Icon = ICONS[service.icon] ?? Globe

  return (
    <Card className="group flex flex-col gap-4 p-6 transition-shadow hover:shadow-md">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-6" />
      </span>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-lg font-semibold leading-snug">{localize(service.title, locale)}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{localize(service.summary, locale)}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {service.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-foreground">
            <Check className="size-4 shrink-0 text-success" />
            {localize(f, locale)}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm font-semibold text-primary">{localize(service.priceLabel, locale)}</span>
        <Button size="sm" variant="ghost" className="h-9 gap-1.5" render={<Link href="/quote" />}>
          {t('common.requestQuote')}
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </Card>
  )
}
