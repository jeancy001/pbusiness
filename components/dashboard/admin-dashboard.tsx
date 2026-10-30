"use client"

import {
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  Repeat,
  ShoppingCart,
  Sparkles,
  Wallet,
  BookOpen,
  Bot,
  CalendarDays,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { PLATFORM_COMMISSION_PERCENT, TEACHER_SHARE_PERCENT } from "@/lib/payments/fees"
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
import type { PlatformRevenue } from "@/lib/payments/payouts"
import type { AdminAnalytics } from "@/lib/lms/analytics"
import { BarList, ChartCard, ColumnChart, LineChart } from "@/components/charts/charts"
import { monthLabel, usdShort } from "@/components/charts/format"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import {
  DashboardShell,
  StatCard,
  type NavItem,
} from "@/components/dashboard/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { RevenueChart } from "./revenue-chart"
import { AiManagement } from "./ai-management"

export const adminNav: NavItem[] = [
  { href: "/dashboard/admin", labelKey: "dash.overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/courses", labelKey: "admin.manageFormations", icon: BookOpen },
  { href: "/dashboard/admin/academy", labelKey: "nav.academy", icon: Bot },
  { href: "/dashboard/admin/events", labelKey: "admin.events", icon: CalendarDays },
  { href: "/dashboard/admin/users", labelKey: "admin.users", icon: Users },
  { href: "/dashboard/admin/teachers", labelKey: "admin.teachers", icon: GraduationCap },
  { href: "/dashboard/admin/team", labelKey: "admin.team", icon: ShieldCheck },
  { href: "/dashboard/admin/payments", labelKey: "admin.payments", icon: Wallet },
  { href: "/dashboard/admin#ai", labelKey: "admin.aiManagement", icon: Sparkles },
  { href: "/dashboard/profile", labelKey: "nav.profile", icon: UserCircle },
]

const statIcons: Record<string, LucideIcon> = {
  revenue: DollarSign,
  sales: ShoppingCart,
  enrollments: GraduationCap,
  subscriptions: Repeat,
}

type PaymentRow = {
  id: string
  item: string
  amount: number
  method: string
  status: PaymentStatus
}

export function AdminDashboard({
  data = null,
  revenue = null,
  analytics = null,
}: {
  data?: AdminView | null
  revenue?: PlatformRevenue | null
  analytics?: AdminAnalytics | null
}) {
  const { t, locale } = useI18n()

  const usd = (n: number) => `$${n.toLocaleString("en-US")}`

  // Use live DB data when available, otherwise fall back to bundled demo data.
  const revenueValue = data
    ? usd(data.stats.revenue)
    : usd(adminStats.revenueUsd)

  const salesValue = data
    ? data.stats.students.toLocaleString()
    : adminStats.sales.toLocaleString()

  const enrollmentsValue = data
    ? data.stats.students.toLocaleString()
    : adminStats.enrollments.toLocaleString()

  const subsValue = data
    ? data.stats.projects.toLocaleString()
    : adminStats.activeSubscriptions.toLocaleString()

  const revenueSeries =
    data && data.revenue.length ? data.revenue : revenueByMonth

  const popular = data
    ? data.popular
    : [...mockFormations]
        .sort((a, b) => b.studentsCount - a.studentsCount)
        .slice(0, 5)

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
    <DashboardShell nav={adminNav} titleKey="admin.title">
      {revenue && (
        <section className="mb-6 overflow-hidden rounded-2xl bg-[#064E3B] text-white shadow-sm">
          <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [locale === "fr" ? "Ventes totales" : "Gross sales", revenue.grossSalesUsd],
              [locale === "fr" ? `Part des formateurs · ${TEACHER_SHARE_PERCENT} %` : `Teachers' share · ${TEACHER_SHARE_PERCENT}%`, revenue.teacherEarningsUsd],
              [locale === "fr" ? `Commission admin · ${PLATFORM_COMMISSION_PERCENT} %` : `Admin commission · ${PLATFORM_COMMISSION_PERCENT}%`, revenue.courseCommissionUsd],
              [locale === "fr" ? "Disponible au retrait" : "Available to withdraw", revenue.availableUsd],
            ].map(([label, value], i) => (
              <div key={label as string} className="bg-[#064E3B] px-6 py-5">
                <p className="text-xs uppercase tracking-wider text-emerald-200/80">{label}</p>
                <p className={`mt-2 font-heading text-2xl font-bold tabular-nums ${i === 3 ? "text-emerald-300" : ""}`}>
                  ${(value as number).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-3 text-sm text-emerald-50/80">
            <span>
              {locale === "fr"
                ? `+ certificats, modules IA et frais de retrait : $${(revenue.otherSalesUsd + revenue.payoutFeesUsd).toFixed(2)}`
                : `+ certificates, AI modules and payout fees: $${(revenue.otherSalesUsd + revenue.payoutFeesUsd).toFixed(2)}`}
            </span>
            <Link href="/dashboard/admin/payments" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-[#064E3B] hover:bg-emerald-50">
              {locale === "fr" ? "Retirer" : "Withdraw"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      )}

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

      {analytics ? (
        <AdminCharts analytics={analytics} />
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-base font-semibold">{t("admin.revenueChart")}</h2>
          <RevenueChart data={revenueSeries} />
        </div>
      )}

      {/* AI management */}
      <div id="ai" className="mt-6 scroll-mt-24">
        <AiManagement />
      </div>

      {/* Recent payments */}
      <section className="mt-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-heading text-base font-semibold">
            {t("admin.recentPayments")}
          </h2>

          <div className="h-px flex-1 bg-[#064E3B]/10 dark:bg-emerald-900/40" />
        </div>

        <div
          className="
            overflow-hidden rounded-2xl border border-border bg-card
            transition-all duration-200
            hover:border-[#064E3B]/20
            dark:hover:border-emerald-800/60
          "
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead
                className="
                  border-b border-[#064E3B]/10
                  bg-[#064E3B]/[0.03]
                  text-left text-xs uppercase tracking-wide
                  text-muted-foreground
                  dark:border-emerald-900/40
                  dark:bg-emerald-950/20
                "
              >
                <tr>
                  <th className="px-5 py-3 font-medium">
                    {t("admin.colId")}
                  </th>

                  <th className="px-5 py-3 font-medium">
                    {t("admin.colItem")}
                  </th>

                  <th className="px-5 py-3 font-medium">
                    {t("admin.colAmount")}
                  </th>

                  <th className="hidden px-5 py-3 font-medium sm:table-cell">
                    {t("admin.colMethod")}
                  </th>

                  <th className="px-5 py-3 font-medium">
                    {t("admin.colStatus")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="
                      border-b border-border/60
                      transition-colors duration-150
                      hover:bg-[#064E3B]/[0.025]
                      last:border-0
                      dark:hover:bg-emerald-950/20
                    "
                  >
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {p.id}
                    </td>

                    <td className="px-5 py-3 font-medium text-foreground">
                      {p.item}
                    </td>

                    <td className="px-5 py-3 font-semibold text-[#064E3B] dark:text-emerald-400">
                      ${p.amount}
                    </td>

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
                        {localize(
                          paymentStatusLabels[p.status],
                          locale,
                        )}
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

function AdminCharts({ analytics }: { analytics: AdminAnalytics }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const series = [
    { key: "course", label: fr ? "Cours" : "Courses", color: "var(--series-1)" },
    { key: "certificate", label: fr ? "Certificats" : "Certificates", color: "var(--series-2)" },
    { key: "academy", label: "Linko Academy", color: "var(--series-3)" },
    { key: "other", label: fr ? "Autres" : "Other", color: "var(--series-4)" },
  ]
  const revenue = analytics.revenue.map((r) => ({ label: monthLabel(r.month, locale), values: { course: r.course, certificate: r.certificate, academy: r.academy, other: r.other } }))
  const total = analytics.revenue.reduce((sum, r) => sum + r.course + r.certificate + r.academy + r.other, 0)

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <ChartCard
        className="xl:col-span-2"
        title={fr ? "Ventes par mois" : "Sales by month"}
        subtitle={fr ? `12 derniers mois · ${usdShort(total)} au total` : `Last 12 months · ${usdShort(total)} total`}
        series={series}
        table={{
          columns: [fr ? "Mois" : "Month", ...series.map((s) => s.label), "Total"],
          rows: analytics.revenue.map((r) => [monthLabel(r.month, locale), usdShort(r.course), usdShort(r.certificate), usdShort(r.academy), usdShort(r.other), usdShort(r.course + r.certificate + r.academy + r.other)]),
        }}
      >
        <ColumnChart data={revenue} series={series} format={usdShort} ariaLabel={fr ? "Ventes par mois et par source" : "Sales by month and source"} />
      </ChartCard>

      <ChartCard
        title={fr ? "Cours les plus suivis" : "Most popular courses"}
        subtitle={fr ? "Nombre d'étudiants inscrits" : "Enrolled students"}
      >
        <BarList
          items={analytics.topCourses.map((c) => ({ label: localize(c.title, locale), value: c.students }))}
          empty={fr ? "Aucune inscription pour le moment." : "No enrollments yet."}
        />
      </ChartCard>

      <ChartCard
        className="xl:col-span-3"
        title={fr ? "Nouvelles inscriptions" : "New enrollments"}
        subtitle={fr ? "Par mois, 12 derniers mois" : "Per month, last 12 months"}
        table={{ columns: [fr ? "Mois" : "Month", fr ? "Inscriptions" : "Enrollments"], rows: analytics.enrollments.map((e) => [monthLabel(e.month, locale), e.count]) }}
      >
        <LineChart
          data={analytics.enrollments.map((e) => ({ label: monthLabel(e.month, locale), value: e.count }))}
          ariaLabel={fr ? "Inscriptions par mois" : "Enrollments per month"}
          height={180}
        />
      </ChartCard>
    </div>
  )
}
