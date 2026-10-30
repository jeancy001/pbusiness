"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { enrollments, formations as formationsCol, users } from "@/lib/db/models"
import {
  aiModuleAccess,
  byUserId,
  exams,
  lessonProgress,
  lessons,
  liveRequests,
  liveSessions,
  teacherReports,
  toObjectId,
  type TeacherReportDoc,
} from "@/lib/db/lms"
import { formations as bundledFormations } from "@/lib/mock-data"
import { removeObject } from "@/lib/storage/supabase"
import { notifyAccountCreated } from "@/lib/email/notify"
import { sessionWithRole } from "@/lib/lms/queries"

export type ActionResult = { ok: true } | { ok: false; error: string }

const fail = (error: string): ActionResult => ({ ok: false, error })

function refreshAdmin() {
  revalidatePath("/dashboard/admin", "layout")
  revalidatePath("/dashboard/staff")
}

// ============================================================
// ASSISTANT ADMINS (main admin only)
// ============================================================

const staffSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court / Name too short"),
  email: z.string().trim().email("Email invalide / Invalid email"),
  password: z.string().min(8, "8 caractères minimum / At least 8 characters"),
})

export async function createStaffAction(input: unknown): Promise<ActionResult> {
  const admin = await sessionWithRole("admin")
  if (!admin) return fail("Forbidden")
  const parsed = staffSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")

  const { name, password } = parsed.data
  const email = parsed.data.email.toLowerCase()
  const col = await users()
  if (await col.findOne({ email })) return fail("Un compte existe déjà avec cet email. / An account with this email already exists.")

  await col.insertOne({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "staff",
    createdBy: admin.userId,
    createdAt: new Date(),
  })
  notifyAccountCreated({ name, email, role: "staff" }, password)
  refreshAdmin()
  return { ok: true }
}

/** Removes an assistant admin. Teachers they added stay. */
export async function removeStaffAction(id: string): Promise<ActionResult> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")
  const res = await (await users()).deleteOne({ ...byUserId(id), role: "staff" })
  if (!res.deletedCount) return fail("Administrateur adjoint introuvable / Assistant admin not found")
  refreshAdmin()
  return { ok: true }
}

// ============================================================
// SUSPENSIONS & REPORTS (main admin only)
// ============================================================

/** Suspends or reactivates a teacher or assistant admin. Suspending closes their open reports. */
export async function setSuspendedAction(input: { userId: string; suspended: boolean; reason?: string }): Promise<ActionResult> {
  const admin = await sessionWithRole("admin")
  if (!admin) return fail("Forbidden")
  const col = await users()
  const user = await col.findOne(byUserId(input.userId))
  if (!user || (user.role !== "teacher" && user.role !== "staff")) return fail("Seuls les formateurs et administrateurs adjoints peuvent être suspendus.")

  await col.updateOne(
    byUserId(input.userId),
    input.suspended
      ? { $set: { suspended: { at: new Date(), by: admin.userId, reason: input.reason?.trim().slice(0, 300) || undefined } } }
      : { $unset: { suspended: "" } },
  )
  // A suspended teacher's courses leave the catalog and can't be bought;
  // students who already enrolled keep their access.
  if (user.role === "teacher") {
    await (await formationsCol()).updateMany(
      { teacherId: input.userId },
      input.suspended ? { $set: { teacherSuspended: true } as never } : { $unset: { teacherSuspended: "" } as never },
    )
    revalidatePath("/formations")
    revalidatePath("/")
  }
  if (input.suspended) {
    await (await teacherReports()).updateMany(
      { teacherId: input.userId, status: "open" },
      { $set: { status: "resolved", resolvedAt: new Date() } },
    )
  }
  refreshAdmin()
  return { ok: true }
}

export async function dismissReportAction(id: string): Promise<ActionResult> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")
  const _id = toObjectId(id)
  if (!_id) return fail("Invalid report")
  await (await teacherReports()).updateOne({ _id, status: "open" }, { $set: { status: "dismissed", resolvedAt: new Date() } })
  refreshAdmin()
  return { ok: true }
}

const reportSchema = z.object({
  slug: z.string().min(1),
  reason: z.enum(["behavior", "content", "absent", "fraud", "other"]),
  message: z.string().trim().min(10, "Décrivez le problème (10 caractères minimum). / Describe the problem (at least 10 characters).").max(1500),
})

/** A student enrolled in a course reports its teacher to the main admin. */
export async function reportTeacherAction(input: unknown): Promise<ActionResult> {
  const session = await sessionWithRole("student", "client")
  if (!session) return fail("Connectez-vous pour signaler. / Sign in to report.")
  const parsed = reportSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  const { slug, reason, message } = parsed.data

  const course = await (await formationsCol()).findOne({ slug })
  if (!course?.teacherId) return fail("Ce cours n'a pas de formateur. / This course has no teacher.")
  if (!(await (await enrollments()).findOne({ userId: session.userId, formationSlug: slug }))) {
    return fail("Seuls les étudiants inscrits peuvent signaler. / Only enrolled students can report.")
  }

  const col = await teacherReports()
  const open = await col.findOne({ reporterId: session.userId, teacherId: course.teacherId, status: "open" })
  if (open) return fail("Votre signalement est déjà en cours d'examen. / Your report is already being reviewed.")

  const doc: TeacherReportDoc = {
    teacherId: course.teacherId,
    reporterId: session.userId,
    reporterName: session.name,
    formationSlug: slug,
    reason,
    message,
    status: "open",
    createdAt: new Date(),
  }
  await col.insertOne(doc)
  refreshAdmin()
  return { ok: true }
}

// ============================================================
// DELETIONS (main admin only)
// ============================================================

/**
 * Deletes a student or client account and their learning data. Payments
 * and certificates are kept: they are accounting and public records.
 */
export async function deleteUserAction(id: string): Promise<ActionResult> {
  const admin = await sessionWithRole("admin")
  if (!admin) return fail("Forbidden")
  const col = await users()
  const user = await col.findOne(byUserId(id))
  if (!user) return fail("Utilisateur introuvable / User not found")
  if (user.role !== "student" && user.role !== "client") {
    return fail("Seuls les comptes étudiants et clients peuvent être supprimés ici. / Only student and client accounts can be deleted here.")
  }

  await Promise.all([
    (await enrollments()).deleteMany({ userId: id }),
    (await lessonProgress()).deleteMany({ userId: id }),
    (await aiModuleAccess()).deleteMany({ userId: id }),
    (await liveRequests()).deleteMany({ studentId: id, status: "pending" }),
  ])
  await col.deleteOne(byUserId(id))
  refreshAdmin()
  return { ok: true }
}

/**
 * Deletes a course: it leaves the catalog for good (a tombstone is kept so a
 * bundled course doesn't come back and past payments still resolve), and its
 * lessons, uploaded files, progress, exam and enrollments are removed.
 */
export async function deleteCourseAction(slug: string): Promise<ActionResult> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")
  const col = await formationsCol()
  const stored = await col.findOne({ slug })
  if (!stored) {
    const bundled = bundledFormations.find((f) => f.slug === slug)
    if (!bundled) return fail("Cours introuvable / Course not found")
    await col.insertOne({ ...bundled })
  }

  const lessonDocs = await (await lessons()).find({ formationSlug: slug }, { projection: { storagePath: 1 } }).toArray()
  await Promise.all(lessonDocs.filter((l) => l.storagePath).map((l) => removeObject(l.storagePath!).catch(() => undefined)))

  await Promise.all([
    (await lessons()).deleteMany({ formationSlug: slug }),
    (await lessonProgress()).deleteMany({ formationSlug: slug }),
    (await exams()).deleteMany({ formationSlug: slug }),
    (await enrollments()).deleteMany({ formationSlug: slug }),
    (await liveSessions()).updateMany({ formationSlug: slug, status: { $ne: "ended" } }, { $set: { status: "ended" } }),
    (await liveRequests()).updateMany({ formationSlug: slug, status: "pending" }, { $set: { status: "cancelled" } }),
  ])
  await col.updateOne({ slug }, { $set: { deleted: true, hidden: true, deletedAt: new Date() } as never })

  refreshAdmin()
  revalidatePath("/formations")
  return { ok: true }
}
