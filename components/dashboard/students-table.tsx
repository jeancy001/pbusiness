"use client"

import { CheckCircle2, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import type { StudentProgressView } from "@/lib/lms/queries"
import { EmptyState, ProgressBar } from "@/components/lms/ui"

export function StudentsTable({
  students,
  courseTitle,
}: {
  students: StudentProgressView[]
  /** Pass to show a course column (teacher overview); omit on a single-course page. */
  courseTitle?: (slug: string) => string
}) {
  const { t } = useI18n()

  if (!students.length) return <EmptyState icon={Users} title={t("lms.empty")} />

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-2 font-medium">{t("lms.students")}</th>
            {courseTitle && <th className="px-3 py-2 font-medium">{t("nav.formations")}</th>}
            <th className="w-44 px-3 py-2 font-medium">{t("lms.progress")}</th>
            <th className="px-3 py-2 font-medium">{t("teacher.attendance")}</th>
            <th className="px-3 py-2 font-medium">{t("teacher.exam")}</th>
            <th className="px-5 py-2 text-right font-medium">{t("common.certificate")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {students.map((s) => (
            <tr key={`${s.userId}-${s.formationSlug}`} className="hover:bg-muted/40">
              <td className="px-5 py-3">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.email}</p>
              </td>
              {courseTitle && <td className="max-w-[220px] truncate px-3 py-3 text-muted-foreground">{courseTitle(s.formationSlug)}</td>}
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <ProgressBar value={s.progress} />
                  <span className="w-9 text-right text-xs tabular-nums">{s.progress}%</span>
                </div>
              </td>
              <td className="px-3 py-3 tabular-nums">{s.attendanceRate}%</td>
              <td className="px-3 py-3 tabular-nums">{typeof s.examScore === "number" ? `${s.examScore}%` : "—"}</td>
              <td className="px-5 py-3 text-right">
                {s.certified ? <CheckCircle2 className="ml-auto size-4 text-success" aria-label="certified" /> : <span className="text-muted-foreground">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
