"use client"

import Link from "next/link"
import Image from "next/image"
import { Award, BookOpen, Code2, Download, GraduationCap, PlayCircle, Trophy } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { DashboardShell, StatCard, type NavItem } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { localize } from "@/lib/mock-data"
import type { EnrolledView } from "@/lib/data/dashboard"

const nav: NavItem[] = [
  { href: "/dashboard/student", labelKey: "dash.overview", icon: GraduationCap },
  { href: "/dashboard/student", labelKey: "student.myFormations", icon: BookOpen },
  { href: "/dashboard/student", labelKey: "student.certificates", icon: Award },
  { href: "/dashboard/student", labelKey: "student.sourceCode", icon: Code2 },
  { href: "/dashboard/student", labelKey: "student.evaluations", icon: Trophy },
]

export function StudentDashboard({ enrolled }: { enrolled: EnrolledView[] }) {
  const { t, locale } = useI18n()

  const completed = enrolled.filter((e) => e.status === "completed").length
  const certificates = enrolled.filter((e) => e.certificateAvailable).length
  const avgProgress = enrolled.length
    ? Math.round(enrolled.reduce((sum, e) => sum + e.progress, 0) / enrolled.length)
    : 0

  return (
    <DashboardShell nav={nav} titleKey="student.title">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("student.myFormations")} value={String(enrolled.length)} icon={BookOpen} />
        <StatCard label={t("student.progress")} value={`${avgProgress}%`} icon={GraduationCap} />
        <StatCard label={t("student.completed")} value={String(completed)} icon={Trophy} />
        <StatCard label={t("student.certificates")} value={String(certificates)} icon={Award} />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">{t("student.myFormations")}</h2>
        <div className="space-y-4">
          {enrolled.map((e) => {
            const f = e.formation
            return (
              <div
                key={e.formationId}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
              >
                <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-xl sm:w-32">
                  <Image
                    src={f.image || "/placeholder.svg"}
                    alt={localize(f.title, locale)}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{localize(f.title, locale)}</h3>
                    <Badge variant={e.status === "completed" ? "success" : "secondary"}>
                      {e.status === "completed" ? t("student.completed") : t("student.inProgress")}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {t("student.nextLessons")}: {localize(e.nextLesson, locale)}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${e.progress}%` }} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{e.progress}%</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {e.certificateAvailable ? (
                    <Button variant="outline" size="sm">
                      <Download className="size-4" />
                      {t("student.downloadCertificate")}
                    </Button>
                  ) : (
                    <Button size="sm" render={<Link href={`/formations/${f.slug}`} />}>
                      <PlayCircle className="size-4" />
                      {t("student.continueFormation")}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </DashboardShell>
  )
}
