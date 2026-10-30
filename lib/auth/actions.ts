"use server"

import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"
import { z } from "zod"
import { isDbConfigured } from "@/lib/db/mongodb"
import { users, type Role } from "@/lib/db/models"
import { createSession, destroySession, getSession } from "./session"
import { checkCode, issueCode } from "./codes"
import { notifyWelcome } from "@/lib/email/notify"

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court / Name too short").max(80),
  email: z.string().trim().email("Email invalide / Invalid email").max(160),
  password: z.string().min(8, "8 caractères minimum / At least 8 characters").max(128),
  locale: z.enum(["fr", "en", "tw", "gaa", "ee"]).optional(),
})

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
})

/** `verified: false` sends the user to /verify-email before anything else. */
export type AuthResult = { ok: true; role: Role; verified: boolean } | { ok: false; error: string }

// Never surface driver/TLS internals to users; log them for operators instead.
function serviceError(err: unknown): string {
  const name = (err as Error)?.name ?? ""
  // Log plain strings: passing the Error object crashes Next's dev overlay
  // ("expected enum CodeFrameColorMode") and hides the real cause.
  console.error(`Auth backend error: ${name}: ${String((err as Error)?.message ?? err).slice(0, 300)}`)
  if (/Mongo(ServerSelection|Network)Error/.test(name)) {
    return "Service temporarily unavailable. Please try again in a few minutes."
  }
  return "Something went wrong. Please try again."
}

function ensureConfigured(): string | null {
  if (!isDbConfigured()) return "Backend not configured. Add MONGODB_URI in Project Settings → Vars."
  if (!process.env.SESSION_SECRET) return "Backend not configured. Add SESSION_SECRET in Project Settings → Vars."
  return null
}

export async function registerAction(input: unknown): Promise<AuthResult> {
  const configError = ensureConfigured()
  if (configError) return { ok: false, error: configError }

  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  // Everyone signs up as a student; teachers are added by an admin or
  // approved after applying with a certificate.
  const { name, password, locale } = parsed.data
  const email = parsed.data.email.toLowerCase()
  const role = "student" as const

  try {
    const col = await users()
    const existing = await col.findOne({ email }, { projection: { _id: 1 } })
    if (existing) return { ok: false, error: "Un compte existe déjà avec cet e-mail. Connectez-vous ou réinitialisez votre mot de passe. / An account with this email already exists." }

    const passwordHash = await bcrypt.hash(password, 10)
    const res = await col.insertOne({ name, email, passwordHash, role, locale, emailVerified: false, createdAt: new Date() })
    const userId = String(res.insertedId)
    await createSession({ userId, role, name, email })
    await issueCode({ id: userId, email, name, locale }, "verify")
    return { ok: true, role, verified: false }
  } catch (err) {
    return { ok: false, error: serviceError(err) }
  }
}

export async function loginAction(input: unknown): Promise<AuthResult> {
  const configError = ensureConfigured()
  if (configError) return { ok: false, error: configError }

  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const { email, password } = parsed.data

  try {
    const col = await users()
    const user = await col.findOne({ email: email.toLowerCase() })
    if (!user) return { ok: false, error: "Invalid email or password." }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return { ok: false, error: "Invalid email or password." }
    if (user.suspended) {
      return { ok: false, error: "Ce compte est suspendu. Contactez l'administration. / This account is suspended. Contact the administration." }
    }

    await createSession({
      userId: String(user._id),
      role: user.role,
      name: user.name,
      email: user.email,
    })
    return { ok: true, role: user.role, verified: user.emailVerified !== false }
  } catch (err) {
    return { ok: false, error: serviceError(err) }
  }
}

// ============================================================
// EMAIL VERIFICATION
// ============================================================

export type SimpleResult = { ok: true } | { ok: false; error: string }

const codeSchema = z.string().trim().regex(/^\d{3} ?\d{3}$/, "Le code contient 6 chiffres. / The code has 6 digits.")

export async function verifyEmailAction(code: unknown): Promise<SimpleResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Connectez-vous d'abord. / Sign in first." }
  if (session.emailVerified !== false) return { ok: true }
  const parsed = codeSchema.safeParse(code)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  if (!(await checkCode(session.userId, "verify", parsed.data))) {
    return { ok: false, error: "Code incorrect ou expiré. Demandez un nouveau code. / Wrong or expired code. Ask for a new one." }
  }
  const col = await users()
  const user = await col.findOneAndUpdate(
    { _id: new ObjectId(session.userId) } as never,
    { $set: { emailVerified: true } },
    { returnDocument: "after", projection: { name: 1, email: 1, role: 1, locale: 1 } },
  )
  if (user) notifyWelcome({ name: user.name, email: user.email, role: user.role, locale: user.locale })
  return { ok: true }
}

export async function resendVerificationAction(): Promise<SimpleResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Connectez-vous d'abord. / Sign in first." }
  if (session.emailVerified !== false) return { ok: true }
  const user = await (await users()).findOne({ _id: new ObjectId(session.userId) } as never, { projection: { locale: 1 } })
  return issueCode({ id: session.userId, email: session.email, name: session.name, locale: user?.locale }, "verify")
}

// ============================================================
// FORGOTTEN PASSWORD
//
// The answer never reveals whether an account exists for an email.
// ============================================================

export async function requestPasswordResetAction(input: unknown): Promise<SimpleResult> {
  const configError = ensureConfigured()
  if (configError) return { ok: false, error: configError }
  const parsed = z.object({ email: z.string().trim().email("Email invalide / Invalid email") }).safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  try {
    const user = await (await users()).findOne({ email: parsed.data.email.toLowerCase() }, { projection: { name: 1, email: 1, locale: 1, suspended: 1 } })
    if (user && !user.suspended) {
      const res = await issueCode({ id: String(user._id), email: user.email, name: user.name, locale: user.locale }, "reset")
      // Only the wait message is passed on; it's shown whether or not the account exists.
      if (!res.ok && res.retryInSec) return res
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: serviceError(err) }
  }
}

const resetSchema = z.object({
  email: z.string().trim().email("Email invalide / Invalid email"),
  code: codeSchema,
  password: z.string().min(8, "8 caractères minimum / At least 8 characters").max(128),
})

export async function resetPasswordAction(input: unknown): Promise<AuthResult> {
  const configError = ensureConfigured()
  if (configError) return { ok: false, error: configError }
  const parsed = resetSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const invalid = { ok: false as const, error: "Code incorrect ou expiré. / Wrong or expired code." }
  try {
    const col = await users()
    const user = await col.findOne({ email: parsed.data.email.toLowerCase() })
    if (!user || user.suspended) return invalid
    const userId = String(user._id)
    if (!(await checkCode(userId, "reset", parsed.data.code))) return invalid

    // The code proves the address, so it's verified too. Other devices are signed out.
    await col.updateOne(
      { _id: user._id } as never,
      { $set: { passwordHash: await bcrypt.hash(parsed.data.password, 10), passwordChangedAt: new Date(), emailVerified: true } },
    )
    await createSession({ userId, role: user.role, name: user.name, email: user.email })
    return { ok: true, role: user.role, verified: true }
  } catch (err) {
    return { ok: false, error: serviceError(err) }
  }
}

export async function logoutAction() {
  await destroySession()
}

export async function getCurrentUser() {
  return getSession()
}
