"use server"

import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import { enrollments, formations as formationsCol, users } from "@/lib/db/models"
import { aiModuleAccess, aiTracksCol, byUserId, examAttempts, exams, lessonProgress, lessons, liveRequests, liveSessions, toObjectId } from "@/lib/db/lms"
import { formations as bundledFormations, type Formation } from "@/lib/mock-data"
import { isOwnMediaUrl, removeObject } from "@/lib/storage/supabase"
import { translateStoredCourse } from "@/lib/ai/translate"
import { EXAM_PASS_SCORE, aiCertKey, aiModuleSlug, aiTracks, effectivePassScore } from "@/lib/lms/catalog"
import { aiProgressFor, findAiModule, findAiTrack, generateAiSyllabus, getOrCreateAiExam, ownsAiTrack, trackCompleted } from "@/lib/lms/ai-tracks"
import { issueAiCertificate } from "@/lib/lms/certificates"
import { ensureCover, resetCover } from "@/lib/lms/ai-covers"
import { ratings } from "@/lib/lms/ratings"
import { isAiConfigured } from "@/lib/ai/config"
import { notifyCertificate, notifyLiveRequest } from "@/lib/email/notify"
import { courseAccess, getOrCreateExam, recomputeProgress, sessionWithRole } from "@/lib/lms/queries"
import { getSession } from "@/lib/auth/session"
import { getFormationBySlug, isOnSale } from "@/lib/data/catalog"
import { notifyAccountCreated, notifyCourseAssigned, notifyLessonPublished, notifyLiveScheduled } from "@/lib/email/notify"

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

const fail = (error: string): ActionResult<never> => ({ ok: false, error })

function firstIssue(err: z.ZodError) {
  return err.issues[0]?.message ?? "Invalid input"
}

/** Teacher must own the course; admins may manage any course. */
async function requireCourseManager(slug: string) {
  const session = await sessionWithRole("teacher", "admin")
  if (!session) return null
  const access = await courseAccess(session, slug)
  return access === "owner" || access === "admin" ? session : null
}

// ============================================================
// ADMIN
// ============================================================

const teacherSchema = z.object({
  name: z.string().trim().min(2, "Name too short"),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  expertise: z.string().trim().max(120).optional(),
})

/** Main admins and assistant admins (staff) can add teachers. */
export async function createTeacherAction(input: unknown): Promise<ActionResult> {
  const admin = await sessionWithRole("admin", "staff")
  if (!admin) return fail("Forbidden")
  const parsed = teacherSchema.safeParse(input)
  if (!parsed.success) return fail(firstIssue(parsed.error))

  const { name, email, password, expertise } = parsed.data
  const col = await users()
  if (await col.findOne({ email: email.toLowerCase() })) return fail("An account with this email already exists.")

  await col.insertOne({
    name,
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    role: "teacher",
    expertise,
    createdBy: admin.userId,
    createdAt: new Date(),
  })
  notifyAccountCreated({ name, email: email.toLowerCase(), role: "teacher" }, password)
  revalidatePath("/dashboard/admin/teachers")
  revalidatePath("/dashboard/staff")
  return { ok: true }
}

export async function assignCourseAction(input: { slug: string; teacherId: string | null }): Promise<ActionResult> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")

  let teacherName: string | undefined
  if (input.teacherId) {
    const teacher = await (await users()).findOne(byUserId(input.teacherId))
    if (!teacher || teacher.role !== "teacher") return fail("Teacher not found")
    if (teacher.suspended) return fail("Ce formateur est suspendu. / This teacher is suspended.")
    teacherName = teacher.name
  }

  const col = await formationsCol()
  // Courses from the bundled catalog are materialised on first assignment.
  if (!(await col.findOne({ slug: input.slug }))) {
    const bundled = bundledFormations.find((f) => f.slug === input.slug)
    if (!bundled) return fail("Course not found")
    await col.insertOne({ ...bundled })
  }
  await col.updateOne(
    { slug: input.slug },
    input.teacherId
      ? { $set: { teacherId: input.teacherId, teacherName }, $unset: { teacherSuspended: "" } as never }
      : { $unset: { teacherId: "", teacherName: "", teacherSuspended: "" } as never },
  )
  if (input.teacherId) notifyCourseAssigned(input.teacherId, input.slug)
  revalidatePath("/dashboard/admin/teachers")
  return { ok: true }
}

// ============================================================
// TEACHER — COURSES
// ============================================================

const courseSchema = z.object({
  title: z.string().trim().min(4, "Title too short").max(120),
  summary: z.string().trim().min(10, "Summary too short").max(300),
  description: z.string().trim().max(3000).optional(),
  category: z.enum(["programming", "web", "mobile", "desktop", "saas", "api", "database", "tools", "marketing", "entrepreneurship", "payments"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  priceUsd: z.coerce.number().min(0).max(5000),
  image: z.string().max(500).optional(),
  /** Admin only: the teacher who will own the course. */
  teacherId: z.string().max(40).optional(),
})

const defaultCover = (category: string) =>
  `/courses/${["web", "mobile", "api", "saas", "payments"].includes(category) ? category : "programming"}.png`

/** Translates in the background so creating/saving a course stays instant. */
function translateLater(slug: string) {
  after(async () => {
    try {
      await translateStoredCourse(slug)
      revalidatePath("/formations")
    } catch (error) {
      console.error(`Course translation failed (${slug}): ${String((error as Error)?.message ?? error).slice(0, 200)}`)
    }
  })
}

export async function createCourseAction(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const session = await sessionWithRole("teacher", "admin")
  if (!session) return fail("Forbidden")
  const parsed = courseSchema.safeParse(input)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const d = parsed.data

  const base = d.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
  const slug = `${base}-${randomUUID().slice(0, 6)}`
  const text = (s: string) => ({ fr: s, en: s })

  const formation: Formation = {
    id: slug,
    slug,
    title: text(d.title),
    summary: text(d.summary),
    description: text(d.description || d.summary),
    category: d.category,
    level: d.level,
    priceUsd: d.priceUsd,
    durationHours: 0,
    moduleCount: 0,
    studentsCount: 0,
    rating: 5,
    isNew: true,
    objectives: [],
    prerequisites: [],
    modules: [],
    image: d.image && isOwnMediaUrl(d.image) ? d.image : defaultCover(d.category),
  }

  // A teacher's own course earns them 90%; an admin-created course is the platform's, even once assigned to a teacher.
  formation.revenueOwner = session.role === "teacher" ? "teacher" : "platform"
  if (session.role === "teacher") {
    formation.teacherId = session.userId
    formation.teacherName = session.name
  } else if (d.teacherId) {
    const teacher = await (await users()).findOne(byUserId(d.teacherId))
    if (!teacher || teacher.role !== "teacher") return fail("Teacher not found")
    formation.teacherId = d.teacherId
    formation.teacherName = teacher.name
  }

  await (await formationsCol()).insertOne(formation)
  if (session.role === "admin" && formation.teacherId) notifyCourseAssigned(formation.teacherId, slug)
  translateLater(slug)
  revalidatePath("/dashboard/teacher")
  revalidatePath("/dashboard/admin/courses")
  revalidatePath("/formations")
  return { ok: true, data: { slug } }
}

const updateSchema = courseSchema.omit({ teacherId: true }).extend({ slug: z.string().min(1) })

/** Edit a course's details and cover (owner or admin); translations are refreshed. */
export async function updateCourseAction(input: unknown): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const d = parsed.data
  if (!(await requireCourseManager(d.slug))) return fail("Forbidden")

  const text = (v: string) => ({ fr: v, en: v })
  await (await formationsCol()).updateOne(
    { slug: d.slug },
    {
      $set: {
        title: text(d.title),
        summary: text(d.summary),
        description: text(d.description || d.summary),
        category: d.category,
        level: d.level,
        priceUsd: d.priceUsd,
        ...(d.image && isOwnMediaUrl(d.image) ? { image: d.image } : {}),
      },
    },
  )
  translateLater(d.slug)
  revalidatePath(`/dashboard/teacher/courses/${d.slug}`)
  revalidatePath("/formations")
  revalidatePath(`/formations/${d.slug}`)
  return { ok: true }
}

/** Students join a free ($0) course directly; paid courses go through checkout. */
export async function enrollFreeCourseAction(slug: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return fail("Log in to add this course.")
  const course = await getFormationBySlug(slug)
  if (!course || !isOnSale(course)) return fail("Course not found")
  if (course.priceUsd > 0) return fail("This course is paid.")
  await (await enrollments()).updateOne(
    { userId: session.userId, formationSlug: slug },
    { $setOnInsert: { userId: session.userId, formationSlug: slug, progress: 0, status: "active", createdAt: new Date() } },
    { upsert: true },
  )
  revalidatePath("/dashboard/student")
  return { ok: true }
}

/** Teacher (own courses) or admin sets a course price. $0 makes the course free. */
export async function updateCoursePriceAction(input: { slug: string; priceUsd: number }): Promise<ActionResult> {
  const parsed = z.object({ slug: z.string().min(1), priceUsd: z.coerce.number().min(0, "Price can't be negative").max(5000, "Maximum price is $5000") }).safeParse(input)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const { slug } = parsed.data
  if (!(await requireCourseManager(slug))) return fail("Forbidden")

  const col = await formationsCol()
  // Bundled courses are stored on first change.
  if (!(await col.findOne({ slug }))) {
    const bundled = bundledFormations.find((f) => f.slug === slug)
    if (!bundled) return fail("Course not found")
    await col.insertOne({ ...bundled })
  }
  await col.updateOne({ slug }, { $set: { priceUsd: Math.round(parsed.data.priceUsd * 100) / 100 } })
  revalidatePath("/dashboard/teacher")
  revalidatePath("/formations")
  revalidatePath(`/formations/${slug}`)
  revalidatePath("/dashboard/student")
  return { ok: true }
}

const studentSchema = z.object({
  name: z.string().trim().min(2, "Name too short"),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  courseSlug: z.string().max(120).optional(),
})

/** Admin creates a student account (emailed with a temporary password), optionally enrolled in a course. */
export async function createStudentAction(input: unknown): Promise<ActionResult> {
  const admin = await sessionWithRole("admin")
  if (!admin) return fail("Forbidden")
  const parsed = studentSchema.safeParse(input)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const { name, password } = parsed.data
  const email = parsed.data.email.toLowerCase()

  const col = await users()
  if (await col.findOne({ email })) return fail("An account with this email already exists.")
  const { insertedId } = await col.insertOne({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "student",
    createdBy: admin.userId,
    createdAt: new Date(),
  })

  if (parsed.data.courseSlug) {
    await (await enrollments()).updateOne(
      { userId: String(insertedId), formationSlug: parsed.data.courseSlug },
      { $setOnInsert: { userId: String(insertedId), formationSlug: parsed.data.courseSlug, progress: 0, status: "active", createdAt: new Date() } },
      { upsert: true },
    )
  }
  notifyAccountCreated({ name, email, role: "student" }, password)
  revalidatePath("/dashboard/admin/users")
  return { ok: true }
}

/** Admin: show or hide a course in the public catalog (bundled courses are stored on first change). */
export async function setCourseVisibilityAction(input: { slug: string; hidden: boolean }): Promise<ActionResult> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")
  const col = await formationsCol()
  if (!(await col.findOne({ slug: input.slug }))) {
    const bundled = bundledFormations.find((f) => f.slug === input.slug)
    if (!bundled) return fail("Course not found")
    await col.insertOne({ ...bundled })
  }
  await col.updateOne({ slug: input.slug }, { $set: { hidden: input.hidden } as never })
  revalidatePath("/dashboard/admin/courses")
  revalidatePath("/formations")
  return { ok: true }
}

/** Admin: translate every stored course into all platform languages. */
export async function translateAllCoursesAction(): Promise<ActionResult<{ count: number }>> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")
  const col = await formationsCol()
  // Store the bundled starter courses first so they get translated too.
  const stored = new Set((await col.find({}, { projection: { slug: 1 } }).toArray()).map((f) => f.slug))
  const missing = bundledFormations.filter((f) => !stored.has(f.slug))
  if (missing.length) await col.insertMany(missing.map((f) => ({ ...f })))
  const slugs = [...stored, ...missing.map((f) => f.slug)]
  after(async () => {
    for (const slug of slugs) {
      await translateStoredCourse(slug).catch((e) => console.error(`Translation failed (${slug}): ${String(e?.message ?? e).slice(0, 200)}`))
    }
    revalidatePath("/formations")
  })
  return { ok: true, data: { count: slugs.length } }
}

// ============================================================
// TEACHER — LESSONS
// ============================================================

const lessonSchema = z.object({
  slug: z.string().min(1),
  type: z.enum(["video", "text"]),
  title: z.string().trim().min(2, "Title too short").max(160),
  body: z.string().max(50_000).optional(),
  storagePath: z.string().max(400).optional(),
  durationMin: z.coerce.number().int().min(0).max(600).optional(),
})

export async function addLessonAction(input: unknown): Promise<ActionResult> {
  const parsed = lessonSchema.safeParse(input)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const d = parsed.data
  const session = await requireCourseManager(d.slug)
  if (!session) return fail("Forbidden")

  if (d.type === "video" && !d.storagePath?.startsWith(`${d.slug}/`)) return fail("Upload a video first")
  if (d.type === "text" && !d.body?.trim()) return fail("Write the lesson content")

  const col = await lessons()
  const last = await col.findOne({ formationSlug: d.slug }, { sort: { order: -1 } })
  await col.insertOne({
    formationSlug: d.slug,
    title: d.title,
    type: d.type,
    order: (last?.order ?? 0) + 1,
    body: d.type === "text" ? d.body : undefined,
    storagePath: d.type === "video" ? d.storagePath : undefined,
    durationMin: d.durationMin,
    createdBy: session.userId,
    createdAt: new Date(),
  })
  notifyLessonPublished(d.slug, d.title)
  revalidatePath(`/dashboard/teacher/courses/${d.slug}`)
  return { ok: true }
}

export async function deleteLessonAction(lessonId: string): Promise<ActionResult> {
  const _id = toObjectId(lessonId)
  if (!_id) return fail("Invalid lesson")
  const col = await lessons()
  const lesson = await col.findOne({ _id })
  if (!lesson) return fail("Lesson not found")
  if (!(await requireCourseManager(lesson.formationSlug))) return fail("Forbidden")

  await col.deleteOne({ _id })
  await (await lessonProgress()).deleteMany({ lessonId })
  if (lesson.storagePath) await removeObject(lesson.storagePath).catch(() => undefined)
  revalidatePath(`/dashboard/teacher/courses/${lesson.formationSlug}`)
  return { ok: true }
}

// ============================================================
// TEACHER — LIVE SESSIONS (WebRTC)
// ============================================================

const liveSchema = z.object({
  slug: z.string().min(1),
  topic: z.string().trim().min(3, "Topic too short").max(200),
  startAt: z.coerce.date(),
  durationMin: z.coerce.number().int().min(15).max(300),
})

export async function scheduleLiveAction(input: unknown): Promise<ActionResult> {
  const parsed = liveSchema.safeParse(input)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const d = parsed.data
  const session = await requireCourseManager(d.slug)
  if (!session) return fail("Forbidden")

  // The classroom is native WebRTC: the session id is the room.
  const res = await (await liveSessions()).insertOne({
    formationSlug: d.slug,
    teacherId: session.userId,
    topic: d.topic,
    startAt: d.startAt,
    durationMin: d.durationMin,
    status: "scheduled",
    createdAt: new Date(),
  })

  // A live class also appears in the course outline, so it counts toward progress.
  const col = await lessons()
  const last = await col.findOne({ formationSlug: d.slug }, { sort: { order: -1 } })
  await col.insertOne({
    formationSlug: d.slug,
    title: d.topic,
    type: "live",
    order: (last?.order ?? 0) + 1,
    durationMin: d.durationMin,
    liveSessionId: String(res.insertedId),
    createdBy: session.userId,
    createdAt: new Date(),
  })
  notifyLiveScheduled(d.slug, { id: String(res.insertedId), topic: d.topic, startAt: d.startAt, durationMin: d.durationMin })
  revalidatePath(`/dashboard/teacher/courses/${d.slug}`)
  revalidatePath("/dashboard/teacher")
  return { ok: true }
}

export async function endLiveAction(sessionId: string): Promise<ActionResult> {
  const _id = toObjectId(sessionId)
  const col = await liveSessions()
  const live = _id ? await col.findOne({ _id }) : null
  if (!_id || !live) return fail("Session not found")
  if (!(await requireCourseManager(live.formationSlug))) return fail("Forbidden")

  await col.updateOne({ _id }, { $set: { status: "ended" } })
  revalidatePath(`/dashboard/teacher/courses/${live.formationSlug}`)
  return { ok: true }
}

// ============================================================
// ONE-TO-ONE LIVE REQUESTS (WebRTC)
// A student asks their course teacher for a live session, or the teacher
// invites one of their students. Accepting creates a private live room.
// ============================================================

const liveRequestSchema = z.object({
  slug: z.string().min(1),
  /** Required when a teacher invites a student. */
  studentId: z.string().max(40).optional(),
  topic: z.string().trim().min(3, "Topic too short").max(200),
  message: z.string().trim().max(1000).optional(),
  proposedAt: z.coerce.date(),
  durationMin: z.coerce.number().int().min(15).max(180),
})

export async function requestLiveAction(input: unknown): Promise<ActionResult> {
  const parsed = liveRequestSchema.safeParse(input)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const d = parsed.data
  const session = await sessionWithRole("student", "client", "teacher")
  if (!session) return fail("Forbidden")
  if (d.proposedAt.getTime() < Date.now() - 10 * 60_000) return fail("Pick a time in the future.")
  if (d.proposedAt.getTime() > Date.now() + 90 * 86_400_000) return fail("Pick a date within the next 90 days.")

  const course = await getFormationBySlug(d.slug)
  if (!course?.teacherId) return fail("This course has no teacher yet.")
  const access = await courseAccess(session, d.slug)

  let studentId: string
  let studentName: string
  if (session.role === "teacher") {
    if (access !== "owner") return fail("Forbidden")
    if (!d.studentId) return fail("Choose a student")
    const enrolled = await (await enrollments()).findOne({ userId: d.studentId, formationSlug: d.slug })
    const student = enrolled ? await (await users()).findOne(byUserId(d.studentId)) : null
    if (!student) return fail("This student is not enrolled in the course.")
    studentId = d.studentId
    studentName = student.name
  } else {
    if (access !== "student") return fail("Enrol in this course to request a live session.")
    studentId = session.userId
    studentName = session.name
  }

  const col = await liveRequests()
  if ((await col.countDocuments({ studentId, teacherId: course.teacherId, status: "pending" })) >= 3) {
    return fail("You already have 3 pending requests. Wait for an answer first.")
  }
  const doc = {
    formationSlug: d.slug,
    studentId,
    studentName,
    teacherId: course.teacherId,
    teacherName: course.teacherName ?? "Teacher",
    requestedBy: session.role === "teacher" ? ("teacher" as const) : ("student" as const),
    topic: d.topic,
    message: d.message || undefined,
    proposedAt: d.proposedAt,
    durationMin: d.durationMin,
    status: "pending" as const,
    createdAt: new Date(),
  }
  const { insertedId } = await col.insertOne(doc)
  notifyLiveRequest({ ...doc, _id: insertedId }, "requested")
  revalidatePath("/dashboard/student")
  revalidatePath("/dashboard/teacher")
  return { ok: true }
}

/** The invitee accepts or declines; accepting opens a private WebRTC room. */
export async function respondLiveRequestAction(input: { id: string; accept: boolean }): Promise<ActionResult<{ liveSessionId?: string }>> {
  const session = await getSession()
  const _id = toObjectId(input.id)
  if (!session || !_id) return fail("Forbidden")
  const col = await liveRequests()
  const req = await col.findOne({ _id, status: "pending" })
  if (!req) return fail("This request is no longer pending.")
  const inviteeId = req.requestedBy === "student" ? req.teacherId : req.studentId
  if (inviteeId !== session.userId) return fail("Forbidden")

  if (!input.accept) {
    await col.updateOne({ _id }, { $set: { status: "declined", respondedAt: new Date() } })
    notifyLiveRequest(req as typeof req & { _id: unknown }, "declined")
    revalidatePath("/dashboard/student")
    revalidatePath("/dashboard/teacher")
    return { ok: true }
  }

  // A request accepted after its proposed time starts right away.
  const startAt = req.proposedAt.getTime() < Date.now() ? new Date() : req.proposedAt
  const live = await (await liveSessions()).insertOne({
    formationSlug: req.formationSlug,
    teacherId: req.teacherId,
    topic: req.topic,
    startAt,
    durationMin: req.durationMin,
    status: "scheduled",
    privateFor: req.studentId,
    requestId: input.id,
    createdAt: new Date(),
  })
  const liveSessionId = String(live.insertedId)
  // Guarded on "pending" so a double click can't accept twice.
  const res = await col.updateOne({ _id, status: "pending" }, { $set: { status: "accepted", liveSessionId, proposedAt: startAt, respondedAt: new Date() } })
  if (!res.modifiedCount) {
    await (await liveSessions()).deleteOne({ _id: live.insertedId })
    return fail("This request is no longer pending.")
  }
  notifyLiveRequest({ ...req, _id, liveSessionId, proposedAt: startAt }, "accepted")
  revalidatePath("/dashboard/student")
  revalidatePath("/dashboard/teacher")
  return { ok: true, data: { liveSessionId } }
}

export async function cancelLiveRequestAction(id: string): Promise<ActionResult> {
  const session = await getSession()
  const _id = toObjectId(id)
  if (!session || !_id) return fail("Forbidden")
  const col = await liveRequests()
  const req = await col.findOne({ _id, status: "pending" })
  if (!req) return fail("This request is no longer pending.")
  const requesterId = req.requestedBy === "student" ? req.studentId : req.teacherId
  if (requesterId !== session.userId) return fail("Forbidden")
  await col.updateOne({ _id }, { $set: { status: "cancelled", respondedAt: new Date() } })
  notifyLiveRequest(req as typeof req & { _id: unknown }, "cancelled")
  revalidatePath("/dashboard/student")
  revalidatePath("/dashboard/teacher")
  return { ok: true }
}

// ============================================================
// TEACHER — EXAM
// ============================================================

const examSchema = z.object({
  slug: z.string().min(1),
  passScore: z.coerce.number().int().min(EXAM_PASS_SCORE, `The pass mark is at least ${EXAM_PASS_SCORE}%`).max(100).default(EXAM_PASS_SCORE),
  questions: z
    .array(
      z.object({
        id: z.string().optional(),
        prompt: z.string().trim().min(5, "Question too short"),
        options: z.array(z.string().trim().min(1, "Empty option")).min(2).max(6),
        answerIndex: z.number().int().min(0),
      }),
    )
    .min(3, "Add at least 3 questions")
    .max(50),
})

export async function saveExamAction(input: unknown): Promise<ActionResult> {
  const parsed = examSchema.safeParse(input)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const d = parsed.data
  if (!(await requireCourseManager(d.slug))) return fail("Forbidden")
  if (d.questions.some((q) => q.answerIndex >= q.options.length)) return fail("Each question needs a correct answer")

  await (await exams()).updateOne(
    { formationSlug: d.slug },
    {
      $set: {
        formationSlug: d.slug,
        passScore: d.passScore,
        source: "teacher",
        updatedAt: new Date(),
        questions: d.questions.map((q) => ({ ...q, id: q.id || randomUUID() })),
      },
    },
    { upsert: true },
  )
  revalidatePath(`/dashboard/teacher/courses/${d.slug}`)
  return { ok: true }
}

// ============================================================
// STUDENT
// ============================================================

export async function completeLessonAction(input: { slug: string; lessonId: string }): Promise<ActionResult<{ progress: number }>> {
  const session = await getSession()
  if (!session || (await courseAccess(session, input.slug)) !== "student") return fail("Forbidden")
  const _id = toObjectId(input.lessonId)
  if (!_id || !(await (await lessons()).findOne({ _id, formationSlug: input.slug }))) return fail("Lesson not found")

  await (await lessonProgress()).updateOne(
    { userId: session.userId, formationSlug: input.slug, lessonId: input.lessonId },
    { $setOnInsert: { completedAt: new Date() } },
    { upsert: true },
  )
  const progress = await recomputeProgress(session.userId, input.slug)
  revalidatePath("/dashboard/student")
  return { ok: true, data: { progress } }
}

export async function submitExamAction(input: { slug: string; answers: Record<string, number> }): Promise<
  ActionResult<{ score: number; passed: boolean; passScore: number }>
> {
  const session = await getSession()
  if (!session || (await courseAccess(session, input.slug)) !== "student") return fail("Forbidden")

  const enrollment = await (await enrollments()).findOne({ userId: session.userId, formationSlug: input.slug })
  if (!enrollment || enrollment.progress < 100) return fail("Complete every lesson before taking the exam.")

  const exam = await getOrCreateExam(input.slug)
  if (!exam) return fail("The exam is not available yet.")

  const correct = exam.questions.filter((q) => input.answers[q.id] === q.answerIndex).length
  const score = Math.round((correct / exam.questions.length) * 100)
  const passScore = effectivePassScore(exam.passScore)
  const passed = score >= passScore

  await (await examAttempts()).insertOne({
    userId: session.userId,
    formationSlug: input.slug,
    score,
    passed,
    createdAt: new Date(),
  })
  revalidatePath("/dashboard/student")
  return { ok: true, data: { score, passed, passScore } }
}

// ============================================================
// ADMIN — AI ACADEMY COURSES
// Only admins add AI courses: they give a name, the AI writes the syllabus.
// ============================================================

const aiCourseSchema = z.object({
  name: z.string().trim().min(2, "Course name too short").max(80),
  kind: z.enum(["language", "programming", "skills"]),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  notes: z.string().trim().max(500).optional(),
})

export async function createAiCourseAction(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const admin = await sessionWithRole("admin")
  if (!admin) return fail("Forbidden")
  if (!isAiConfigured()) return fail("AI is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY.")
  const parsed = aiCourseSchema.safeParse(input)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const d = parsed.data

  let syllabus: Awaited<ReturnType<typeof generateAiSyllabus>>
  try {
    syllabus = await generateAiSyllabus({ ...d, notes: d.notes || undefined })
  } catch (error) {
    console.error(`AI syllabus generation failed: ${String((error as Error)?.message ?? error).slice(0, 200)}`)
    return fail("The AI could not generate this course. Please try again.")
  }

  const base = d.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
  const slug = `${base || "course"}-${randomUUID().slice(0, 4)}`

  const track = {
    slug,
    kind: d.kind,
    level: d.level,
    name: { fr: syllabus.nameFr, en: syllabus.nameEn },
    badge: syllabus.badge.slice(0, 8),
    description: { fr: syllabus.descriptionFr, en: syllabus.descriptionEn },
    modules: syllabus.modules.map((m) => ({ title: { fr: m.titleFr, en: m.titleEn }, focus: m.focus, ...(m.advanced ? { advanced: true } : {}) })),
    custom: true,
  }
  await (await aiTracksCol()).insertOne({ ...track, createdBy: admin.userId, createdAt: new Date() })
  // The cover is drawn in the background so it's ready when learners first see the course.
  after(() => ensureCover(track).then(() => undefined, () => undefined))
  revalidatePath("/academy")
  revalidatePath("/dashboard/admin/academy")
  return { ok: true, data: { slug } }
}

export async function setAiCourseVisibilityAction(input: { slug: string; hidden: boolean }): Promise<ActionResult> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")
  const res = await (await aiTracksCol()).updateOne({ slug: input.slug }, { $set: { hidden: input.hidden } })
  if (!res.matchedCount) return fail("Course not found")
  revalidatePath("/academy")
  revalidatePath("/dashboard/admin/academy")
  return { ok: true }
}

/** Courses someone already paid for can only be hidden, never deleted. */
export async function deleteAiCourseAction(slug: string): Promise<ActionResult> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")
  if (aiTracks.some((t) => t.slug === slug)) return fail("Built-in courses can't be deleted.")
  if (await (await aiModuleAccess()).findOne({ moduleSlug: aiModuleSlug(slug, 1) })) {
    return fail("Learners already bought this course. Hide it instead.")
  }
  await (await aiTracksCol()).deleteOne({ slug })
  await (await exams()).deleteOne({ formationSlug: aiCertKey(slug) })
  await resetCover(slug)
  revalidatePath("/academy")
  revalidatePath("/dashboard/admin/academy")
  return { ok: true }
}

// ============================================================
// STUDENT — AI ACADEMY PROGRESS & CERTIFICATION
// ============================================================

export async function completeAiModuleAction(moduleSlug: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return fail("Forbidden")
  const mod = await findAiModule(moduleSlug)
  if (!mod) return fail("Module not found")
  const purchase = await ownsAiTrack(session.userId, mod.track.slug)
  if (!purchase) return fail("Unlock this course first.")
  // Modules added after the purchase get their row here.
  await (await aiModuleAccess()).updateOne(
    { userId: session.userId, moduleSlug },
    { $setOnInsert: { userId: session.userId, moduleSlug, paymentReference: purchase.paymentReference, createdAt: new Date() }, $set: { completedAt: new Date() } },
    { upsert: true },
  )
  revalidatePath("/academy")
  revalidatePath("/dashboard/student")
  return { ok: true }
}

export async function submitAiExamAction(input: { slug: string; answers: Record<string, number> }): Promise<
  ActionResult<{ score: number; passed: boolean; passScore: number; certificateCode?: string }>
> {
  const session = await getSession()
  if (!session) return fail("Forbidden")
  const track = await findAiTrack(input.slug)
  if (!track) return fail("Course not found")

  const access = await ownsAiTrack(session.userId, track.slug)
  if (!access) return fail("Unlock this course first.")
  if (!trackCompleted(track, (await aiProgressFor(session.userId)).completed)) {
    return fail("Finish every module before taking the final exam.")
  }

  const exam = await getOrCreateAiExam(track)
  if (!exam) return fail("The exam is not available yet.")
  const correct = exam.questions.filter((q) => input.answers[q.id] === q.answerIndex).length
  const score = Math.round((correct / exam.questions.length) * 100)
  const passScore = effectivePassScore(exam.passScore)
  const passed = score >= passScore

  await (await examAttempts()).insertOne({ userId: session.userId, formationSlug: aiCertKey(track.slug), score, passed, createdAt: new Date() })

  let certificateCode: string | undefined
  if (passed) {
    const { cert, created } = await issueAiCertificate(session.userId, track, score, access.paymentReference)
    if (cert && created) notifyCertificate(cert)
    certificateCode = cert?.code
  }
  revalidatePath("/dashboard/student")
  return { ok: true, data: { score, passed, passScore, certificateCode } }
}

/** Admin: replace a course's cover picture with a freshly generated one. */
export async function regenerateAiCoverAction(slug: string): Promise<ActionResult> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")
  if (!isAiConfigured()) return fail("AI is not configured.")
  const track = await findAiTrack(slug)
  if (!track) return fail("Course not found")
  await resetCover(slug)
  const cover = await ensureCover(track).catch(() => null)
  if (!cover) return fail("The picture could not be generated. Please try again.")
  revalidatePath("/academy")
  return { ok: true }
}

/** Admin: decide who earns from a course's sales (needed for older courses that predate the rule). */
export async function setCourseRevenueOwnerAction(input: { slug: string; owner: "platform" | "teacher" }): Promise<ActionResult> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")
  if (input.owner !== "platform" && input.owner !== "teacher") return fail("Invalid owner")
  const col = await formationsCol()
  if (!(await col.findOne({ slug: input.slug }))) {
    const bundled = bundledFormations.find((f) => f.slug === input.slug)
    if (!bundled) return fail("Course not found")
    await col.insertOne({ ...bundled })
  }
  await col.updateOne({ slug: input.slug }, { $set: { revenueOwner: input.owner } })
  revalidatePath("/dashboard/admin/courses")
  return { ok: true }
}

// ============================================================
// STUDENT — COURSE RATINGS (1–5 stars)
// ============================================================

/** Only learners of a course can rate it: enrolled (regular course) or buyer (Linko Academy). */
export async function rateCourseAction(input: { kind: "formation" | "ai"; slug: string; stars: number }): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return fail("Log in to rate this course.")
  const stars = Math.round(Number(input.stars))
  if (!(stars >= 1 && stars <= 5)) return fail("Choose between 1 and 5 stars.")

  const isLearner =
    input.kind === "ai"
      ? Boolean(await ownsAiTrack(session.userId, input.slug))
      : Boolean(await (await enrollments()).findOne({ userId: session.userId, formationSlug: input.slug }))
  if (!isLearner) return fail("Only students of this course can rate it.")

  const now = new Date()
  await (await ratings()).updateOne(
    { key: `${input.kind}:${input.slug}`, userId: session.userId },
    { $set: { stars, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
  revalidatePath("/formations")
  revalidatePath("/academy")
  revalidatePath("/dashboard/student")
  return { ok: true }
}
