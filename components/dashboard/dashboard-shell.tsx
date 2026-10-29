"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowUpRight, LogOut, Menu, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { Logo } from "@/components/site/logo"
import { LanguageToggle } from "@/components/site/language-toggle"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { localize } from "@/lib/mock-data"
import type { TranslationKey } from "@/lib/i18n/dictionary"
import { cn } from "@/lib/utils"

export type NavItem = {
  href: string
  labelKey: TranslationKey
  icon: LucideIcon
}

const ROLE_LABEL: Record<string, { fr: string; en: string }> = {
  admin: { fr: "Administrateur", en: "Administrator" },
  teacher: { fr: "Formateur", en: "Teacher" },
  student: { fr: "Étudiant", en: "Student" },
  client: { fr: "Client", en: "Client" },
}

export function DashboardShell({ nav, titleKey, children }: { nav: NavItem[]; titleKey: TranslationKey; children: React.ReactNode }) {
  const { t, locale } = useI18n()
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Most specific route wins; in-page anchors (#section) are never "active".
  const activeHref = nav
    .filter((item) => !item.href.includes("#"))
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  async function handleLogout() {
    await logout()
    router.push("/")
    router.refresh()
  }

  const initials = (user?.name ?? "")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label={t(titleKey)}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t(titleKey)}</p>
          {nav.map((item, i) => {
            const active = item.href === activeHref
            return (
              <Link
                key={`${item.labelKey}-${i}`}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#064E3B]/[0.08] text-[#064E3B] dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[#064E3B] dark:bg-emerald-400" aria-hidden />}
                <item.icon className={cn("size-[18px]", active ? "text-[#064E3B] dark:text-emerald-400" : "text-muted-foreground group-hover:text-foreground")} />
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          <Link
            href="/"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {t("dash.backToSite")}
            <ArrowUpRight className="size-4" />
          </Link>
          {user && (
            <div className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 ring-1 ring-border">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-xs font-semibold text-white">{initials}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[user.role] ? localize(ROLE_LABEL[user.role], locale) : user.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={t("nav.logout")}
                title={t("nav.logout")}
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
              onClick={() => setOpen(true)}
              aria-label={t("nav.menu")}
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-heading text-lg font-semibold leading-tight">{t(titleKey)}</h1>
              {user && (
                <p className="truncate text-xs text-muted-foreground">
                  {t("dash.welcome")}, {user.name.split(" ")[0]}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6 lg:p-8">
          {!user && (
            <div className="mb-6 rounded-xl border border-[#064E3B]/20 bg-[#064E3B]/5 p-4 text-sm text-[#064E3B] dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              {localize(
                { fr: "Aperçu de démonstration. Connectez-vous pour lier des données réelles.", en: "Demo preview. Log in to link real data." },
                locale,
              )}{" "}
              <Link href="/login" className="font-medium underline underline-offset-2">
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

export function StatCard({ label, value, change, icon: Icon }: { label: string; value: string; change?: number; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#064E3B]/[0.08] text-[#064E3B] dark:bg-emerald-950/60 dark:text-emerald-400">
          <Icon className="size-[18px]" />
        </span>
      </div>
      <div className="mt-2 font-heading text-[1.75rem] font-bold leading-none tracking-tight tabular-nums">{value}</div>
      {typeof change === "number" && (
        <Badge variant={change >= 0 ? "success" : "destructive"} className="mt-3">
          {change >= 0 ? "+" : ""}
          {change}%
        </Badge>
      )}
    </div>
  )
}
