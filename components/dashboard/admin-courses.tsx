"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, Eye, EyeOff, Languages, Plus, Settings2, Trash2, X } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { categoryLabels, localize, type FormationCategory, type Level } from "@/lib/mock-data"
import type { AdminCourseView } from "@/lib/lms/admin"
import { createCourseAction, setCourseRevenueOwnerAction, setCourseVisibilityAction, translateAllCoursesAction } from "@/lib/lms/actions"
import { deleteCourseAction } from "@/lib/admin/actions"
import { PLATFORM_COMMISSION_PERCENT, TEACHER_SHARE_PERCENT } from "@/lib/payments/fees"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { adminNav } from "@/components/dashboard/admin-dashboard"
import { EmptyState, Field, FormError, Panel, selectClass } from "@/components/lms/ui"
import { ImageUpload } from "@/components/lms/upload"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const CATEGORIES = Object.keys(categoryLabels) as FormationCategory[]
const LEVELS: Level[] = ["beginner", "intermediate", "advanced"]

export function AdminCourses({ courses, teachers }: { courses: AdminCourseView[]; teachers: { id: string; name: string }[] }) {
  const { t, locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function create(form: FormData) {
    setError(null)
    start(async () => {
      const res = await createCourseAction({ ...Object.fromEntries(form), teacherId: form.get("teacherId") || undefined })
      if (!res.ok) return setError(res.error)
      setCreating(false)
      setNotice(fr ? "Cours créé. La traduction IA est en cours." : "Course created. AI translation is running.")
      router.refresh()
    })
  }

  function translateAll() {
    start(async () => {
      const res = await translateAllCoursesAction()
      setNotice(
        res.ok
          ? fr
            ? `Traduction IA lancée pour ${res.data!.count} cours (fr, en, twi, ga, ewe).`
            : `AI translation started for ${res.data!.count} courses (fr, en, Twi, Ga, Ewe).`
          : res.error,
      )
    })
  }

  return (
    <DashboardShell nav={adminNav} titleKey="admin.manageFormations">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {courses.length} {fr ? "cours" : "courses"} · {courses.filter((c) => !c.hidden).length} {fr ? "publiés" : "published"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={pending} onClick={translateAll}>
            <Languages className="size-4" />
            {fr ? "Traduire tout avec l'IA" : "Translate all with AI"}
          </Button>
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? <X className="size-4" /> : <Plus className="size-4" />}
            {t("teacher.newCourse")}
          </Button>
        </div>
      </div>

      {notice && <p className="mt-4 rounded-lg bg-[#064E3B]/5 px-4 py-2.5 text-sm text-[#064E3B] dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</p>}

      {creating && (
        <Panel title={t("teacher.newCourse")} icon={Plus} className="mt-6">
          <form action={create} className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <ImageUpload />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field label={t("lms.title")} htmlFor="ac-title">
                  <Input placeholder={fr ? "Ex. : Python pour débutants" : "e.g. Python for beginners"} id="ac-title" name="title" required minLength={4} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label={fr ? "Résumé" : "Summary"} htmlFor="ac-summary">
                  <Textarea placeholder={fr ? "Une phrase qui donne envie de suivre le cours" : "One sentence that makes people want to take the course"} id="ac-summary" name="summary" required minLength={10} className="min-h-16" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Description" htmlFor="ac-desc">
                  <Textarea placeholder={fr ? "Ce que l’étudiant va apprendre, pour qui, prérequis…" : "What students will learn, who it is for, prerequisites…"} id="ac-desc" name="description" className="min-h-24" />
                </Field>
              </div>
              <Field label={t("common.category")} htmlFor="ac-cat">
                <select id="ac-cat" name="category" className={selectClass}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {localize(categoryLabels[c], locale)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("common.level")} htmlFor="ac-level">
                <select id="ac-level" name="level" className={selectClass}>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {t(`common.${l}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`${t("common.price")} (USD)`} htmlFor="ac-price">
                <Input placeholder={fr ? "Ex. : 20" : "e.g. 20"} id="ac-price" name="priceUsd" type="number" min={0} step="0.01" defaultValue={19} required />
              </Field>
              <Field label={fr ? "Formateur" : "Teacher"} htmlFor="ac-teacher">
                <select id="ac-teacher" name="teacherId" className={selectClass} defaultValue="">
                  <option value="">—</option>
                  {teachers.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex items-center justify-end gap-3 md:col-span-2">
                <FormError message={error} />
                <Button type="submit" disabled={pending}>
                  {pending ? t("common.loading") : fr ? "Créer et traduire" : "Create & translate"}
                </Button>
              </div>
            </div>
          </form>
        </Panel>
      )}

      {courses.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={BookOpen} title={t("lms.empty")} />
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <li key={c.slug} className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-card", (c.hidden || c.teacherSuspended) && "opacity-60")}>
              <div className="relative aspect-[16/9] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt="" className="size-full object-cover" />
                <div className="absolute left-3 top-3 flex gap-1.5">
                  {c.teacherSuspended ? (
                    <Badge variant="destructive">{fr ? "Formateur suspendu" : "Teacher suspended"}</Badge>
                  ) : c.hidden ? (
                    <Badge variant="secondary">{fr ? "Masqué" : "Hidden"}</Badge>
                  ) : (
                    <Badge variant="success">{fr ? "Publié" : "Published"}</Badge>
                  )}
                  {c.title.tw && <Badge className="bg-white/90 text-[#064E3B]">5 {fr ? "langues" : "languages"}</Badge>}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[#064E3B] dark:text-emerald-400">
                  {localize(categoryLabels[c.category], locale)}
                </p>
                <h3 className="mt-1 font-medium leading-snug">{localize(c.title, locale)}</h3>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <dt>{t("common.price")}</dt>
                    <dd className="text-sm font-semibold text-foreground">${c.priceUsd}</dd>
                  </div>
                  <div>
                    <dt>{t("lms.students")}</dt>
                    <dd className="text-sm font-semibold text-foreground">{c.studentCount}</dd>
                  </div>
                  <div>
                    <dt>{fr ? "Formateur" : "Teacher"}</dt>
                    <dd className="truncate text-sm font-semibold text-foreground">{c.teacherName ?? "—"}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                  <span>
                    {fr ? "Revenus" : "Revenue"} :{" "}
                    <span className="font-semibold">
                      {c.teacherEarns
                        ? `${fr ? "Formateur" : "Teacher"} ${TEACHER_SHARE_PERCENT} % · Admin ${PLATFORM_COMMISSION_PERCENT} %`
                        : `${fr ? "Plateforme" : "Platform"} 100 %`}
                    </span>
                  </span>
                  {c.teacherId && (
                    <button
                      type="button"
                      disabled={pending}
                      className="font-medium text-[#064E3B] hover:underline disabled:opacity-50 dark:text-emerald-400"
                      onClick={() =>
                        start(async () => {
                          const res = await setCourseRevenueOwnerAction({ slug: c.slug, owner: c.teacherEarns ? "platform" : "teacher" })
                          if (!res.ok) setError(res.error)
                          router.refresh()
                        })
                      }
                    >
                      {c.teacherEarns ? (fr ? "→ Plateforme" : "→ Platform") : fr ? "→ Formateur" : "→ Teacher"}
                    </button>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1" render={<Link href={`/dashboard/teacher/courses/${c.slug}`} />}>
                    <Settings2 className="size-4" />
                    {t("teacher.manage")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    aria-label={c.hidden ? "Publish" : "Hide"}
                    onClick={() =>
                      start(async () => {
                        await setCourseVisibilityAction({ slug: c.slug, hidden: !c.hidden })
                        router.refresh()
                      })
                    }
                  >
                    {c.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={fr ? "Supprimer le cours" : "Delete course"}
                    title={fr ? "Supprimer le cours" : "Delete course"}
                    onClick={() => {
                      const title = localize(c.title, locale)
                      const warn = fr
                        ? `Supprimer définitivement « ${title} » ? Ses leçons, fichiers et ${c.studentCount} inscription(s) seront effacés. Les paiements passés sont conservés.`
                        : `Permanently delete "${title}"? Its lessons, files and ${c.studentCount} enrollment(s) will be erased. Past payments are kept.`
                      if (!window.confirm(warn)) return
                      start(async () => {
                        const res = await deleteCourseAction(c.slug)
                        if (!res.ok) setError(res.error)
                        router.refresh()
                      })
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  )
}
