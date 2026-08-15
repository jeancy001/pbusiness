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

export type NavItem = { href: string; labelKey: TranslationKey; icon: LucideIcon }

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
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Logo />
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item, i) => {
            const active = pathname === item.href
            return (
              <Link
                key={`${item.labelKey}-${i}`}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {t("dash.backToSite")}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-card/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label={t("nav.menu")}
            >
              <Menu className="size-5" />
            </button>
            <div>
              <h1 className="font-heading text-lg font-semibold leading-tight">{t(titleKey)}</h1>
              {user && (
                <p className="text-xs text-muted-foreground">
                  {t("dash.welcome")}, {user.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("dash.notifications")}
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" aria-hidden />
              )}
            </button>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {!user && (
            <div className="mb-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
              {localize(
                {
                  fr: "Aperçu de démonstration. Connectez-vous pour lier des données réelles.",
                  en: "Demo preview. Log in to link real data.",
                },
                locale,
              )}{" "}
              <Link href="/login" className="font-medium underline">
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 font-heading text-2xl font-bold">{value}</div>
      {typeof change === "number" && (
        <Badge variant={change >= 0 ? "success" : "destructive"} className="mt-2">
          {change >= 0 ? "+" : ""}
          {change}%
        </Badge>
      )}
    </div>
  )
}
