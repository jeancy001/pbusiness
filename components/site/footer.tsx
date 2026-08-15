'use client'

import Link from 'next/link'
import { Logo } from '@/components/site/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/lib/i18n/context'
import type { TranslationKey } from '@/lib/i18n/dictionary'

const COLUMNS: { titleKey: TranslationKey; links: { href: string; key: TranslationKey }[] }[] = [
  {
    titleKey: 'footer.platform',
    links: [
      { href: '/formations', key: 'nav.formations' },
      { href: '/services', key: 'nav.services' },
      { href: '/pricing', key: 'nav.pricing' },
      { href: '/source-code', key: 'nav.sourceCode' },
    ],
  },
  {
    titleKey: 'footer.company',
    links: [
      { href: '/about', key: 'nav.about' },
      { href: '/work', key: 'nav.work' },
      { href: '/quote', key: 'nav.quote' },
      { href: '/faq', key: 'nav.faq' },
    ],
  },
  {
    titleKey: 'footer.legal',
    links: [
      { href: '/privacy', key: 'footer.privacy' },
      { href: '/terms', key: 'footer.terms' },
      { href: '/refund', key: 'footer.refund' },
      { href: '/contact', key: 'nav.contact' },
    ],
  },
]

export function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-sidebar">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t('footer.tagline')}</p>
            <form className="flex max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input type="email" required placeholder={t('auth.email')} aria-label={t('auth.email')} className="h-9" />
              <Button type="submit" size="sm" className="h-9 shrink-0 px-3">
                {t('footer.subscribe')}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">{t('footer.newsletter')}</p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.titleKey} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">{t(col.titleKey)}</h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} P Business Online. {t('footer.rights')}
          </p>
          <p className="text-xs text-muted-foreground">Made with AvadaPay · PawaPay · Gemini AI · Supabase</p>
        </div>
      </div>
    </footer>
  )
}
