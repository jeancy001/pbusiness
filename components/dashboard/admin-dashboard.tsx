"use client"

import {
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  Repeat,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import {
  localize,
  adminStats,
  revenueByMonth,
  formations as mockFormations,
  payments as mockPayments,
  paymentStatusLabels,
  type PaymentStatus,
} from "@/lib/mock-data"
import type { AdminView } from "@/lib/data/dashboard"
import { DashboardShell, StatCard, type NavItem } from "@/components/dashboard/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { RevenueChart } from "./revenue-chart"
import { AiManagement } from "./ai-management"

const nav: NavItem[] = [
  { href: "/dashboard/admin", labelKey: "dash.overview", icon: LayoutDashboard },
  { href: "/dashboard/admin", labelKey: "admin.users", icon: Users },
  { href: "/dashboard/admin", labelKey: "admin.manageFormations", icon: GraduationCap },
  { href: "/dashboard/admin", labelKey: "admin.aiManagement", icon: Sparkles },
  { href: "/dashboard/admin", labelKey: "admin.settings", icon: Settings },
]

const statIcons: Record<string, LucideIcon> = {
  revenue: DollarSign,
  sales: ShoppingCart,
  enrollments: GraduationCap,
  subscriptions: Repeat,
}

type PaymentRow = { id: string; item: string; amount: number; method: string; status: PaymentStatus }

export function AdminDashboard({ data = null }: { data?: AdminView | null }) {
  const { t, locale } = useI18n()

  const usd = (n: number) => `$${n.toLocaleString("en-US")}`

  // Use live DB data when available, otherwise fall back to bundled demo data.
  const revenueValue = data ? usd(data.stats.revenue) : usd(adminStats.revenueUsd)
  const salesValue = data ? data.stats.students.toLocaleString() : adminStats.sales.toLocaleString()
  const enrollmentsValue = data
    ? data.stats.students.toLocaleString()
    : adminStats.enrollments.toLocaleString()
  const subsValue = data
    ? data.stats.projects.toLocaleString()
    : adminStats.activeSubscriptions.toLocaleString()

  const revenueSeries = data && data.revenue.length ? data.revenue : revenueByMonth
  const popular = data
    ? data.popular
    : [...mockFormations].sort((a, b) => b.studentsCount - a.studentsCount).slice(0, 5)

  const recentPayments: PaymentRow[] = data
    ? data.recentPayments.map((p) => ({
        id: p.id,
        item: p.method,
        amount: p.amountUsd,
        method: p.method,
        status: p.status,
      }))
    : mockPayments.slice(0, 6).map((p) => ({
        id: p.id,
        item: localize(p.label, locale),
        amount: p.amountUsd,
        method: p.method,
        status: p.status,
      }))

  return (
    <DashboardShell nav={nav} titleKey="admin.title">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("admin.revenue")}
          value={revenueValue}
          change={data ? undefined : adminStats.revenueChange}
          icon={statIcons.revenue}
        />
        <StatCard
          label={t("admin.sales")}
          value={salesValue}
          change={data ? undefined : adminStats.salesChange}
          icon={statIcons.sales}
        />
        <StatCard
          label={t("admin.enrollments")}
          value={enrollmentsValue}
          change={data ? undefined : adminStats.enrollmentsChange}
          icon={statIcons.enrollments}
        />
        <StatCard
          label={t("admin.subscriptions")}
          value={subsValue}
          change={data ? undefined : adminStats.activeSubsChange}
          icon={statIcons.subscriptions}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-heading text-base font-semibold">{t("admin.revenueChart")}</h2>
          <RevenueChart data={revenueSeries} />
        </div>

        {/* Popular formations */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-base font-semibold">
            {t("admin.popularFormations")}
          </h2>
          <div className="flex flex-col gap-3">
            {popular.map((f, i) => (
              <div key={f.id} className="flex items-center gap-3">
                <span className="font-heading text-sm font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {localize(f.title, locale)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {f.studentsCount.toLocaleString()} {t("admin.studentsLabel")}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">${f.priceUsd}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI management */}
      <div className="mt-6">
        <AiManagement />
      </div>

      {/* Recent payments */}
      <section className="mt-6">
        <h2 className="mb-4 font-heading text-base font-semibold">{t("admin.recentPayments")}</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">{t("admin.colId")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.colItem")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.colAmount")}</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">
                    {t("admin.colMethod")}
                  </th>
                  <th className="px-5 py-3 font-medium">{t("admin.colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.id}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{p.item}</td>
                    <td className="px-5 py-3 text-foreground">${p.amount}</td>
                    <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">
                      {p.method}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          p.status === "success"
                            ? "success"
                            : p.status === "pending"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {localize(paymentStatusLabels[p.status], locale)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </DashboardShell>
  )
}
