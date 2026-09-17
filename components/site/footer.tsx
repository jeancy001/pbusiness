'use client'

import Link from 'next/link'
import { Download, Globe, Smartphone } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { PBPayLogo } from '@/components/ui/pb-pay-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/lib/i18n/context'
import type { TranslationKey } from '@/lib/i18n/dictionary'

const COLUMNS: {
  titleKey: TranslationKey
  links: { href: string; key: TranslationKey }[]
}[] = [
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
    <footer className="border-t border-[#064E3B]/20 bg-sidebar">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">

          {/* Brand / Newsletter */}
          <div className="flex flex-col gap-4">
            <Logo />

            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t('footer.tagline')}
            </p>

            <form
              className="flex max-w-sm gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="email"
                required
                placeholder={t('auth.email')}
                aria-label={t('auth.email')}
                className="
                  h-9
                  border-[#064E3B]/20
                  focus-visible:ring-[#064E3B]
                "
              />

              <Button
                type="submit"
                size="sm"
                className="
                  h-9 shrink-0 px-3
                  bg-[#064E3B]
                  text-white
                  hover:bg-[#053D2E]
                "
              >
                {t('footer.subscribe')}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground">
              {t('footer.newsletter')}
            </p>
          </div>

          {/* Footer columns */}
          {COLUMNS.map((col) => (
            <div
              key={col.titleKey}
              className="flex flex-col gap-3"
            >
              <h3 className="text-sm font-semibold text-foreground">
                {t(col.titleKey)}
              </h3>

              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="
                        text-sm
                        text-muted-foreground
                        transition-colors
                        hover:text-[#064E3B]
                        dark:hover:text-emerald-400
                      "
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* =====================================================
            PB-PAY MOBILE APP
            ===================================================== */}
        <div className="mt-12">
          <div
            className="
              relative overflow-hidden
              rounded-2xl
              border border-[#0A6B50]
              bg-[#064E3B]
              p-5 text-white
              shadow-lg
              md:p-6
            "
          >
            {/* Glow */}
            <div className="absolute -right-16 -top-16 size-40 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              {/* PB-pay branding */}
              <div className="flex items-center gap-4">

                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-md">
                  <PBPayLogo className="size-8" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold">
                      PB-pay
                    </h3>

                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-50 ring-1 ring-white/20">
                      COMING SOON
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-emerald-50/75">
                    Your fintech mobile application is coming soon.
                  </p>
                </div>
              </div>

              {/* App actions */}
              <div className="flex flex-col gap-2 sm:flex-row">

                <Button
                  disabled
                  className="
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

                <Button
                  asChild
                  variant="outline"
                  className="
                    border-white/25
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

            {/* Platforms */}
            <div className="relative mt-4 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4 text-xs text-emerald-50/65">
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="size-3.5" />
                Android & iOS
              </span>

              <span>
                Web application available
              </span>

              <span className="font-medium text-white">
                Mobile app coming soon
              </span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">

          <p className="text-xs text-muted-foreground">
            © {year} P Business Online. {t('footer.rights')}
          </p>

          <p className="text-xs text-muted-foreground">
            Made with AvadaPay · PawaPay · Gemini AI · Supabase
          </p>

        </div>
      </div>
    </footer>
  )
}