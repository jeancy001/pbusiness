import "server-only"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import type { Role } from "@/lib/db/models"

const COOKIE_NAME = "pb_session"
const secretString = process.env.SESSION_SECRET

function getSecret() {
  if (!secretString) {
    throw new Error("SESSION_SECRET is not set. Add it in Project Settings → Vars.")
  }
  return new TextEncoder().encode(secretString)
}

export interface SessionPayload {
  userId: string
  role: Role
  name: string
  email: string
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  if (!secretString) return null
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      userId: payload.userId as string,
      role: payload.role as Role,
      name: payload.name as string,
      email: payload.email as string,
    }
  } catch {
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
