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
    <Card
      className="
        group flex flex-col gap-4 p-6
        border-border
        transition-all duration-200
        hover:border-[#064E3B]/30
        hover:shadow-md
      "
    >
      {/* Service icon */}
      <span
        className="
          flex size-12 items-center justify-center
          rounded-xl
          bg-[#064E3B]/10
          text-[#064E3B]
          transition-all duration-200

          group-hover:bg-[#064E3B]
          group-hover:text-white
          group-hover:shadow-sm

          dark:bg-emerald-950/40
          dark:text-emerald-400
          dark:group-hover:bg-[#064E3B]
          dark:group-hover:text-white
        "
      >
        <Icon className="size-6" />
      </span>

      {/* Title and description */}
      <div className="flex flex-col gap-1.5">
        <h3
          className="
            font-display text-lg font-semibold leading-snug
            transition-colors
            group-hover:text-[#064E3B]
            dark:group-hover:text-emerald-400
          "
        >
          {localize(service.title, locale)}
        </h3>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {localize(service.summary, locale)}
        </p>
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-2">
        {service.features.map((f, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <Check
              className="
                size-4 shrink-0
                text-[#064E3B]
                dark:text-emerald-400
              "
            />

            {localize(f, locale)}
          </li>
        ))}
      </ul>

      {/* Price / Quote */}
      <div
        className="
          mt-auto flex items-center justify-between
          border-t border-border
          pt-4
        "
      >
        <span
          className="
            text-sm font-semibold
            text-[#064E3B]
            dark:text-emerald-400
          "
        >
          {localize(service.priceLabel, locale)}
        </span>

        <Button
          size="sm"
          variant="ghost"
          className="
            h-9 gap-1.5
            text-[#064E3B]
            hover:bg-[#064E3B]/10
            hover:text-[#064E3B]

            dark:text-emerald-400
            dark:hover:bg-emerald-950/40
            dark:hover:text-emerald-300
          "
          render={<Link href="/quote" />}
        >
          {t('common.requestQuote')}

          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </Card>
  )
}