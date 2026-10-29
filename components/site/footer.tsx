'use client'

import Link from 'next/link'
import { Award, ShieldCheck, Smartphone } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { useLanguage } from '@/lib/i18n/context'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import { CERTIFIER_NAME } from '@/lib/lms/catalog'
import { CertificationPartner, LinkoAcademyLogo } from '@/components/brand/linko-academy-logo'

type FooterLink = { href: string; key?: TranslationKey; label?: string }

const COLUMNS: { titleKey: TranslationKey; links: FooterLink[] }[] = [
  {
    titleKey: 'footer.platform',
    links: [
      { href: '/formations', key: 'nav.formations' },
      { href: '/academy', key: 'nav.academy' },
      { href: '/services', key: 'nav.services' },
      { href: '/pricing', key: 'nav.pricing' },
    ],
  },
  {
    titleKey: 'footer.company',
    links: [
      { href: '/quote', key: 'nav.quote' },
      { href: '/contact', key: 'nav.contact' },
      { href: 'https://linkopayroll.com', label: 'Linko Pay' },
      { href: '/login', key: 'nav.login' },
    ],
  },
  {
    titleKey: 'footer.legal',
    links: [
      { href: '/privacy', key: 'footer.privacy' },
      { href: '/terms', key: 'footer.terms' },
      { href: '/refund', key: 'footer.refund' },
    ],
  },
]

export function Footer() {
  const { t, locale } = useLanguage()
  const fr = locale === 'fr'
  const year = new Date().getFullYear()

  const assurances = [
    { icon: Smartphone, label: fr ? 'Paiement Mobile Money' : 'Mobile Money payments' },
    { icon: ShieldCheck, label: fr ? 'Prix vérifiés côté serveur' : 'Server-verified pricing' },
    { icon: Award, label: fr ? `Certifié par ${CERTIFIER_NAME}` : `Certified by ${CERTIFIER_NAME}` },
  ]

  return (
    <footer className="border-t border-border bg-sidebar">
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{t('footer.tagline')}</p>
            <div className="mt-6 flex flex-wrap items-center gap-5">
              <LinkoAcademyLogo />
              <CertificationPartner />
            </div>
            <ul className="mt-6 space-y-2.5">
              {assurances.map((a) => (
                <li key={a.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <a.icon className="size-4 text-[#064E3B] dark:text-emerald-400" />
                  {a.label}
                </li>
              ))}
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.titleKey} aria-label={t(col.titleKey)}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">{t(col.titleKey)}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.key ? t(link.key) : link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} P Business Online. {t('footer.rights')}
          </p>
          <p>Swychr · Gemini AI · WebRTC · Supabase</p>
        </div>
      </div>
    </footer>
  )
}
