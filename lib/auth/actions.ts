"use server"

import bcrypt from "bcryptjs"
import { z } from "zod"
import { isDbConfigured } from "@/lib/db/mongodb"
import { users, type Role } from "@/lib/db/models"
import { createSession, destroySession, getSession } from "./session"

const registerSchema = z.object({
  name: z.string().min(2, "Name too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["student", "client"]).default("student"),
})

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
})

export type AuthResult = { ok: true; role: Role } | { ok: false; error: string }

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
  const { name, email, password, role } = parsed.data

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
      createdAt: new Date(),
    })
    await createSession({ userId: String(res.insertedId), role, name, email: email.toLowerCase() })
    return { ok: true, role }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
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
    return { ok: false, error: (err as Error).message }
  }
}

export async function logoutAction() {
  await destroySession()
}

export async function getCurrentUser() {
  return getSession()
}
