import "server-only"

import { isDbConfigured } from "@/lib/db/mongodb"
import { enrollments, users, type Role } from "@/lib/db/models"
import { getCatalogForAdmin, type CatalogFormation } from "@/lib/data/catalog"
import { courseEarner } from "@/lib/payments/revenue-owner"

export type AdminUserView = {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  enrollments: number
}

export async function getAdminUsers(): Promise<AdminUserView[]> {
  if (!isDbConfigured()) return []
  const [docs, counts] = await Promise.all([
    (await users()).find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).limit(500).toArray(),
    (await enrollments()).aggregate<{ _id: string; n: number }>([{ $group: { _id: "$userId", n: { $sum: 1 } } }]).toArray(),
  ])
  const byUser = new Map(counts.map((c) => [c._id, c.n]))
  return docs.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: (u.createdAt ?? new Date()).toISOString(),
    enrollments: byUser.get(String(u._id)) ?? 0,
  }))
}

/** `teacherEarns`: sales pay the assigned teacher 90% (otherwise 100% platform). */
export type AdminCourseView = CatalogFormation & { studentCount: number; teacherEarns: boolean }

export async function getAdminCourses(): Promise<{ courses: AdminCourseView[]; teachers: { id: string; name: string }[] }> {
  const courses = await getCatalogForAdmin()
  if (!isDbConfigured()) return { courses: courses.map((c) => ({ ...c, studentCount: 0, teacherEarns: Boolean(courseEarner(c)) })), teachers: [] }
  const [counts, teacherDocs] = await Promise.all([
    (await enrollments()).aggregate<{ _id: string; n: number }>([{ $group: { _id: "$formationSlug", n: { $sum: 1 } } }]).toArray(),
    (await users()).find({ role: "teacher" }, { projection: { name: 1 } }).toArray(),
  ])
  const bySlug = new Map(counts.map((c) => [c._id, c.n]))
  return {
    courses: courses.map((c) => ({ ...c, translatedAt: undefined, studentCount: bySlug.get(c.slug) ?? 0, teacherEarns: Boolean(courseEarner(c)) })),
    teachers: teacherDocs.map((t) => ({ id: String(t._id), name: t.name })),
  }
}
