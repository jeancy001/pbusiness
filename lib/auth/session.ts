import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { ObjectId } from "mongodb"
import { isDbConfigured } from "@/lib/db/mongodb"
import { users, type Role } from "@/lib/db/models"

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
  /** false while the sign-up email hasn't been verified yet. */
  emailVerified?: boolean
}

export async function createSession(payload: SessionPayload) {
  const { userId, role, name, email } = payload
  const token = await new SignJWT({ userId, role, name, email })
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

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  if (!secretString) return null
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  let session: SessionPayload
  let issuedAt = 0
  try {
    const { payload } = await jwtVerify(token, getSecret())
    issuedAt = (payload.iat ?? 0) * 1000
    session = {
      userId: payload.userId as string,
      role: payload.role as Role,
      name: payload.name as string,
      email: payload.email as string,
    }
  } catch {
    return null
  }
  return checkAccount(session, issuedAt)
})

/**
 * The cookie lives 7 days, so the account is re-read on every request: a
 * deleted or suspended account loses access at once, a password change
 * signs out every other device, and a role or name change applies without
 * signing out. If the database is briefly unreachable the signed cookie is
 * trusted rather than locking everyone out.
 */
async function checkAccount(session: SessionPayload, issuedAt: number): Promise<SessionPayload | null> {
  if (!isDbConfigured() || !ObjectId.isValid(session.userId)) return session
  try {
    const user = await (await users()).findOne(
      { _id: new ObjectId(session.userId) } as never,
      { projection: { role: 1, suspended: 1, name: 1, email: 1, emailVerified: 1, passwordChangedAt: 1 } },
    )
    if (!user || user.suspended) return null
    if (user.passwordChangedAt && issuedAt < user.passwordChangedAt.getTime() - 2000) return null
    return { ...session, role: user.role, name: user.name, email: user.email, emailVerified: user.emailVerified !== false }
  } catch {
    return session
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
