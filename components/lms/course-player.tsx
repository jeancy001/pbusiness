"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, FileText, PlayCircle, Trophy, Video } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize, type Formation } from "@/lib/mock-data"
import type { LessonView } from "@/lib/lms/queries"
import { completeLessonAction } from "@/lib/lms/actions"
import { EmptyState, FormError, ProgressBar, formatDateTime, liveWindow } from "@/components/lms/ui"
import { Markdown } from "@/components/lms/markdown"
import { ReportTeacher } from "@/components/lms/report-teacher"
import { TeacherName } from "@/components/teachers/certified-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const primaryBtn = "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"
const icons = { video: PlayCircle, text: FileText, live: Video } as const

type LiveInfo = Record<string, { startAt: string; durationMin: number; status: string }>

export function CoursePlayer({
  formation,
  lessons,
  currentId,
  completed: initialCompleted,
  progress: initialProgress,
  isStudent,
  live,
}: {
  formation: Formation
  lessons: LessonView[]
  currentId: string | null
  completed: string[]
  progress: number
  isStudent: boolean
  live: LiveInfo
}) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [completed, setCompleted] = useState(initialCompleted)
  const [progress, setProgress] = useState(initialProgress)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const index = lessons.findIndex((l) => l.id === currentId)
  const lesson = lessons[index] ?? null
  const prev = lessons[index - 1]
  const next = lessons[index + 1]
  const done = lesson ? completed.includes(lesson.id) : false
  const href = (id: string) => `/learn/${formation.slug}?lesson=${id}`

  function markComplete() {
    if (!lesson) return
    setError(null)
    start(async () => {
      const res = await completeLessonAction({ slug: formation.slug, lessonId: lesson.id })
      if (!res.ok) return setError(res.error)
      setCompleted((c) => [...c, lesson.id])
      setProgress(res.data!.progress)
      if (next) router.push(href(next.id))
    })
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Outline */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Link
          href={isStudent ? "/dashboard/student" : `/dashboard/teacher/courses/${formation.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("nav.dashboard")}
        </Link>
        <div className="mt-4 rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h1 className="font-heading font-semibold leading-snug">{localize(formation.title, locale)}</h1>
            {formation.teacherName && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                <TeacherName name={formation.teacherName} certified={formation.teacherCertified} />
              </p>
            )}
            {isStudent && formation.teacherId && formation.teacherName && <ReportTeacher slug={formation.slug} teacherName={formation.teacherName} />}
            {isStudent && (
              <div className="mt-3 flex items-center gap-2">
                <ProgressBar value={progress} />
                <span className="text-xs font-medium tabular-nums">{progress}%</span>
              </div>
            )}
          </div>
          <ol className="max-h-[60vh] overflow-y-auto p-2">
            {lessons.map((l, i) => {
              const Icon = icons[l.type]
              const isDone = completed.includes(l.id)
              return (
                <li key={l.id}>
                  <Link
                    href={href(l.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      l.id === currentId
                        ? "bg-[#064E3B]/10 font-medium text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "hover:bg-muted",
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {i + 1}. {l.title}
                    </span>
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              )
            })}
          </ol>
          {isStudent && progress >= 100 && (
            <div className="border-t border-border p-3">
              <Button className={`w-full ${primaryBtn}`} render={<Link href={`/learn/${formation.slug}/exam`} />}>
                <Trophy className="size-4" />
                {t("lms.takeExam")}
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Lesson */}
      <main className="min-w-0">
        {!lesson ? (
          <EmptyState icon={FileText} title={t("lms.noLessons")} />
        ) : (
          <article className="overflow-hidden rounded-2xl border border-border bg-card">
            {lesson.type === "video" && (
              <div className="aspect-video bg-black">
                {lesson.hasMedia ? (
                  <video
                    key={lesson.id}
                    src={`/api/lessons/${lesson.id}/media`}
                    controls
                    controlsList="nodownload"
                    playsInline
                    className="size-full"
                    onEnded={() => isStudent && !done && markComplete()}
                  />
                ) : null}
              </div>
            )}

            <div className="p-6 md:p-8">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("lms.lessons")} {index + 1}/{lessons.length}
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight">{lesson.title}</h2>

              {lesson.type === "text" && lesson.body && (
                <div className="mt-6 max-w-3xl text-[15px]">
                  <Markdown source={lesson.body} />
                </div>
              )}

              {lesson.type === "live" && lesson.liveSessionId && live[lesson.liveSessionId] && (
                <LiveLessonCard id={lesson.liveSessionId} info={live[lesson.liveSessionId]} />
              )}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <div className="flex gap-2">
                  {prev && (
                    <Button variant="outline" size="sm" render={<Link href={href(prev.id)} />}>
                      <ArrowLeft className="size-4" />
                      {t("common.previous")}
                    </Button>
                  )}
                  {next && (
                    <Button variant="outline" size="sm" render={<Link href={href(next.id)} />}>
                      {t("common.next")}
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
                {isStudent &&
                  (done ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                      <CheckCircle2 className="size-4" />
                      {t("lms.lessonDone")}
                    </span>
                  ) : (
                    <Button onClick={markComplete} disabled={pending} className={primaryBtn}>
                      <CheckCircle2 className="size-4" />
                      {t("lms.markComplete")}
                    </Button>
                  ))}
              </div>
              <div className="mt-3">
                <FormError message={error} />
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  )
}

function LiveLessonCard({ id, info }: { id: string; info: LiveInfo[string] }) {
  const { t, locale } = useI18n()
  const w = liveWindow(info.startAt, info.durationMin)
  const ended = info.status === "ended"

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-xl border border-[#064E3B]/20 bg-[#064E3B]/5 p-5 sm:flex-row sm:items-center sm:justify-between dark:bg-emerald-950/30">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-[#064E3B] text-white">
          <Video className="size-5" />
        </span>
        <div>
          <p className="font-medium">{w.live && !ended ? t("lms.liveNow") : formatDateTime(info.startAt, locale)}</p>
          <p className="text-sm text-muted-foreground">
            {locale === "fr" ? "Visio en direct" : "Live video"} · {info.durationMin} min
          </p>
        </div>
      </div>
      {!ended && w.joinable && (
        <Button className={primaryBtn} render={<Link href={`/live/${id}`} />}>
          {t("lms.joinLive")}
        </Button>
      )}
    </div>
  )
}
