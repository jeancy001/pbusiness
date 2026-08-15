"use client"

import Link from "next/link"
import {
  FileText,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Receipt,
  Wrench,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { DashboardShell, StatCard, type NavItem } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { projectStatusLabels, paymentStatusLabels, localize, type Project } from "@/lib/mock-data"
import type { PaymentView } from "@/lib/data/dashboard"

const nav: NavItem[] = [
  { href: "/dashboard/client", labelKey: "dash.overview", icon: LayoutDashboard },
  { href: "/dashboard/client", labelKey: "client.projects", icon: FolderKanban },
  { href: "/dashboard/client", labelKey: "client.quotes", icon: FileText },
  { href: "/dashboard/client", labelKey: "client.invoices", icon: Receipt },
  { href: "/dashboard/client", labelKey: "client.maintenance", icon: Wrench },
]

const statusVariant: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  delivered: "success",
  "in-development": "secondary",
  "quote-sent": "warning",
  cancelled: "destructive",
}

export function ClientDashboard({
  projects,
  payments,
}: {
  projects: Project[]
  payments: PaymentView[]
}) {
  const { t, locale } = useI18n()

  const active = projects.filter((p) => p.status !== "delivered" && p.status !== "cancelled").length
  const delivered = projects.filter((p) => p.status === "delivered").length
  const pendingPay = payments.filter((p) => p.status === "pending").length

  return (
    <DashboardShell nav={nav} titleKey="client.title">
      <div className="mb-6 flex items-center justify-end">
        <Button render={<Link href="/quote" />}>
          <Plus className="size-4" />
          {t("client.newQuote")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("client.projects")} value={String(projects.length)} icon={FolderKanban} />
        <StatCard label={t("student.inProgress")} value={String(active)} icon={LayoutDashboard} />
        <StatCard label={t("client.deliverables")} value={String(delivered)} icon={FileText} />
        <StatCard label={t("admin.pendingPayments")} value={String(pendingPay)} icon={Receipt} />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">{t("client.projects")}</h2>
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{localize(p.name, locale)}</h3>
                  <p className="text-sm text-muted-foreground">{localize(p.type, locale)}</p>
                </div>
                <Badge variant={statusVariant[p.status] ?? "secondary"}>
                  {localize(projectStatusLabels[p.status], locale)}
                </Badge>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{p.progress}%</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>${p.budgetUsd.toLocaleString()} USD</span>
                <span>{p.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">{t("client.invoices")}</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">{t("common.amount")}</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">{t("dash.payments")}</th>
                <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">{t("common.date")}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{pay.id}</td>
                  <td className="px-4 py-3">${pay.amountUsd}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{pay.method}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        pay.status === "success"
                          ? "success"
                          : pay.status === "pending"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {localize(paymentStatusLabels[pay.status], locale)}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{pay.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  )
}
