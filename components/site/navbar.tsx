'use client'

import { LayoutDashboard, LogIn, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LanguageToggle } from '@/components/site/language-toggle'
import { Logo } from '@/components/site/logo'
import { ThemeToggle } from '@/components/site/theme-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/context'
import { useLanguage } from '@/lib/i18n/context'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import { cn } from '@/lib/utils'

const NAV_LINKS: { href: string; key: TranslationKey }[] = [
  { href: '/formations', key: 'nav.formations' },
  { href: '/services', key: 'nav.services' },
  { href: '/pricing', key: 'nav.pricing' },
  { href: '/source-code', key: 'nav.sourceCode' },
  { href: '/quote', key: 'nav.quote' },
  { href: '/contact', key: 'nav.contact' },
]

function dashboardPath(role?: string) {
  if (role === 'client') return '/dashboard/client'
  if (role === 'admin' || role === 'super-admin') return '/dashboard/admin'
  return '/dashboard/student'
}

export function Navbar() {
  const { t } = useLanguage()
  const { isAuthenticated, user } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)

    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-colors',
        scrolled
          ? 'border-border bg-background/85 backdrop-blur-lg'
          : 'border-transparent bg-background',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Logo />

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Navigation principale"
        >
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'text-[#064E3B]'
                    : 'text-muted-foreground hover:text-[#064E3B]',
                )}
              >
                {t(link.key)}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">

          <div className="hidden items-center gap-2 sm:flex">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          {/* Authenticated */}
          {isAuthenticated ? (
            <Button
              size="sm"
              className="
                hidden h-9 gap-1.5 px-3
                bg-[#064E3B]
                text-white
                hover:bg-[#053D2E]
                sm:inline-flex
              "
              render={
                <Link href={dashboardPath(user?.role)} />
              }
            >
              <LayoutDashboard className="size-3.5" />
              {t('nav.dashboard')}
            </Button>
          ) : (
            /* Guest */
            <div className="hidden items-center gap-2 sm:flex">

              <Button
                variant="ghost"
                size="sm"
                className="
                  h-9 px-3
                  hover:bg-emerald-50
                  hover:text-[#064E3B]
                  dark:hover:bg-emerald-950/30
                "
                render={<Link href="/login" />}
              >
                {t('nav.login')}
              </Button>

              <Button
                size="sm"
                className="
                  h-9 px-3
                  bg-[#064E3B]
                  text-white
                  hover:bg-[#053D2E]
                "
                render={<Link href="/register" />}
              >
                {t('nav.register')}
              </Button>

            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="icon"
            className="
              border-[#064E3B]/30
              text-[#064E3B]
              hover:bg-emerald-50
              hover:text-[#064E3B]
              lg:hidden
              dark:border-emerald-800
              dark:text-emerald-400
              dark:hover:bg-emerald-950/30
            "
            onClick={() => setOpen((v) => !v)}
            aria-label={t('nav.menu')}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6"
            aria-label="Navigation mobile"
          >
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-emerald-50 text-[#064E3B] dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'text-foreground hover:bg-emerald-50 hover:text-[#064E3B] dark:hover:bg-emerald-950/30',
                  )}
                >
                  {t(link.key)}
                </Link>
              )
            })}

            {/* Language + theme */}
            <div className="mt-2 flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {/* Mobile auth */}
            <div className="mt-2 flex flex-col gap-2">
              {isAuthenticated ? (
                <Button
                  className="
                    h-10 w-full gap-1.5
                    bg-[#064E3B]
                    text-white
                    hover:bg-[#053D2E]
                  "
                  render={
                    <Link href={dashboardPath(user?.role)} />
                  }
                >
                  <LayoutDashboard className="size-4" />
                  {t('nav.dashboard')}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="
                      h-10 w-full gap-1.5
                      border-[#064E3B]/30
                      text-[#064E3B]
                      hover:bg-emerald-50
                      hover:text-[#064E3B]
                      dark:border-emerald-800
                      dark:text-emerald-400
                    "
                    render={<Link href="/login" />}
                  >
                    <LogIn className="size-4" />
                    {t('nav.login')}
                  </Button>

                  <Button
                    className="
                      h-10 w-full
                      bg-[#064E3B]
                      text-white
                      hover:bg-[#053D2E]
                    "
                    render={<Link href="/register" />}
                  >
                    {t('nav.register')}
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}