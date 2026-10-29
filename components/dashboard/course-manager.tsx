"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  ListChecks,
  PlayCircle,
  Settings2,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  Users,
  Video,
} from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/mock-data"
import type { LessonView, TeacherCourseView } from "@/lib/lms/queries"
import { addLessonAction, deleteLessonAction, endLiveAction, saveExamAction, scheduleLiveAction, updateCourseAction } from "@/lib/lms/actions"
import { EXAM_PASS_SCORE } from "@/lib/lms/catalog"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { teacherNav } from "@/components/dashboard/teacher-dashboard"
import { StudentsTable } from "@/components/dashboard/students-table"
import { EmptyState, Field, FormError, Panel, formatDateTime, liveWindow, selectClass } from "@/components/lms/ui"
import { ImageUpload, uploadToSupabase } from "@/components/lms/upload"
import { categoryLabels, type Formation, type FormationCategory, type Level } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const primaryBtn = "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"

type Tab = "lessons" | "live" | "students" | "exam" | "settings"

export const lessonIcon = { video: PlayCircle, text: FileText, live: Video } as const

export function CourseManager({ data, adminView = false }: { data: TeacherCourseView; adminView?: boolean }) {
  const { t, locale } = useI18n()
  const [tab, setTab] = useState<Tab>("lessons")
  const f = data.formation

  const tabs: { id: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { id: "lessons", label: t("lms.lessons"), icon: ListChecks, count: data.lessons.length },
    { id: "live", label: t("teacher.liveSessions"), icon: Video, count: data.live.length },
    { id: "students", label: t("lms.students"), icon: Users, count: data.students.length },
    { id: "exam", label: t("teacher.exam"), icon: CheckCircle2 },
    { id: "settings", label: locale === "fr" ? "Paramètres" : "Settings", icon: Settings2 },
  ]

  return (
    <DashboardShell nav={teacherNav} titleKey="teacher.title">
      <Link
        href={adminView ? "/dashboard/admin/teachers" : "/dashboard/teacher"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("teacher.myCourses")}
      </Link>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">{localize(f.title, locale)}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{localize(f.summary, locale)}</p>
        </div>
        <Button variant="outline" size="sm" render={<Link href={`/learn/${f.slug}`} />}>
          <PlayCircle className="size-4" />
          {t("lms.openCourse")}
        </Button>
      </div>

      <div role="tablist" className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === x.id
                ? "border-[#064E3B] text-[#064E3B] dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <x.icon className="size-4" />
            {x.label}
            {typeof x.count === "number" && <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{x.count}</span>}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "lessons" && <LessonsTab slug={f.slug} lessons={data.lessons} />}
        {tab === "live" && <LiveTab slug={f.slug} live={data.live} />}
        {tab === "students" && (
          <Panel>
            <StudentsTable students={data.students} />
          </Panel>
        )}
        {tab === "exam" && <ExamTab slug={f.slug} exam={data.exam} />}
        {tab === "settings" && <SettingsTab formation={f} />}
      </div>
    </DashboardShell>
  )
}

// ============================================================
// LESSONS
// ============================================================

function LessonsTab({ slug, lessons }: { slug: string; lessons: LessonView[] }) {
  const { t } = useI18n()
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <Panel title={t("lms.lessons")} icon={ListChecks}>
        {lessons.length === 0 ? (
          <EmptyState icon={ListChecks} title={t("lms.noLessons")} />
        ) : (
          <ol className="space-y-2">
            {lessons.map((l, i) => {
              const Icon = lessonIcon[l.type]
              return (
                <li key={l.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                  <span className="w-6 text-center text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                  <Icon className="size-4 shrink-0 text-[#064E3B] dark:text-emerald-400" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{l.title}</span>
                  {l.durationMin ? <span className="text-xs text-muted-foreground">{l.durationMin} min</span> : null}
                  <button
                    type="button"
                    disabled={pending}
                    aria-label="Delete"
                    onClick={() => {
                      if (!confirm(`${l.title} — delete?`)) return
                      start(async () => {
                        await deleteLessonAction(l.id)
                        router.refresh()
                      })
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </Panel>
      <AddLessonForm slug={slug} />
    </div>
  )
}

function AddLessonForm({ slug, initialType = "video" }: { slug: string; initialType?: "video" | "text" | "live" }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [type, setType] = useState(initialType)
  const [error, setError] = useState<string | null>(null)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [pending, start] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  async function uploadVideo(file: File): Promise<string> {
    return (await uploadToSupabase(file, { kind: "video", slug }, setUploadPct)).path
  }

  function submit(form: FormData) {
    setError(null)
    start(async () => {
      try {
        let res
        if (type === "live") {
          const local = String(form.get("startAt"))
          res = await scheduleLiveAction({
            slug,
            topic: form.get("title"),
            startAt: new Date(local).toISOString(),
            durationMin: form.get("durationMin"),
          })
        } else {
          const file = form.get("file")
          const storagePath = type === "video" && file instanceof File && file.size ? await uploadVideo(file) : undefined
          res = await addLessonAction({
            slug,
            type,
            title: form.get("title"),
            body: form.get("body") ?? undefined,
            durationMin: form.get("durationMin") || undefined,
            storagePath,
          })
        }
        if (!res.ok) return setError(res.error)
        formRef.current?.reset()
        router.refresh()
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setUploadPct(null)
      }
    })
  }

  const types = [
    { id: "video" as const, label: t("teacher.lessonVideo"), icon: PlayCircle },
    { id: "text" as const, label: t("teacher.lessonText"), icon: FileText },
    { id: "live" as const, label: t("teacher.lessonLive"), icon: Video },
  ]

  return (
    <Panel title={t("teacher.addLesson")} icon={Plus}>
      <div className="grid grid-cols-3 gap-2">
        {types.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setType(x.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors",
              type === x.id
                ? "border-[#064E3B] bg-[#064E3B]/5 text-[#064E3B] dark:border-emerald-500 dark:text-emerald-400"
                : "border-border text-muted-foreground hover:border-[#064E3B]/40",
            )}
          >
            <x.icon className="size-5" />
            {x.label}
          </button>
        ))}
      </div>

      <form ref={formRef} action={submit} className="mt-5 space-y-4">
        <Field label={type === "live" ? (locale === "fr" ? "Sujet" : "Topic") : t("lms.title")} htmlFor="l-title">
          <Input id="l-title" name="title" required minLength={2} />
        </Field>

        {type === "video" && (
          <Field
            label={t("teacher.upload")}
            htmlFor="l-file"
            hint={locale === "fr" ? "MP4 ou WebM. Envoyé directement sur Supabase Storage." : "MP4 or WebM. Uploaded directly to Supabase Storage."}
          >
            <label
              htmlFor="l-file"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground hover:border-[#064E3B]/40"
            >
              <UploadCloud className="size-6 text-[#064E3B] dark:text-emerald-400" />
              <input id="l-file" name="file" type="file" accept="video/*" required className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5" />
            </label>
          </Field>
        )}

        {type === "text" && (
          <Field label={t("lms.content")} htmlFor="l-body" hint="Markdown">
            <Textarea id="l-body" name="body" required className="min-h-48 font-mono text-[13px]" />
          </Field>
        )}

        {type === "live" && (
          <>
            <Field label={t("lms.startsAt")} htmlFor="l-start">
              <Input id="l-start" name="startAt" type="datetime-local" required />
            </Field>
            <p className="text-xs text-muted-foreground">
              {locale === "fr"
                ? "Une salle de classe vidéo est créée sur la plateforme. Les étudiants inscrits la rejoignent depuis leur navigateur avec leur webcam ; leur présence est enregistrée."
                : "A video classroom is created on the platform. Enrolled students join from their browser with their webcam, and their attendance is recorded."}
            </p>
          </>
        )}

        <Field label={t("lms.duration")} htmlFor="l-duration">
          <Input
            id="l-duration"
            name="durationMin"
            type="number"
            min={type === "live" ? 15 : 0}
            max={300}
            defaultValue={type === "live" ? 60 : undefined}
            required={type === "live"}
          />
        </Field>

        {uploadPct !== null && (
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-[#064E3B] transition-[width] dark:bg-emerald-500" style={{ width: `${uploadPct}%` }} />
            </div>
            <p className="text-xs tabular-nums text-muted-foreground">{uploadPct}%</p>
          </div>
        )}

        <FormError message={error} />
        <Button type="submit" disabled={pending} className={`w-full ${primaryBtn}`}>
          {pending ? t("common.loading") : type === "live" ? t("teacher.schedule") : t("teacher.addLesson")}
        </Button>
      </form>
    </Panel>
  )
}

// ============================================================
// LIVE
// ============================================================

function LiveTab({ slug, live }: { slug: string; live: TeacherCourseView["live"] }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <Panel title={t("teacher.liveSessions")} icon={Video}>
        {live.length === 0 ? (
          <EmptyState icon={Video} title={t("lms.empty")} />
        ) : (
          <ul className="divide-y divide-border">
            {live.map((s) => {
              const w = liveWindow(s.startAt, s.durationMin)
              return (
                <li key={s.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{s.topic}</p>
                      <Badge variant={s.status === "live" ? "destructive" : s.status === "ended" ? "secondary" : "default"}>
                        {s.status === "live" ? t("lms.liveNow") : s.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(s.startAt, locale)} · {s.durationMin} min · {s.attendees} {t("lms.students").toLowerCase()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {s.status !== "ended" && w.joinable && (
                      <Button size="sm" className={primaryBtn} render={<Link href={`/live/${s.id}`} />}>
                        {t("lms.startLive")}
                      </Button>
                    )}
                    {s.status !== "ended" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            await endLiveAction(s.id)
                            router.refresh()
                          })
                        }
                      >
                        {locale === "fr" ? "Terminer" : "End"}
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
      <AddLessonForm slug={slug} initialType="live" />
    </div>
  )
}

// ============================================================
// EXAM
// ============================================================

type DraftQuestion = { id?: string; prompt: string; options: string[]; answerIndex: number }

function ExamTab({ slug, exam }: { slug: string; exam: TeacherCourseView["exam"] }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [questions, setQuestions] = useState<DraftQuestion[]>(exam?.questions ?? [])
  const [passScore, setPassScore] = useState(exam?.passScore ?? EXAM_PASS_SCORE)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()

  const update = (i: number, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)))

  function save() {
    setError(null)
    setSaved(false)
    start(async () => {
      const res = await saveExamAction({ slug, passScore, questions })
      if (!res.ok) return setError(res.error)
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <Panel
      title={t("teacher.exam")}
      icon={CheckCircle2}
      action={
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="pass" className="text-muted-foreground">
            {t("lms.passMark")}
          </label>
          <Input id="pass" type="number" min={EXAM_PASS_SCORE} max={100} value={passScore} onChange={(e) => setPassScore(Number(e.target.value))} className="h-8 w-20" />
          <span>%</span>
        </div>
      }
    >
      {exam?.source === "ai" && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-[#064E3B]/5 px-3 py-2 text-sm text-[#064E3B] dark:bg-emerald-950/40 dark:text-emerald-300">
          <Sparkles className="size-4" />
          {locale === "fr" ? "Questions générées par l'IA — relisez-les et ajustez-les." : "AI-generated questions — review and adjust them."}
        </p>
      )}
      {!exam && questions.length === 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          {locale === "fr"
            ? "Sans questions de votre part, l'IA générera un examen à partir du contenu du cours au premier passage."
            : "If you don't write questions, the AI will generate an exam from the course content the first time a student takes it."}
        </p>
      )}

      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={q.id ?? i} className="rounded-xl border border-border p-4">
            <div className="flex items-start gap-3">
              <span className="mt-2 text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}.</span>
              <div className="flex-1 space-y-3">
                <Textarea value={q.prompt} onChange={(e) => update(i, { prompt: e.target.value })} className="min-h-14" placeholder="Question" />
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, k) => (
                    <label
                      key={k}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-2 py-1.5",
                        q.answerIndex === k ? "border-success bg-success/5" : "border-border",
                      )}
                    >
                      <input type="radio" name={`answer-${i}`} checked={q.answerIndex === k} onChange={() => update(i, { answerIndex: k })} className="accent-[#064E3B]" />
                      <input
                        value={opt}
                        onChange={(e) => update(i, { options: q.options.map((o, m) => (m === k ? e.target.value : o)) })}
                        placeholder={`Option ${k + 1}`}
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="button"
                aria-label="Delete question"
                onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => setQuestions((qs) => [...qs, { prompt: "", options: ["", "", "", ""], answerIndex: 0 }])}>
          <Plus className="size-4" />
          {t("teacher.addQuestion")}
        </Button>
        <Button onClick={save} disabled={pending || questions.length === 0} className={primaryBtn}>
          {pending ? t("common.loading") : t("common.save")}
        </Button>
        {saved && <span className="text-sm text-success">✓</span>}
      </div>
      <div className="mt-3">
        <FormError message={error} />
      </div>
    </Panel>
  )
}

// ============================================================
// SETTINGS
// ============================================================

function SettingsTab({ formation: f }: { formation: Formation }) {
  const { t, locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const source = (v: { fr: string; en: string }) => (fr ? v.fr : v.en)

  function save(form: FormData) {
    setError(null)
    setSaved(false)
    start(async () => {
      const res = await updateCourseAction({ ...Object.fromEntries(form), slug: f.slug })
      if (!res.ok) return setError(res.error)
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <Panel title={fr ? "Informations du cours" : "Course details"} icon={Settings2}>
      <form action={save} className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div>
          <ImageUpload value={f.image} />
          <p className="mt-2 text-xs text-muted-foreground">
            {fr ? "Image stockée sur Supabase Storage." : "Image stored on Supabase Storage."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label={t("lms.title")} htmlFor="cs-title">
              <Input id="cs-title" name="title" required minLength={4} defaultValue={source(f.title)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label={fr ? "Résumé" : "Summary"} htmlFor="cs-summary">
              <Textarea id="cs-summary" name="summary" required minLength={10} defaultValue={source(f.summary)} className="min-h-16" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Description" htmlFor="cs-desc">
              <Textarea id="cs-desc" name="description" defaultValue={source(f.description)} className="min-h-28" />
            </Field>
          </div>
          <Field label={t("common.category")} htmlFor="cs-cat">
            <select id="cs-cat" name="category" defaultValue={f.category} className={selectClass}>
              {(Object.keys(categoryLabels) as FormationCategory[]).map((c) => (
                <option key={c} value={c}>
                  {fr ? categoryLabels[c].fr : categoryLabels[c].en}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("common.level")} htmlFor="cs-level">
            <select id="cs-level" name="level" defaultValue={f.level} className={selectClass}>
              {(["beginner", "intermediate", "advanced"] as Level[]).map((l) => (
                <option key={l} value={l}>
                  {t(`common.${l}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`${t("common.price")} (USD)`} htmlFor="cs-price">
            <Input id="cs-price" name="priceUsd" type="number" min={0} step="0.01" required defaultValue={f.priceUsd} />
          </Field>
          <div className="flex items-end justify-end gap-3">
            {saved && (
              <span className="text-sm text-success">
                {fr ? "Enregistré · traduction IA en cours" : "Saved · AI translation running"}
              </span>
            )}
            <Button type="submit" disabled={pending} className={primaryBtn}>
              {pending ? t("common.loading") : t("common.save")}
            </Button>
          </div>
          <div className="md:col-span-2">
            <FormError message={error} />
          </div>
        </div>
      </form>
    </Panel>
  )
}
