import "server-only"

import { users, type Role } from "@/lib/db/models"
import { byUserId, certificates, teacherApplications, type TeacherApplicationDoc } from "@/lib/db/lms"
import { isPlatformOwner } from "@/lib/auth/owner"
import type { SessionPayload } from "@/lib/auth/session"
import type { LocalizedText } from "@/lib/mock-data"

/** Only the signed-in user's own data; never the password hash. */
export type ProfileView = {
  name: string
  email: string
  role: Role
  locale?: string
  expertise?: string
  bio?: string
  createdAt: string
  isOwner: boolean
  certifiedUntil?: string
  certificates: { code: string; title: LocalizedText; issuedAt: string }[]
  application?: { status: TeacherApplicationDoc["status"]; note?: string; createdAt: string }
}

export async function getProfile(session: SessionPayload): Promise<ProfileView | null> {
  const user = await (await users()).findOne(byUserId(session.userId), {
    projection: { name: 1, email: 1, role: 1, locale: 1, expertise: 1, bio: 1, createdAt: 1, certifiedUntil: 1 },
  })
  if (!user) return null
  const [certs, application] = await Promise.all([
    user.role === "student"
      ? (await certificates()).find({ userId: session.userId }, { projection: { code: 1, formationTitle: 1, issuedAt: 1 } }).sort({ issuedAt: -1 }).toArray()
      : [],
    user.role === "student" ? (await teacherApplications()).findOne({ userId: session.userId }, { sort: { createdAt: -1 } }) : null,
  ])
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    locale: user.locale,
    expertise: user.expertise,
    bio: user.bio,
    createdAt: (user.createdAt ?? new Date()).toISOString(),
    isOwner: isPlatformOwner(session),
    certifiedUntil: user.certifiedUntil && user.certifiedUntil > new Date() ? user.certifiedUntil.toISOString() : undefined,
    certificates: certs.map((c) => ({ code: c.code, title: c.formationTitle, issuedAt: c.issuedAt.toISOString() })),
    application: application
      ? { status: application.status, note: application.note, createdAt: application.createdAt.toISOString() }
      : undefined,
  }
}
