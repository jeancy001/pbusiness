"use client"

import type { LucideIcon } from "lucide-react"
import type { Locale } from "@/lib/i18n/dictionary"
import { cn } from "@/lib/utils"

export function intlLocale(locale: Locale) {
  return locale === "fr" ? "fr-FR" : "en-GB"
}

export function formatDateTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso),
  )
}

/** A live class is joinable from 15 minutes before its start until its planned end (+30 min grace). */
export function liveWindow(startAt: string, durationMin: number) {
  const start = new Date(startAt).getTime()
  const now = Date.now()
  return {
    joinable: now >= start - 15 * 60_000 && now <= start + (durationMin + 30) * 60_000,
    live: now >= start && now <= start + durationMin * 60_000,
  }
}

export function Panel({
  title,
  icon: Icon,
  action,
  id,
  className,
  children,
}: {
  title?: string
  icon?: LucideIcon
  action?: React.ReactNode
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 rounded-2xl border border-border bg-card", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
            {Icon && <Icon className="size-4 text-[#064E3B] dark:text-emerald-400" />}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-[#064E3B]/10 dark:bg-emerald-950/60", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-[#064E3B] transition-[width] duration-500 dark:bg-emerald-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-[#064E3B]/10 text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-400">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {children && <div className="mt-2 max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:border-[#064E3B]/40 focus-visible:border-[#064E3B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/20 dark:bg-input/30"

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  )
}
