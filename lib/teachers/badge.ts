import "server-only"

import { ObjectId } from "mongodb"
import { isDbConfigured } from "@/lib/db/mongodb"
import { users } from "@/lib/db/models"
import { byUserId } from "@/lib/db/lms"
import { TEACHER_BADGE_DAYS } from "@/lib/payments/fees"

// Certified Teacher badge: a teacher pays for 30 days at a time (mobile money
// can't be charged automatically, so each payment extends the badge). While
// it's active, their courses show a blue check, are listed first and are
// featured on the homepage and by the AI assistant.

/** Which of these teachers currently hold the badge. */
export async function certifiedTeacherIds(ids: string[]): Promise<Set<string>> {
  const valid = [...new Set(ids)].filter((id) => ObjectId.isValid(id))
  if (!valid.length || !isDbConfigured()) return new Set()
  const docs = await (await users())
    .find({ _id: { $in: valid.map((id) => new ObjectId(id)) }, certifiedUntil: { $gt: new Date() } } as never, { projection: { _id: 1 } })
    .toArray()
  return new Set(docs.map((d) => String(d._id)))
}

/** Adds 30 days, counted from today or from the current end date if still active. */
export async function extendBadge(userId: string) {
  const col = await users()
  const user = await col.findOne(byUserId(userId), { projection: { certifiedUntil: 1, role: 1 } })
  if (!user || user.role !== "teacher") return null
  const from = user.certifiedUntil && user.certifiedUntil > new Date() ? user.certifiedUntil : new Date()
  const until = new Date(from.getTime() + TEACHER_BADGE_DAYS * 86_400_000)
  await col.updateOne(byUserId(userId), { $set: { certifiedUntil: until } })
  return until
}

export async function badgeUntil(userId: string): Promise<string | null> {
  if (!isDbConfigured()) return null
  const user = await (await users()).findOne(byUserId(userId), { projection: { certifiedUntil: 1 } })
  return user?.certifiedUntil?.toISOString() ?? null
}
