"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GraduationCap, Mail, UserPlus, Users } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize, type Formation } from "@/lib/mock-data"
import type { TeacherSummary } from "@/lib/lms/queries"
import { assignCourseAction, createTeacherAction } from "@/lib/lms/actions"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { adminNav } from "@/components/dashboard/admin-dashboard"
import { EmptyState, Field, FormError, Panel, formatDate, selectClass } from "@/components/lms/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const primaryBtn = "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"

export function AdminTeachers({ teachers, formations }: { teachers: TeacherSummary[]; formations: Formation[] }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)

  function create(form: FormData) {
    setError(null)
    start(async () => {
      const res = await createTeacherAction(Object.fromEntries(form))
      if (!res.ok) return setError(res.error)
      router.refresh()
    })
  }

  function assign(slug: string, teacherId: string) {
    setAssignError(null)
    start(async () => {
      const res = await assignCourseAction({ slug, teacherId: teacherId || null })
      if (!res.ok) setAssignError(res.error)
      router.refresh()
    })
  }

  return (
    <DashboardShell nav={adminNav} titleKey="admin.teachers">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title={`${t("admin.teachers")} (${teachers.length})`} icon={Users}>
          {teachers.length === 0 ? (
            <EmptyState icon={GraduationCap} title={t("lms.empty")} />
          ) : (
            <ul className="divide-y divide-border">
              {teachers.map((teacher) => (
                <li key={teacher.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-sm font-semibold text-white">
                    {teacher.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {teacher.name}
                      {teacher.expertise && <span className="ml-2 text-xs font-normal text-muted-foreground">· {teacher.expertise}</span>}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3" />
                      {teacher.email} · {formatDate(teacher.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {teacher.courseSlugs.length} {t("teacher.myCourses").toLowerCase()}
                    </Badge>
                    <Badge>
                      {teacher.studentCount} {t("lms.students").toLowerCase()}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("admin.addTeacher")} icon={UserPlus}>
          <form action={create} className="space-y-4">
            <Field label={locale === "fr" ? "Nom complet" : "Full name"} htmlFor="t-name">
              <Input id="t-name" name="name" required minLength={2} />
            </Field>
            <Field label="Email" htmlFor="t-email">
              <Input id="t-email" name="email" type="email" required />
            </Field>
            <Field
              label={locale === "fr" ? "Mot de passe temporaire" : "Temporary password"}
              htmlFor="t-pass"
              hint={locale === "fr" ? "8 caractères minimum. Communiquez-le au formateur." : "At least 8 characters. Share it with the teacher."}
            >
              <Input id="t-pass" name="password" type="text" required minLength={8} autoComplete="off" />
            </Field>
            <Field label={locale === "fr" ? "Spécialité" : "Expertise"} htmlFor="t-exp">
              <Input id="t-exp" name="expertise" placeholder="Python, Twi, Marketing…" />
            </Field>
            <FormError message={error} />
            <Button type="submit" disabled={pending} className={`w-full ${primaryBtn}`}>
              <UserPlus className="size-4" />
              {t("admin.addTeacher")}
            </Button>
          </form>
        </Panel>
      </div>

      <Panel title={t("admin.assignedCourses")} icon={GraduationCap} className="mt-6">
        <FormError message={assignError} />
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-2 font-medium">{t("nav.formations")}</th>
                <th className="w-64 px-3 py-2 font-medium">{t("admin.teachers")}</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {formations.map((f) => (
                <tr key={f.slug}>
                  <td className="px-5 py-3 font-medium">{localize(f.title, locale)}</td>
                  <td className="px-3 py-3">
                    <select
                      aria-label={t("admin.teachers")}
                      className={selectClass}
                      disabled={pending}
                      defaultValue={f.teacherId ?? ""}
                      onChange={(e) => assign(f.slug, e.target.value)}
                    >
                      <option value="">—</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {f.teacherId && (
                      <Link
                        href={`/dashboard/teacher/courses/${f.slug}`}
                        className="text-sm font-medium text-[#064E3B] hover:underline dark:text-emerald-400"
                      >
                        {t("teacher.manage")}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </DashboardShell>
  )
}
