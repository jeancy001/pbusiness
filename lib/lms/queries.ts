import "server-only"
import { redirect } from "next/navigation"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import { randomUUID } from "crypto"

import { getSession, type SessionPayload } from "@/lib/auth/session"
import { isDbConfigured } from "@/lib/db/mongodb"
import { enrollments, formations as formationsCol, users, type Role } from "@/lib/db/models"
import {
  aiModuleAccess,
  attendance,
  certificates,
  examAttempts,
  exams,
  lessonProgress,
  lessons,
  liveRequests,
  liveSessions,
  toObjectId,
  type ExamDoc,
  type LessonDoc,
  type LiveRequestDoc,
  type LiveSessionDoc,
} from "@/lib/db/lms"
import { getFormationBySlug } from "@/lib/data/catalog"
import { AI_MODEL, isAiConfigured } from "@/lib/ai/config"
import { EXAM_PASS_SCORE } from "@/lib/lms/catalog"
import { findAiModule } from "@/lib/lms/ai-tracks"
import type { Formation, LocalizedText } from "@/lib/mock-data"

// ============================================================
// GUARDS
// ============================================================

export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!roles.includes(session.role)) redirect(`/dashboard/${session.role}`)
  return session
}

export async function sessionWithRole(...roles: Role[]): Promise<SessionPayload | null> {
  const session = await getSession()
  return session && roles.includes(session.role) ? session : null
}

export type CourseAccess = "owner" | "admin" | "student" | null

export async function courseAccess(session: SessionPayload | null, slug: string): Promise<CourseAccess> {
  if (!session || !isDbConfigured()) return null
  if (session.role === "admin") return "admin"
  const formation = await getFormationBySlug(slug)
  if (session.role === "teacher" && formation?.teacherId === session.userId) return "owner"
  const enrolled = await (await enrollments()).findOne({ userId: session.userId, formationSlug: slug })
  return enrolled ? "student" : null
}

/** Course access, narrowed for one-to-one sessions to the invited student. */
export async function liveAccess(session: SessionPayload | null, live: LiveSessionDoc): Promise<CourseAccess> {
  const access = await courseAccess(session, live.formationSlug)
  if (access === "student" && live.privateFor && live.privateFor !== session?.userId) return null
  return access
}

// ============================================================
// SERIALIZABLE VIEWS (safe to pass to client components)
// ============================================================

export type LessonView = {
  id: string
  title: string
  type: LessonDoc["type"]
  order: number
  body?: string
  hasMedia: boolean
  durationMin?: number
  liveSessionId?: string
}

export type LiveSessionView = {
  id: string
  formationSlug: string
  formationTitle?: LocalizedText
  topic: string
  startAt: string
  durationMin: number
  status: LiveSessionDoc["status"]
}

export type StudentProgressView = {
  userId: string
  name: string
  email: string
  formationSlug: string
  progress: number
  enrolledAt: string
  attendanceRate: number
  examScore?: number
  certified: boolean
}

function lessonView(doc: LessonDoc): LessonView {
  return {
    id: String(doc._id),
    title: doc.title,
    type: doc.type,
    order: doc.order,
    body: doc.body,
    hasMedia: Boolean(doc.storagePath),
    durationMin: doc.durationMin,
    liveSessionId: doc.liveSessionId,
  }
}

function liveView(doc: LiveSessionDoc, formation?: Formation | null): LiveSessionView {
  return {
    id: String(doc._id),
    formationSlug: doc.formationSlug,
    formationTitle: formation?.title,
    topic: doc.topic,
    startAt: doc.startAt.toISOString(),
    durationMin: doc.durationMin,
    status: doc.status,
  }
}

// ============================================================
// LESSONS & PROGRESS
// ============================================================

export async function getCourseLessons(slug: string): Promise<LessonView[]> {
  if (!isDbConfigured()) return []
  const docs = await (await lessons()).find({ formationSlug: slug }).sort({ order: 1, createdAt: 1 }).toArray()
  return docs.map(lessonView)
}

export async function getCompletedLessonIds(userId: string, slug: string): Promise<string[]> {
  const rows = await (await lessonProgress()).find({ userId, formationSlug: slug }).toArray()
  return rows.map((r) => r.lessonId)
}

export async function recomputeProgress(userId: string, slug: string): Promise<number> {
  const [total, done] = await Promise.all([
    (await lessons()).countDocuments({ formationSlug: slug }),
    (await lessonProgress()).countDocuments({ userId, formationSlug: slug }),
  ])
  const progress = total ? Math.min(100, Math.round((done / total) * 100)) : 0
  await (await enrollments()).updateOne(
    { userId, formationSlug: slug },
    { $set: { progress, status: progress >= 100 ? "completed" : "active" } },
  )
  return progress
}

// ============================================================
// LIVE SESSIONS & ATTENDANCE
// ============================================================

/** Share of the scheduled duration each user actually spent in the meeting, averaged per student. */
async function attendanceRates(slug: string): Promise<Map<string, number>> {
  // One-to-one sessions don't count toward class attendance.
  const sessions = await (await liveSessions()).find({ formationSlug: slug, privateFor: { $exists: false }, startAt: { $lte: new Date() } }).toArray()
  const rates = new Map<string, number>()
  if (!sessions.length) return rates

  const ids = sessions.map((s) => String(s._id))
  const plannedSec = sessions.reduce((sum, s) => sum + s.durationMin * 60, 0)
  const rows = await (await attendance()).find({ sessionId: { $in: ids }, role: "attendee" }).toArray()
  const seconds = new Map<string, number>()
  for (const row of rows) seconds.set(row.userId, (seconds.get(row.userId) ?? 0) + row.secondsPresent)
  for (const [userId, sec] of seconds) rates.set(userId, Math.min(100, Math.round((sec / plannedSec) * 100)))
  return rates
}

export async function getLiveSession(id: string) {
  const _id = toObjectId(id)
  if (!_id || !isDbConfigured()) return null
  return (await liveSessions()).findOne({ _id })
}

// ============================================================
// EXAMS
// ============================================================

const aiExamSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string(),
        options: z.array(z.string()).length(4),
        answerIndex: z.number().int().min(0).max(3),
      }),
    )
    .min(8)
    .max(15),
})

/** Teacher-authored exam, or a generated one persisted on first use so every student gets the same test. */
export async function getOrCreateExam(slug: string): Promise<ExamDoc | null> {
  const col = await exams()
  const existing = await col.findOne({ formationSlug: slug })
  if (existing?.questions.length) return existing
  if (!isAiConfigured()) return null

  const formation = await getFormationBySlug(slug)
  if (!formation) return null
  const lessonTitles = (await getCourseLessons(slug)).map((l) => `- ${l.title}`).join("\n")

  const { object } = await generateObject({
    model: google(AI_MODEL),
    schema: aiExamSchema,
    prompt: `Write a 10-question multiple-choice certification exam for the course "${formation.title.en}".
Course description: ${formation.description.en}
Objectives: ${formation.objectives.map((o) => o.en).join("; ")}
Modules: ${formation.modules.map((mod) => mod.title.en).join("; ")}
${lessonTitles ? `Lessons:\n${lessonTitles}` : ""}
Each question has exactly 4 options and one correct answer. Test real understanding, not trivia. Write in English.`,
  })

  const doc: ExamDoc = {
    formationSlug: slug,
    questions: object.questions.map((q) => ({ id: randomUUID(), ...q })),
    passScore: EXAM_PASS_SCORE,
    source: "ai",
    updatedAt: new Date(),
  }
  await col.updateOne({ formationSlug: slug }, { $set: doc }, { upsert: true })
  return doc
}

export async function bestAttempt(userId: string, slug: string) {
  return (await examAttempts()).findOne({ userId, formationSlug: slug }, { sort: { score: -1 } })
}

// ============================================================
// STUDENT DASHBOARD
// ============================================================

export type StudentCourseView = {
  formation: Formation
  progress: number
  lessonCount: number
  completedLessons: number
  examScore?: number
  examPassed: boolean
  certificateCode?: string
}

export type CertificateView = {
  code: string
  formationTitle: LocalizedText
  score: number
  issuedAt: string
}

export type StudentLmsView = {
  courses: StudentCourseView[]
  live: LiveSessionView[]
  certificates: CertificateView[]
  aiModules: { slug: string; trackName: LocalizedText; index: number; title: LocalizedText }[]
}

export async function getStudentLms(userId: string): Promise<StudentLmsView> {
  const empty: StudentLmsView = { courses: [], live: [], certificates: [], aiModules: [] }
  if (!isDbConfigured()) return empty

  const rows = await (await enrollments()).find({ userId }).sort({ createdAt: -1 }).toArray()
  const slugs = rows.map((r) => r.formationSlug)

  const [certs, attempts, modules, lessonCounts, sessions, doneCounts] = await Promise.all([
    (await certificates()).find({ userId }).sort({ issuedAt: -1 }).toArray(),
    (await examAttempts()).find({ userId }).toArray(),
    (await aiModuleAccess()).find({ userId }).toArray(),
    (await lessons()).aggregate<{ _id: string; n: number }>([
      { $match: { formationSlug: { $in: slugs } } },
      { $group: { _id: "$formationSlug", n: { $sum: 1 } } },
    ]).toArray(),
    (await liveSessions())
      .find({
        formationSlug: { $in: slugs },
        status: { $ne: "ended" },
        startAt: { $gte: new Date(Date.now() - 3 * 3600_000) },
        $or: [{ privateFor: { $exists: false } }, { privateFor: userId }],
      })
      .sort({ startAt: 1 })
      .limit(8)
      .toArray(),
    (await lessonProgress()).aggregate<{ _id: string; n: number }>([
      { $match: { userId, formationSlug: { $in: slugs } } },
      { $group: { _id: "$formationSlug", n: { $sum: 1 } } },
    ]).toArray(),
  ])

  const courses: StudentCourseView[] = []
  const formationBySlug = new Map<string, Formation>()
  for (const row of rows) {
    const formation = await getFormationBySlug(row.formationSlug)
    if (!formation) continue
    formationBySlug.set(row.formationSlug, formation)
    const best = attempts.filter((a) => a.formationSlug === row.formationSlug).sort((a, b) => b.score - a.score)[0]
    courses.push({
      formation,
      progress: row.progress,
      lessonCount: lessonCounts.find((c) => c._id === row.formationSlug)?.n ?? 0,
      completedLessons: doneCounts.find((c) => c._id === row.formationSlug)?.n ?? 0,
      examScore: best?.score,
      examPassed: Boolean(best?.passed),
      certificateCode: certs.find((c) => c.formationSlug === row.formationSlug)?.code,
    })
  }

  const aiLinks: StudentLmsView["aiModules"] = []
  for (const row of modules) {
    const mod = await findAiModule(row.moduleSlug)
    if (mod) aiLinks.push({ slug: mod.slug, trackName: mod.track.name, index: mod.index, title: mod.title })
  }

  return {
    courses,
    live: sessions.map((s) => liveView(s, formationBySlug.get(s.formationSlug))),
    certificates: certs.map((c) => ({
      code: c.code,
      formationTitle: c.formationTitle,
      score: c.score,
      issuedAt: c.issuedAt.toISOString(),
    })),
    aiModules: aiLinks,
  }
}

// ============================================================
// TEACHER DASHBOARD
// ============================================================

export type TeacherView = {
  courses: (Formation & { lessonCount: number; studentCount: number; avgProgress: number })[]
  students: StudentProgressView[]
  live: LiveSessionView[]
}

async function studentsFor(slugs: string[]): Promise<StudentProgressView[]> {
  if (!slugs.length) return []
  const rows = await (await enrollments()).find({ formationSlug: { $in: slugs } }).toArray()
  const ids = [...new Set(rows.map((r) => r.userId))].map(toObjectId).filter(Boolean)
  const people = await (await users())
    .find({ _id: { $in: ids } } as never, { projection: { name: 1, email: 1 } })
    .toArray()
  const byId = new Map(people.map((p) => [String(p._id), p]))
  const certs = await (await certificates()).find({ formationSlug: { $in: slugs } }).toArray()
  const attempts = await (await examAttempts()).find({ formationSlug: { $in: slugs } }).toArray()
  const rates = new Map<string, Map<string, number>>()
  for (const slug of slugs) rates.set(slug, await attendanceRates(slug))

  return rows.map((r) => {
    const person = byId.get(r.userId)
    const scores = attempts.filter((a) => a.userId === r.userId && a.formationSlug === r.formationSlug).map((a) => a.score)
    return {
      userId: r.userId,
      name: person?.name ?? "—",
      email: person?.email ?? "",
      formationSlug: r.formationSlug,
      progress: r.progress,
      enrolledAt: r.createdAt.toISOString(),
      attendanceRate: rates.get(r.formationSlug)?.get(r.userId) ?? 0,
      examScore: scores.length ? Math.max(...scores) : undefined,
      certified: certs.some((c) => c.userId === r.userId && c.formationSlug === r.formationSlug),
    }
  })
}

export async function getTeacherDashboard(teacherId: string): Promise<TeacherView> {
  if (!isDbConfigured()) return { courses: [], students: [], live: [] }
  const owned = (await (await formationsCol())
    .find({ teacherId }, { projection: { _id: 0 } })
    .toArray()) as Formation[]
  const slugs = owned.map((f) => f.slug)
  const [students, counts, sessions] = await Promise.all([
    studentsFor(slugs),
    (await lessons()).aggregate<{ _id: string; n: number }>([
      { $match: { formationSlug: { $in: slugs } } },
      { $group: { _id: "$formationSlug", n: { $sum: 1 } } },
    ]).toArray(),
    (await liveSessions())
      .find({ teacherId, status: { $ne: "ended" }, startAt: { $gte: new Date(Date.now() - 3 * 3600_000) } })
      .sort({ startAt: 1 })
      .limit(10)
      .toArray(),
  ])

  return {
    courses: owned.map((f) => {
      const mine = students.filter((s) => s.formationSlug === f.slug)
      return {
        ...f,
        lessonCount: counts.find((c) => c._id === f.slug)?.n ?? 0,
        studentCount: mine.length,
        avgProgress: mine.length ? Math.round(mine.reduce((sum, s) => sum + s.progress, 0) / mine.length) : 0,
      }
    }),
    students,
    live: sessions.map((s) => liveView(s, owned.find((f) => f.slug === s.formationSlug))),
  }
}

export type TeacherCourseView = {
  formation: Formation
  lessons: LessonView[]
  students: StudentProgressView[]
  live: (LiveSessionView & { attendees: number })[]
  exam: { questions: ExamDoc["questions"]; passScore: number; source: ExamDoc["source"] } | null
}

export async function getTeacherCourse(slug: string): Promise<TeacherCourseView | null> {
  const formation = await getFormationBySlug(slug)
  if (!formation || !isDbConfigured()) return null
  const [lessonList, students, sessions, exam] = await Promise.all([
    getCourseLessons(slug),
    studentsFor([slug]),
    (await liveSessions()).find({ formationSlug: slug }).sort({ startAt: -1 }).limit(20).toArray(),
    (await exams()).findOne({ formationSlug: slug }),
  ])
  const att = await (await attendance())
    .aggregate<{ _id: string; n: number }>([
      { $match: { sessionId: { $in: sessions.map((s) => String(s._id)) }, role: "attendee" } },
      { $group: { _id: "$sessionId", n: { $sum: 1 } } },
    ])
    .toArray()

  return {
    formation,
    lessons: lessonList,
    students,
    live: sessions.map((s) => ({ ...liveView(s, formation), attendees: att.find((a) => a._id === String(s._id))?.n ?? 0 })),
    exam: exam ? { questions: exam.questions, passScore: exam.passScore, source: exam.source } : null,
  }
}

// ============================================================
// ADMIN — TEACHERS
// ============================================================

export type TeacherSummary = {
  id: string
  name: string
  email: string
  expertise?: string
  createdAt: string
  courseSlugs: string[]
  studentCount: number
}

export async function getAdminTeachers(): Promise<{ teachers: TeacherSummary[]; formations: Formation[] }> {
  if (!isDbConfigured()) return { teachers: [], formations: [] }
  const [teacherDocs, formationDocs] = await Promise.all([
    (await users()).find({ role: "teacher" }, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray(),
    (await formationsCol()).find({}, { projection: { _id: 0 } }).toArray() as Promise<Formation[]>,
  ])
  const counts = await (await enrollments())
    .aggregate<{ _id: string; n: number }>([{ $group: { _id: "$formationSlug", n: { $sum: 1 } } }])
    .toArray()

  // Courses that only exist in the bundled catalog are still assignable.
  const { formations: bundled } = await import("@/lib/mock-data")
  const allFormations = [...formationDocs, ...bundled.filter((b) => !formationDocs.some((f) => f.slug === b.slug))]

  return {
    teachers: teacherDocs.map((t) => {
      const courseSlugs = formationDocs.filter((f) => f.teacherId === String(t._id)).map((f) => f.slug)
      return {
        id: String(t._id),
        name: t.name,
        email: t.email,
        expertise: t.expertise,
        createdAt: t.createdAt.toISOString(),
        courseSlugs,
        studentCount: counts.filter((c) => courseSlugs.includes(c._id)).reduce((sum, c) => sum + c.n, 0),
      }
    }),
    formations: allFormations,
  }
}

// ============================================================
// ONE-TO-ONE LIVE REQUESTS
// ============================================================

export type LiveRequestView = {
  id: string
  formationSlug: string
  courseTitle?: LocalizedText
  /** The other person: the teacher for a student, the student for a teacher. */
  withName: string
  incoming: boolean
  topic: string
  message?: string
  proposedAt: string
  durationMin: number
  status: LiveRequestDoc["status"]
  liveSessionId?: string
}

/** Pending requests plus recent answers (last 14 days) for a student or a teacher. */
export async function getLiveRequests(userId: string, role: "student" | "teacher"): Promise<LiveRequestView[]> {
  if (!isDbConfigured()) return []
  const mine = role === "teacher" ? { teacherId: userId } : { studentId: userId }
  const docs = await (await liveRequests())
    .find({ ...mine, $or: [{ status: "pending" }, { createdAt: { $gte: new Date(Date.now() - 14 * 86_400_000) } }] })
    .sort({ createdAt: -1 })
    .limit(30)
    .toArray()
  const titles = new Map<string, LocalizedText | undefined>()
  for (const slug of new Set(docs.map((d) => d.formationSlug))) titles.set(slug, (await getFormationBySlug(slug))?.title)
  return docs.map((d) => ({
    id: String(d._id),
    formationSlug: d.formationSlug,
    courseTitle: titles.get(d.formationSlug),
    withName: role === "teacher" ? d.studentName : d.teacherName,
    incoming: d.requestedBy !== role,
    topic: d.topic,
    message: d.message,
    proposedAt: d.proposedAt.toISOString(),
    durationMin: d.durationMin,
    status: d.status,
    liveSessionId: d.liveSessionId,
  }))
}
