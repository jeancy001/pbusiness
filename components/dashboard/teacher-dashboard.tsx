"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, CalendarClock, GraduationCap, LayoutDashboard, Plus, TrendingUp, Users, Video, Wallet, X } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { TEACHER_SHARE_PERCENT } from "@/lib/payments/fees"
import { categoryLabels, localize, type FormationCategory, type Level } from "@/lib/mock-data"
import type { LiveRequestView, TeacherView } from "@/lib/lms/queries"
import { LiveRequestsPanel } from "@/components/lms/live-requests"
import { createCourseAction, updateCoursePriceAction } from "@/lib/lms/actions"
import { DashboardShell, StatCard, type NavItem } from "@/components/dashboard/dashboard-shell"
import { StudentsTable } from "@/components/dashboard/students-table"
import { EmptyState, Field, FormError, Panel, ProgressBar, formatDateTime, liveWindow, selectClass } from "@/components/lms/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/lms/upload"
import { BarList, ChartCard, ColumnChart } from "@/components/charts/charts"
import { monthLabel, usdShort } from "@/components/charts/format"

export const teacherNav: NavItem[] = [
  { href: "/dashboard/teacher", labelKey: "dash.overview", icon: LayoutDashboard },
  { href: "/dashboard/teacher#courses", labelKey: "teacher.myCourses", icon: BookOpen },
  { href: "/dashboard/teacher#students", labelKey: "teacher.myStudents", icon: Users },
  { href: "/dashboard/teacher#live", labelKey: "teacher.liveSessions", icon: Video },
  { href: "/dashboard/teacher/payouts", labelKey: "teacher.payouts", icon: Wallet },
]

const primaryBtn = "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"

export function TeacherDashboard({
  data,
  earnings = [],
  liveRequests = [],
}: {
  data: TeacherView
  earnings?: { month: string; usd: number }[]
  liveRequests?: LiveRequestView[]
}) {
  const { t, locale } = useI18n()
  const [creating, setCreating] = useState(false)
  const { courses, students, live } = data

  const avg = students.length ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length) : 0
  const titleOf = (slug: string) => {
    const c = courses.find((x) => x.slug === slug)
    return c ? localize(c.title, locale) : slug
  }

  return (
    <DashboardShell nav={teacherNav} titleKey="teacher.title">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("teacher.myCourses")} value={String(courses.length)} icon={BookOpen} />
        <StatCard label={t("teacher.myStudents")} value={String(new Set(students.map((s) => s.userId)).size)} icon={Users} />
        <StatCard label={t("teacher.avgProgress")} value={`${avg}%`} icon={TrendingUp} />
        <StatCard label={t("lms.upcomingLive")} value={String(live.length)} icon={CalendarClock} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ChartCard
          title={locale === "fr" ? "Mes revenus par mois" : "My earnings by month"}
          subtitle={
            locale === "fr"
              ? `${TEACHER_SHARE_PERCENT} % de chaque vente de vos cours · ${usdShort(earnings.reduce((s, e) => s + e.usd, 0))} sur 12 mois`
              : `${TEACHER_SHARE_PERCENT}% of each sale of your courses · ${usdShort(earnings.reduce((s, e) => s + e.usd, 0))} over 12 months`
          }
          table={{ columns: [locale === "fr" ? "Mois" : "Month", locale === "fr" ? "Revenus" : "Earnings"], rows: earnings.map((e) => [monthLabel(e.month, locale), usdShort(e.usd)]) }}
        >
          <ColumnChart
            data={earnings.map((e) => ({ label: monthLabel(e.month, locale), values: { usd: e.usd } }))}
            series={[{ key: "usd", label: locale === "fr" ? "Revenus" : "Earnings", color: "var(--series-brand)" }]}
            format={usdShort}
            ariaLabel={locale === "fr" ? "Revenus par mois" : "Earnings by month"}
          />
        </ChartCard>
        <ChartCard
          title={locale === "fr" ? "Progression par cours" : "Progress by course"}
          subtitle={locale === "fr" ? "Progression moyenne des étudiants" : "Average student progress"}
        >
          <BarList
            items={courses.map((c) => ({
              label: localize(c.title, locale),
              value: c.avgProgress,
              hint: `${c.studentCount} ${t("lms.students").toLowerCase()}`,
            }))}
            max={100}
            format={(n) => `${n}%`}
            empty={t("lms.empty")}
          />
        </ChartCard>
      </div>

      <Panel
        id="courses"
        title={t("teacher.myCourses")}
        icon={GraduationCap}
        className="mt-6"
        action={
          <Button size="sm" className={primaryBtn} onClick={() => setCreating((v) => !v)}>
            {creating ? <X className="size-4" /> : <Plus className="size-4" />}
            {t("teacher.newCourse")}
          </Button>
        }
      >
        {creating && <NewCourseForm onDone={() => setCreating(false)} />}

        {courses.length === 0 ? (
          <EmptyState icon={BookOpen} title={t("lms.empty")}>
            {locale === "fr"
              ? "Créez un cours ou demandez à l'administrateur de vous en assigner un."
              : "Create a course or ask an administrator to assign one to you."}
          </EmptyState>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((c) => (
              <li key={c.slug} className="group flex flex-col overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md">
                <div className="relative h-32">
                  <Image src={c.image || "/placeholder.svg"} alt="" fill className="object-cover" sizes="(min-width: 1280px) 33vw, 50vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Badge className="absolute left-3 top-3 bg-white/90 text-[#064E3B]">{localize(categoryLabels[c.category], locale)}</Badge>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-medium leading-snug">{localize(c.title, locale)}</h3>
                  <CoursePrice slug={c.slug} price={c.priceUsd} />
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <dt>{t("lms.lessons")}</dt>
                      <dd className="text-base font-semibold text-foreground">{c.lessonCount}</dd>
                    </div>
                    <div>
                      <dt>{t("lms.students")}</dt>
                      <dd className="text-base font-semibold text-foreground">{c.studentCount}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex items-center gap-2">
                    <ProgressBar value={c.avgProgress} />
                    <span className="text-xs tabular-nums text-muted-foreground">{c.avgProgress}%</span>
                  </div>
                  <Button size="sm" className={`mt-4 ${primaryBtn}`} render={<Link href={`/dashboard/teacher/courses/${c.slug}`} />}>
                    {t("teacher.manage")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel id="students" title={t("teacher.myStudents")} icon={Users}>
          <StudentsTable students={students} courseTitle={titleOf} />
        </Panel>

        <Panel id="live" title={t("teacher.liveSessions")} icon={Video}>
          {live.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("lms.empty")}</p>
          ) : (
            <ul className="space-y-3">
              {live.map((s) => {
                const w = liveWindow(s.startAt, s.durationMin)
                return (
                  <li key={s.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium">{s.topic}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {titleOf(s.formationSlug)} · {formatDateTime(s.startAt, locale)}
                    </p>
                    {w.joinable && (
                      <Button size="sm" className={`mt-2 w-full ${primaryBtn}`} render={<Link href={`/live/${s.id}`} />}>
                        <Video className="size-4" />
                        {t("lms.startLive")}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>

      <LiveRequestsPanel
        role="teacher"
        requests={liveRequests}
        targets={students.map((st) => ({
          key: `${st.formationSlug}:${st.userId}`,
          slug: st.formationSlug,
          studentId: st.userId,
          label: `${st.name} — ${titleOf(st.formationSlug)}`,
        }))}
      />
    </DashboardShell>
  )
}

const CATEGORIES = Object.keys(categoryLabels) as FormationCategory[]
const LEVELS: Level[] = ["beginner", "intermediate", "advanced"]

function NewCourseForm({ onDone }: { onDone: () => void }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(form: FormData) {
    setError(null)
    start(async () => {
      const res = await createCourseAction(Object.fromEntries(form))
      if (!res.ok) return setError(res.error)
      onDone()
      router.push(`/dashboard/teacher/courses/${res.data!.slug}`)
    })
  }

  return (
    <form action={submit} className="mb-6 grid gap-4 rounded-xl border border-[#064E3B]/20 bg-[#064E3B]/[0.03] p-4 md:grid-cols-2 dark:bg-emerald-950/20">
      <div className="md:col-span-2 md:max-w-sm">
        <ImageUpload />
      </div>
      <Field label={t("lms.title")} htmlFor="c-title">
        <Input id="c-title" name="title" required minLength={4} />
      </Field>
      <Field label={t("common.price") + " (USD)"} htmlFor="c-price">
        <Input id="c-price" name="priceUsd" type="number" min={0} step="0.01" defaultValue={19} required />
      </Field>
      <div className="md:col-span-2">
        <Field label={locale === "fr" ? "Résumé" : "Summary"} htmlFor="c-summary">
          <Textarea id="c-summary" name="summary" required minLength={10} className="min-h-16" />
        </Field>
      </div>
      <Field label={t("common.category")} htmlFor="c-cat">
        <select id="c-cat" name="category" className={selectClass}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {localize(categoryLabels[c], locale)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("common.level")} htmlFor="c-level">
        <select id="c-level" name="level" className={selectClass}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {t(`common.${l}`)}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex items-center justify-end gap-2 md:col-span-2">
        <FormError message={error} />
        <Button type="submit" disabled={pending} className={primaryBtn}>
          {pending ? t("common.loading") : t("common.save")}
        </Button>
      </div>
    </form>
  )
}

/** Inline price editor on a course card (the teacher's own courses only). */
function CoursePrice({ slug, price }: { slug: string; price: number }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(price))
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (!editing) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
        <span className="font-heading text-lg font-bold tabular-nums">{price > 0 ? `$${price}` : fr ? "Gratuit" : "Free"}</span>
        <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-[#064E3B] hover:underline dark:text-emerald-400">
          {fr ? "Modifier le prix" : "Edit price"}
        </button>
      </div>
    )
  }

  return (
    <form
      className="mt-3 rounded-lg bg-muted/50 p-2"
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        start(async () => {
          const res = await updateCoursePriceAction({ slug, priceUsd: Number(value) })
          if (!res.ok) return setError(res.error)
          setEditing(false)
          router.refresh()
        })
      }}
    >
      <div className="flex items-center gap-2">
        <span className="pl-1 text-sm text-muted-foreground">$</span>
        <Input
          aria-label={fr ? "Prix en USD" : "Price in USD"}
          type="number"
          min={0}
          max={5000}
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8"
          autoFocus
        />
        <Button type="submit" size="sm" disabled={pending} className={primaryBtn}>
          {fr ? "OK" : "Save"}
        </Button>
        <button type="button" onClick={() => setEditing(false)} className="px-1 text-xs text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>
      {error && <p className="mt-1 px-1 text-xs text-destructive">{error}</p>}
    </form>
  )
}
