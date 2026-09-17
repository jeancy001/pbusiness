"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, LogOut, Menu, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { Logo } from "@/components/site/logo"
import { LanguageToggle } from "@/components/site/language-toggle"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { notifications } from "@/lib/mock-data"
import { localize } from "@/lib/mock-data"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import { cn } from "@/lib/utils"

export type NavItem = {
  href: string
  labelKey: TranslationKey
  icon: LucideIcon
}

export function DashboardShell({
  nav,
  titleKey,
  children,
}: {
  nav: NavItem[]
  titleKey: TranslationKey
  children: React.ReactNode
}) {
  const { t, locale } = useI18n()
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const unread = notifications.filter((n) => n.unread).length

  async function handleLogout() {
    await logout()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-[#064E3B]/[0.025] dark:bg-emerald-950/[0.08]">
      {/* Sidebar */}
      <aside
        className={cn(
          `
            fixed inset-y-0 left-0 z-40 flex w-64 flex-col
            border-r border-[#064E3B]/10 bg-card
            transition-transform duration-200
            dark:border-emerald-900/40
          `,
          "lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar header */}
        <div
          className="
            flex items-center justify-between
            border-b border-[#064E3B]/10
            px-5 py-4
            dark:border-emerald-900/40
          "
        >
          <Logo />

          <button
            type="button"
            className="
              rounded-md p-1.5
              text-muted-foreground
              transition-colors
              hover:bg-[#064E3B]/10
              hover:text-[#064E3B]
              lg:hidden
              dark:hover:bg-emerald-950/50
              dark:hover:text-emerald-400
            "
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item, i) => {
            const active = pathname === item.href

            return (
              <Link
                key={`${item.labelKey}-${i}`}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  `
                    group flex items-center gap-3 rounded-lg
                    px-3 py-2 text-sm font-medium
                    transition-all duration-150
                  `,
                  active
                    ? `
                      bg-[#064E3B] text-white shadow-sm
                      hover:bg-[#053D2E]
                      dark:bg-emerald-800
                      dark:hover:bg-emerald-700
                    `
                    : `
                      text-muted-foreground
                      hover:bg-[#064E3B]/5
                      hover:text-[#064E3B]
                      dark:hover:bg-emerald-950/40
                      dark:hover:text-emerald-400
                    `,
                )}
              >
                <item.icon
                  className={cn(
                    "size-4 transition-colors",
                    !active &&
                      "group-hover:text-[#064E3B] dark:group-hover:text-emerald-400",
                  )}
                />

                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div
          className="
            border-t border-[#064E3B]/10 p-3
            dark:border-emerald-900/40
          "
        >
          <Link
            href="/"
            className="
              flex items-center gap-3 rounded-lg
              px-3 py-2 text-sm
              text-muted-foreground
              transition-colors
              hover:bg-[#064E3B]/5
              hover:text-[#064E3B]
              dark:hover:bg-emerald-950/40
              dark:hover:text-emerald-400
            "
          >
            {t("dash.backToSite")}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="
              flex w-full items-center gap-3 rounded-lg
              px-3 py-2 text-sm
              text-muted-foreground
              transition-colors
              hover:bg-[#064E3B]/5
              hover:text-[#064E3B]
              dark:hover:bg-emerald-950/40
              dark:hover:text-emerald-400
            "
          >
            <LogOut className="size-4" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="
            fixed inset-0 z-30
            bg-[#064E3B]/20 backdrop-blur-[1px]
            lg:hidden
            dark:bg-black/40
          "
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header
          className="
            sticky top-0 z-20
            flex items-center justify-between gap-4
            border-b border-[#064E3B]/10
            bg-card/85 px-4 py-3
            backdrop-blur
            dark:border-emerald-900/40
          "
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="
                rounded-md p-1.5
                text-muted-foreground
                transition-colors
                hover:bg-[#064E3B]/10
                hover:text-[#064E3B]
                lg:hidden
                dark:hover:bg-emerald-950/50
                dark:hover:text-emerald-400
              "
              onClick={() => setOpen(true)}
              aria-label={t("nav.menu")}
            >
              <Menu className="size-5" />
            </button>

            <div>
              <h1 className="font-heading text-lg font-semibold leading-tight">
                {t(titleKey)}
              </h1>

              {user && (
                <p className="text-xs text-muted-foreground">
                  {t("dash.welcome")}, {user.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Notifications */}
            <button
              type="button"
              className="
                relative rounded-md p-2
                text-muted-foreground
                transition-colors
                hover:bg-[#064E3B]/10
                hover:text-[#064E3B]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#064E3B]/25
                dark:hover:bg-emerald-950/50
                dark:hover:text-emerald-400
                dark:focus-visible:ring-emerald-500/30
              "
              aria-label={t("dash.notifications")}
            >
              <Bell className="size-5" />

              {unread > 0 && (
                <span
                  className="
                    absolute right-1 top-1
                    size-2 rounded-full
                    bg-[#064E3B]
                    ring-2 ring-card
                    dark:bg-emerald-500
                  "
                  aria-hidden
                />
              )}
            </button>

            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6">
          {!user && (
            <div
              className="
                mb-6 rounded-xl
                border border-[#064E3B]/20
                bg-[#064E3B]/5
                p-4 text-sm
                text-[#064E3B]
                dark:border-emerald-800/60
                dark:bg-emerald-950/40
                dark:text-emerald-300
              "
            >
              {localize(
                {
                  fr: "Aperçu de démonstration. Connectez-vous pour lier des données réelles.",
                  en: "Demo preview. Log in to link real data.",
                },
                locale,
              )}{" "}

              <Link
                href="/login"
                className="
                  font-medium underline underline-offset-2
                  transition-colors
                  hover:text-[#053D2E]
                  dark:hover:text-emerald-200
                "
              >
                {t("nav.login")}
              </Link>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  )
}

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string
  value: string
  change?: number
  icon: LucideIcon
}) {
  return (
    <div
      className="
        group rounded-2xl border border-border
        bg-card p-5
        transition-all duration-200
        hover:border-[#064E3B]/25
        hover:shadow-md
        dark:hover:border-emerald-800/60
      "
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {label}
        </span>

        <span
          className="
            flex size-9 items-center justify-center rounded-lg
            bg-[#064E3B]/10
            text-[#064E3B]
            transition-all duration-200
            group-hover:bg-[#064E3B]
            group-hover:text-white
            dark:bg-emerald-950/50
            dark:text-emerald-400
            dark:group-hover:bg-emerald-800
            dark:group-hover:text-white
          "
        >
          <Icon className="size-4" />
        </span>
      </div>

      <div className="mt-3 font-heading text-2xl font-bold">
        {value}
      </div>

      {typeof change === "number" && (
        <Badge
          variant={change >= 0 ? "success" : "destructive"}
          className="mt-2"
        >
          {change >= 0 ? "+" : ""}
          {change}%
        </Badge>
      )}
    </div>
  )
}