"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { users } from "@/lib/db/models"
import { byUserId, certificates, teacherApplications, toObjectId } from "@/lib/db/lms"
import { checkCode, issueCode } from "@/lib/auth/codes"
import { createSession, getSession } from "@/lib/auth/session"
import { sessionWithRole } from "@/lib/lms/queries"
import { notifyTeacherApplication, notifyTeacherApplicationResult } from "@/lib/email/notify"

export type Result = { ok: true } | { ok: false; error: string }

const fail = (error: string): Result => ({ ok: false, error })
const signIn = "Connectez-vous d'abord. / Sign in first."

// ============================================================
// PROFILE
// ============================================================

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court / Name too short").max(80),
  locale: z.enum(["fr", "en", "tw", "gaa", "ee"]).optional(),
  expertise: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(1000).optional(),
})

export async function updateProfileAction(input: unknown): Promise<Result> {
  const session = await getSession()
  if (!session) return fail(signIn)
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0].message)
  const { name, locale, expertise, bio } = parsed.data

  // Expertise and bio are public on teacher profiles only.
  const teacherFields = session.role === "teacher" ? { expertise: expertise || undefined, bio: bio || undefined } : {}
  await (await users()).updateOne(byUserId(session.userId), { $set: { name, ...(locale ? { locale } : {}), ...teacherFields } })
  await createSession({ ...session, name })
  revalidatePath("/dashboard", "layout")
  return { ok: true }
}

// ============================================================
// PASSWORD (6-digit code by email)
// ============================================================

export async function sendPasswordCodeAction(): Promise<Result> {
  const session = await getSession()
  if (!session) return fail(signIn)
  const user = await (await users()).findOne(byUserId(session.userId), { projection: { locale: 1 } })
  return issueCode({ id: session.userId, email: session.email, name: session.name, locale: user?.locale }, "password")
}

const passwordSchema = z
  .object({
    code: z.string().trim().regex(/^\d{3} ?\d{3}$/, "Le code contient 6 chiffres. / The code has 6 digits."),
    password: z.string().min(8, "8 caractères minimum / At least 8 characters").max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Les mots de passe ne correspondent pas. / Passwords don't match." })

export async function changePasswordAction(input: unknown): Promise<Result> {
  const session = await getSession()
  if (!session) return fail(signIn)
  const parsed = passwordSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0].message)
  if (!(await checkCode(session.userId, "password", parsed.data.code))) {
    return fail("Code incorrect ou expiré. Demandez un nouveau code. / Wrong or expired code. Ask for a new one.")
  }
  // Other devices are signed out; this one gets a fresh session.
  await (await users()).updateOne(byUserId(session.userId), {
    $set: { passwordHash: await bcrypt.hash(parsed.data.password, 10), passwordChangedAt: new Date() },
  })
  await createSession(session)
  return { ok: true }
}

// ============================================================
// BECOME A TEACHER (students holding at least one certificate)
// ============================================================

const applicationSchema = z.object({
  expertise: z.string().trim().min(2, "Indiquez votre spécialité. / Enter your expertise.").max(120),
  motivation: z.string().trim().min(40, "Expliquez votre motivation (40 caractères minimum). / Explain your motivation (at least 40 characters).").max(2000),
  experience: z.string().trim().max(2000).optional(),
})

export async function applyTeacherAction(input: unknown): Promise<Result> {
  const session = await sessionWithRole("student")
  if (!session) return fail("Réservé aux étudiants. / Students only.")
  if (session.emailVerified === false) return fail("Vérifiez d'abord votre e-mail. / Verify your email first.")
  const parsed = applicationSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0].message)

  const certs = await (await certificates()).find({ userId: session.userId }, { projection: { code: 1 } }).toArray()
  if (!certs.length) return fail("Obtenez d'abord une certification pour postuler. / Earn a certificate first to apply.")

  const col = await teacherApplications()
  if (await col.findOne({ userId: session.userId, status: "pending" })) return fail("Votre candidature est déjà en cours d'examen. / Your application is already being reviewed.")

  await col.insertOne({
    userId: session.userId,
    name: session.name,
    email: session.email,
    ...parsed.data,
    experience: parsed.data.experience || undefined,
    certificateCodes: certs.map((c) => c.code),
    status: "pending",
    createdAt: new Date(),
  })
  notifyTeacherApplication(session.name)
  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard/admin/team")
  return { ok: true }
}

/** Main admin: approve (the student becomes a teacher at once) or reject an application. */
export async function reviewTeacherApplicationAction(input: { id: string; approve: boolean; note?: string }): Promise<Result> {
  const admin = await sessionWithRole("admin")
  if (!admin) return fail("Forbidden")
  const _id = toObjectId(input.id)
  if (!_id) return fail("Invalid application")

  const app = await (await teacherApplications()).findOneAndUpdate(
    { _id, status: "pending" },
    { $set: { status: input.approve ? "approved" : "rejected", note: input.note?.trim().slice(0, 500) || undefined, reviewedAt: new Date(), reviewedBy: admin.userId } },
    { returnDocument: "after" },
  )
  if (!app) return fail("Cette candidature a déjà été traitée. / This application was already reviewed.")

  if (input.approve) {
    const res = await (await users()).updateOne(
      { ...byUserId(app.userId), role: "student" },
      { $set: { role: "teacher", expertise: app.expertise, createdBy: admin.userId } },
    )
    if (!res.matchedCount) return fail("Le compte n'est plus un compte étudiant. / The account is no longer a student account.")
  }
  notifyTeacherApplicationResult(app.userId, input.approve, app.note)
  revalidatePath("/dashboard/admin/team")
  return { ok: true }
}
