"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Award,
  BookOpen,
  Check,
  Lock,
  Plus,
  Bot,
  CalendarClock,
  Download,
  GraduationCap,
  PlayCircle,
  ShieldCheck,
  Ticket,
  Sparkles,
  Trophy,
  Video,
} from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { categoryLabels, localize, type Formation } from "@/lib/mock-data"
import { useState, useTransition } from "react"
import { enrollFreeCourseAction } from "@/lib/lms/actions"
import { cn } from "@/lib/utils"
import { BarList, ChartCard, ColumnChart } from "@/components/charts/charts"
import { weekLabel } from "@/components/charts/format"
import { CERTIFICATE_PRICE_USD, CERTIFIER_NAME } from "@/lib/lms/catalog"
import type { LiveRequestView, StudentCourseView, StudentLmsView } from "@/lib/lms/queries"
import { LiveRequestsPanel } from "@/components/lms/live-requests"
import { RateCourse } from "@/components/lms/stars"
import type { TicketView } from "@/lib/events/data"
import { DashboardShell, StatCard, type NavItem } from "@/components/dashboard/dashboard-shell"
import { CheckoutDialog } from "@/components/payments/checkout-dialog"
import { EmptyState, Panel, ProgressBar, formatDate, formatDateTime, liveWindow } from "@/components/lms/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const nav: NavItem[] = [
  { href: "/dashboard/student", labelKey: "dash.overview", icon: GraduationCap },
  { href: "/dashboard/student#courses", labelKey: "student.myFormations", icon: BookOpen },
  { href: "/dashboard/student#catalog", labelKey: "common.discoverFormations", icon: Plus },
  { href: "/dashboard/student#live", labelKey: "lms.upcomingLive", icon: Video },
  { href: "/dashboard/student#certificates", labelKey: "student.certificates", icon: Award },
  { href: "/academy", labelKey: "nav.academy", icon: Bot },
]

const primaryBtn = "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"
const outlineBtn =
  "border-[#064E3B]/30 text-[#064E3B] hover:bg-[#064E3B] hover:text-white dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-800 dark:hover:text-white"

export function StudentDashboard({
  data,
  available = [],
  weekly = [],
  liveRequests = [],
  tickets = [],
  myRatings = {},
}: {
  data: StudentLmsView
  available?: Formation[]
  weekly?: { week: string; count: number }[]
  liveRequests?: LiveRequestView[]
  tickets?: TicketView[]
  /** Stars this student already gave, keyed "formation:<slug>". */
  myRatings?: Record<string, number>
}) {
  const { t, locale } = useI18n()
  const { courses, live, certificates, aiModules } = data

  const avgProgress = courses.length ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) : 0
  const nextLive = live.find((s) => liveWindow(s.startAt, s.durationMin).joinable) ?? live[0]

  return (
    <DashboardShell nav={nav} titleKey="student.title">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("student.myFormations")} value={String(courses.length)} icon={BookOpen} />
        <StatCard label={t("student.progress")} value={`${avgProgress}%`} icon={GraduationCap} />
        <StatCard label={t("lms.upcomingLive")} value={String(live.length)} icon={CalendarClock} />
        <StatCard label={t("student.certificates")} value={String(certificates.length)} icon={Award} />
      </div>

      {nextLive && <LiveBanner session={nextLive} />}

      {courses.length > 0 && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <ChartCard
            title={locale === "fr" ? "Leçons terminées par semaine" : "Lessons completed per week"}
            subtitle={
              locale === "fr"
                ? `${weekly.reduce((s, w) => s + w.count, 0)} leçons sur 8 semaines`
                : `${weekly.reduce((s, w) => s + w.count, 0)} lessons over 8 weeks`
            }
            table={{ columns: [locale === "fr" ? "Semaine du" : "Week of", t("lms.lessons")], rows: weekly.map((w) => [weekLabel(w.week, locale), w.count]) }}
          >
            <ColumnChart
              data={weekly.map((w) => ({ label: weekLabel(w.week, locale), values: { n: w.count } }))}
              series={[{ key: "n", label: t("lms.lessons"), color: "var(--series-brand)" }]}
              ariaLabel={locale === "fr" ? "Leçons terminées par semaine" : "Lessons completed per week"}
              height={190}
            />
          </ChartCard>
          <ChartCard title={locale === "fr" ? "Progression par cours" : "Progress by course"} subtitle={`${t("student.progress")} · ${avgProgress}%`}>
            <BarList
              items={courses.map((c) => ({ label: localize(c.formation.title, locale), value: c.progress, hint: `${c.completedLessons}/${c.lessonCount}` }))}
              max={100}
              format={(n) => `${n}%`}
            />
          </ChartCard>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel id="courses" title={t("student.myFormations")} icon={BookOpen}>
          {courses.length === 0 ? (
            <EmptyState icon={BookOpen} title={t("lms.empty")}>
              <Link href="/formations" className="font-medium text-[#064E3B] underline-offset-2 hover:underline dark:text-emerald-400">
                {t("common.discoverFormations")}
              </Link>
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {courses.map((course) => (
                <CourseRow key={course.formation.slug} course={course} myRating={myRatings[`formation:${course.formation.slug}`]} />
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel id="live" title={t("lms.upcomingLive")} icon={Video}>
            {live.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("lms.empty")}</p>
            ) : (
              <ul className="space-y-3">
                {live.map((s) => {
                  const w = liveWindow(s.startAt, s.durationMin)
                  return (
                    <li key={s.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{s.topic}</p>
                        {w.live && <Badge variant="destructive">{t("lms.liveNow")}</Badge>}
                      </div>
                      {s.formationTitle && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{localize(s.formationTitle, locale)}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(s.startAt, locale)} · {s.durationMin} min
                        </span>
                        {w.joinable && (
                          <Button size="sm" className={primaryBtn} render={<Link href={`/live/${s.id}`} />}>
                            {t("lms.joinLive")}
                          </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel title={t("nav.academy")} icon={Sparkles}>
            {aiModules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {locale === "fr"
                  ? "Apprenez le Twi, le Ga, l'Ewe ou un langage de programmation avec un tuteur personnel."
                  : "Learn Twi, Ga, Ewe or a programming language with a personal tutor."}
              </p>
            ) : (
              <ul className="space-y-2">
                {aiModules.map((mod) => {
                  return (
                    <li key={mod.slug}>
                      <Link
                        href={`/academy/${mod.slug}`}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <span className="truncate">
                          {localize(mod.trackName, locale)} {mod.index} · {localize(mod.title, locale)}
                        </span>
                        <Bot className="size-4 shrink-0 text-[#064E3B] dark:text-emerald-400" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
            <Button variant="outline" size="sm" className={`mt-4 w-full ${outlineBtn}`} render={<Link href="/academy" />}>
              {t("lms.aiModules")}
            </Button>
          </Panel>
        </div>
      </div>

      <LiveRequestsPanel
        role="student"
        requests={liveRequests}
        targets={courses
          .filter((c) => c.formation.teacherId)
          .map((c) => ({
            key: c.formation.slug,
            slug: c.formation.slug,
            label: `${localize(c.formation.title, locale)}${c.formation.teacherName ? ` — ${c.formation.teacherName}` : ""}`,
          }))}
      />

      {tickets.length > 0 && (
        <Panel id="tickets" title={locale === "fr" ? "Mes billets" : "My tickets"} icon={Ticket} className="mt-6">
          <ul className="divide-y divide-border">
            {tickets.map((tk) => (
              <li key={tk.code} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{localize(tk.eventName, locale)}</p>
                  <p className="text-sm text-muted-foreground">
                    {tk.eventDate ? formatDateTime(tk.eventDate, locale) : locale === "fr" ? "Date à annoncer" : "Date to be announced"} · {tk.location} ·{" "}
                    <span className="font-mono">{tk.code}</span>
                  </p>
                </div>
                {tk.status === "active" && (
                  <Button size="sm" variant="outline" render={<a href={`/api/tickets/${tk.code}/pdf`} target="_blank" rel="noreferrer" />}>
                    {locale === "fr" ? "Télécharger" : "Download"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <AddCourses courses={available} />

      <Panel id="certificates" title={t("student.certificates")} icon={ShieldCheck} className="mt-6">
        {certificates.length === 0 ? (
          <EmptyState icon={Award} title={t("lms.certification")}>
            {locale === "fr"
              ? `Terminez un cours, réussissez l'examen, puis obtenez votre certificat ${CERTIFIER_NAME}.`
              : `Finish a course, pass the exam, then get your ${CERTIFIER_NAME} certificate.`}
          </EmptyState>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {certificates.map((c) => (
              <li
                key={c.code}
                className="relative overflow-hidden rounded-xl border border-[#B8893B]/40 bg-gradient-to-br from-[#FBFAF6] to-white p-5 dark:from-emerald-950/30 dark:to-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#064E3B] dark:text-emerald-400">
                      {CERTIFIER_NAME}
                    </p>
                    <p className="mt-1 font-heading font-semibold leading-snug">{localize(c.formationTitle, locale)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(c.issuedAt, locale)} · {c.score}% · {c.code}
                    </p>
                  </div>
                  <Trophy className="size-6 shrink-0 text-[#B8893B]" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" className={primaryBtn} render={<a href={`/api/certificates/${c.code}/pdf`} target="_blank" rel="noreferrer" />}>
                    <Download className="size-4" />
                    {t("student.downloadCertificate")}
                  </Button>
                  <Button size="sm" variant="outline" className={outlineBtn} render={<Link href={`/certificates/${c.code}`} />}>
                    {t("lms.verifyCertificate")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </DashboardShell>
  )
}

function LiveBanner({ session }: { session: StudentLmsView["live"][number] }) {
  const { t, locale } = useI18n()
  const w = liveWindow(session.startAt, session.durationMin)
  return (
    <div className="mt-6 flex flex-col gap-4 overflow-hidden rounded-2xl bg-[#064E3B] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between dark:bg-emerald-900">
      <div className="flex items-center gap-4">
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Video className="size-5" />
          {w.live && <span className="absolute -right-1 -top-1 size-3 animate-pulse rounded-full bg-red-400 ring-2 ring-[#064E3B]" />}
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-emerald-200">{w.live ? t("lms.liveNow") : t("lms.upcomingLive")}</p>
          <p className="truncate font-medium">{session.topic}</p>
          <p className="text-sm text-emerald-100/80">{formatDateTime(session.startAt, locale)}</p>
        </div>
      </div>
      {w.joinable && (
        <Button className="bg-white text-[#064E3B] hover:bg-emerald-50" render={<Link href={`/live/${session.id}`} />}>
          <Video className="size-4" />
          {t("lms.joinLive")}
        </Button>
      )}
    </div>
  )
}

function CourseRow({ course, myRating }: { course: StudentCourseView; myRating?: number }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const { formation: f, progress } = course
  const finished = progress >= 100

  return (
    <li className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row">
      <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-36">
        <Image src={f.image || "/placeholder.svg"} alt="" fill className="object-cover" sizes="128px" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium leading-snug">{localize(f.title, locale)}</h3>
          {course.certificateCode ? (
            <Badge variant="success">{t("common.certificate")}</Badge>
          ) : course.examPassed ? (
            <Badge variant="success">{t("lms.examPassed")}</Badge>
          ) : finished ? (
            <Badge variant="warning">{t("lms.takeExam")}</Badge>
          ) : (
            <Badge variant="secondary">{t("student.inProgress")}</Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {course.completedLessons}/{course.lessonCount} {t("lms.lessons").toLowerCase()}
          {f.teacherName ? ` · ${f.teacherName}` : ""}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={progress} />
          <span className="w-10 text-right text-xs font-medium tabular-nums text-muted-foreground">{progress}%</span>
        </div>
        <Steps course={course} />

        <div className="mt-4 flex flex-wrap gap-2">
          {course.certificateCode ? (
            <Button size="sm" variant="outline" className={outlineBtn} render={<a href={`/api/certificates/${course.certificateCode}/pdf`} target="_blank" rel="noreferrer" />}>
              <Download className="size-4" />
              {t("student.downloadCertificate")}
            </Button>
          ) : course.examPassed ? (
            <CheckoutDialog
              kind="certificate"
              targetSlug={f.slug}
              amountUsd={CERTIFICATE_PRICE_USD}
              onSuccess={() => router.refresh()}
              trigger={
                <Button size="sm" className={primaryBtn}>
                  <Award className="size-4" />
                  {t("lms.getCertified")} · ${CERTIFICATE_PRICE_USD}
                </Button>
              }
            />
          ) : finished ? (
            <Button size="sm" className={primaryBtn} render={<Link href={`/learn/${f.slug}/exam`} />}>
              <Trophy className="size-4" />
              {t("lms.takeExam")}
            </Button>
          ) : null}
          <Button size="sm" variant={finished ? "outline" : "default"} className={finished ? outlineBtn : primaryBtn} render={<Link href={`/learn/${f.slug}`} />}>
            <PlayCircle className="size-4" />
            {t("student.continueFormation")}
          </Button>
        </div>
        <div className="mt-3">
          <RateCourse kind="formation" slug={f.slug} initial={myRating} />
        </div>
      </div>
    </li>
  )
}

/** Learning path for one course: lessons → exam → certificate. */
function Steps({ course }: { course: StudentCourseView }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const lessonsDone = course.progress >= 100
  const steps = [
    {
      label: fr ? "Leçons" : "Lessons",
      detail: `${course.completedLessons}/${course.lessonCount}`,
      state: lessonsDone ? "done" : "current",
    },
    {
      label: fr ? "Examen" : "Exam",
      detail: course.examPassed
        ? `${course.examScore}%`
        : typeof course.examScore === "number"
          ? `${course.examScore}% · ${fr ? "à refaire" : "retry"}`
          : lessonsDone
            ? fr ? "à passer" : "to take"
            : "—",
      state: course.examPassed ? "done" : lessonsDone ? "current" : "locked",
    },
    {
      label: fr ? "Certificat" : "Certificate",
      detail: course.certificateCode ? (fr ? "obtenu" : "earned") : course.examPassed ? `$${CERTIFICATE_PRICE_USD}` : "—",
      state: course.certificateCode ? "done" : course.examPassed ? "current" : "locked",
    },
  ] as const

  return (
    <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
            step.state === "done" && "border-success/30 bg-success/10",
            step.state === "current" && "border-[#064E3B]/30 bg-[#064E3B]/5 dark:border-emerald-700 dark:bg-emerald-950/40",
            step.state === "locked" && "border-border text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
              step.state === "done" && "bg-success text-white",
              step.state === "current" && "bg-[#064E3B] text-white dark:bg-emerald-600",
              step.state === "locked" && "bg-muted text-muted-foreground",
            )}
          >
            {step.state === "done" ? <Check className="size-3" /> : step.state === "locked" ? <Lock className="size-2.5" /> : i + 1}
          </span>
          <span className="min-w-0">
            <span className="block font-medium leading-tight">{step.label}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{step.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

/** Courses the student can add: paid ones through Mobile Money checkout, free ones in one click. */
function AddCourses({ courses }: { courses: Formation[] }) {
  const { t, locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <Panel
      id="catalog"
      title={fr ? "Ajouter des cours" : "Add courses"}
      icon={Plus}
      className="mt-6"
      action={
        <Link href="/formations" className="text-sm font-medium text-[#064E3B] hover:underline dark:text-emerald-400">
          {t("common.viewAll")}
        </Link>
      }
    >
      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{fr ? "Vous suivez déjà tous nos cours." : "You're already taking every course."}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.slice(0, 6).map((f) => (
            <li key={f.slug} className="flex gap-3 rounded-xl border border-border p-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={f.image || "/placeholder.svg"} alt="" fill className="object-cover" sizes="64px" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#064E3B] dark:text-emerald-400">
                  {localize(categoryLabels[f.category], locale)}
                </p>
                <Link href={`/formations/${f.slug}`} className="truncate text-sm font-medium hover:underline">
                  {localize(f.title, locale)}
                </Link>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <span className="font-heading font-bold tabular-nums">{f.priceUsd > 0 ? `$${f.priceUsd}` : fr ? "Gratuit" : "Free"}</span>
                  {f.priceUsd > 0 ? (
                    <CheckoutDialog
                      kind="formation"
                      targetSlug={f.slug}
                      amountUsd={f.priceUsd}
                      onSuccess={() => router.refresh()}
                      trigger={
                        <Button size="sm" className={primaryBtn}>
                          <Plus className="size-3.5" />
                          {fr ? "Ajouter" : "Add"}
                        </Button>
                      }
                    />
                  ) : (
                    <Button
                      size="sm"
                      disabled={pending}
                      className={primaryBtn}
                      onClick={() =>
                        start(async () => {
                          const res = await enrollFreeCourseAction(f.slug)
                          if (!res.ok) return setError(res.error)
                          router.refresh()
                        })
                      }
                    >
                      <Plus className="size-3.5" />
                      {fr ? "Ajouter" : "Add"}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </Panel>
  )
}
