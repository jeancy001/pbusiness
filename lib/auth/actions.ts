"use server"

import bcrypt from "bcryptjs"
import { z } from "zod"
import { isDbConfigured } from "@/lib/db/mongodb"
import { users, type Role } from "@/lib/db/models"
import { createSession, destroySession, getSession } from "./session"
import { notifyWelcome } from "@/lib/email/notify"

const registerSchema = z.object({
  name: z.string().min(2, "Name too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["student", "client"]).default("student"),
  locale: z.enum(["fr", "en", "tw", "gaa", "ee"]).optional(),
})

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
})

export type AuthResult = { ok: true; role: Role } | { ok: false; error: string }

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
  const { name, email, password, role, locale } = parsed.data

  try {
    const col = await users()
    const existing = await col.findOne({ email: email.toLowerCase() })
    if (existing) return { ok: false, error: "An account with this email already exists." }

    const passwordHash = await bcrypt.hash(password, 10)
    const res = await col.insertOne({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      locale,
      createdAt: new Date(),
    })
    await createSession({ userId: String(res.insertedId), role, name, email: email.toLowerCase() })
    notifyWelcome({ name, email: email.toLowerCase(), role, locale })
    return { ok: true, role }
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

    await createSession({
      userId: String(user._id),
      role: user.role,
      name: user.name,
      email: user.email,
    })
    return { ok: true, role: user.role }
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
