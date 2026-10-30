import "server-only"

import { isDbConfigured } from "@/lib/db/mongodb"
import { enrollments, formations as formationsCol, payments, users, type Role } from "@/lib/db/models"
import { payouts, teacherApplications, teacherReports, type TeacherApplicationDoc, type TeacherReportDoc } from "@/lib/db/lms"
import type { LocalizedText } from "@/lib/mock-data"

// Two levels of administration:
//   admin (main)   everything, including money, deletions and suspensions
//   staff          adds teachers and sees how many users there are — no
//                  wallets, revenue or payments ever reach this role

const cents = (n: number) => Math.round(n * 100) / 100

export type RoleCounts = Record<Role, number> & { total: number }

async function roleCounts(): Promise<RoleCounts> {
  const rows = await (await users()).aggregate<{ _id: Role; n: number }>([{ $group: { _id: "$role", n: { $sum: 1 } } }]).toArray()
  const counts = { student: 0, client: 0, teacher: 0, admin: 0, staff: 0, total: 0 } as RoleCounts
  for (const r of rows) {
    if (r._id in counts) counts[r._id] = r.n
    counts.total += r.n
  }
  return counts
}

/** Course slugs per teacher and enrollments per course. */
async function teachingStats() {
  const [courses, counts] = await Promise.all([
    (await formationsCol())
      .find({ teacherId: { $exists: true }, deleted: { $ne: true } } as never, { projection: { slug: 1, teacherId: 1 } })
      .toArray(),
    (await enrollments()).aggregate<{ _id: string; n: number }>([{ $group: { _id: "$formationSlug", n: { $sum: 1 } } }]).toArray(),
  ])
  const students = new Map(counts.map((c) => [c._id, c.n]))
  const byTeacher = new Map<string, { courses: number; students: number }>()
  for (const c of courses) {
    const s = byTeacher.get(c.teacherId!) ?? { courses: 0, students: 0 }
    s.courses += 1
    s.students += students.get(c.slug) ?? 0
    byTeacher.set(c.teacherId!, s)
  }
  return byTeacher
}

// ============================================================
// ASSISTANT ADMIN (staff)
// ============================================================

export type StaffTeacherView = {
  id: string
  name: string
  email: string
  expertise?: string
  createdAt: string
  courses: number
  students: number
  addedByMe: boolean
  suspended: boolean
}

export async function getStaffOverview(staffId: string): Promise<{ counts: RoleCounts; teachers: StaffTeacherView[] }> {
  if (!isDbConfigured()) return { counts: { student: 0, client: 0, teacher: 0, admin: 0, staff: 0, total: 0 }, teachers: [] }
  const [counts, teacherDocs, stats] = await Promise.all([
    roleCounts(),
    (await users()).find({ role: "teacher" }, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).limit(300).toArray(),
    teachingStats(),
  ])
  return {
    counts,
    teachers: teacherDocs.map((t) => ({
      id: String(t._id),
      name: t.name,
      email: t.email,
      expertise: t.expertise,
      createdAt: t.createdAt.toISOString(),
      courses: stats.get(String(t._id))?.courses ?? 0,
      students: stats.get(String(t._id))?.students ?? 0,
      addedByMe: t.createdBy === staffId,
      suspended: Boolean(t.suspended),
    })),
  }
}

// ============================================================
// MAIN ADMIN
// ============================================================

export type TeamAdminView = {
  id: string
  name: string
  email: string
  role: "admin" | "staff"
  createdAt: string
  teachersAdded: number
  suspended: boolean
}

export type TeamTeacherView = StaffTeacherView & {
  addedBy?: string
  salesCount: number
  grossUsd: number
  teacherEarnedUsd: number
  platformUsd: number
  paidOutUsd: number
  balanceUsd: number
  openReports: number
  suspendedReason?: string
  /** Certified Teacher badge end date, when active. */
  certifiedUntil?: string
}

export type ReportView = {
  id: string
  teacherId: string
  teacherName: string
  teacherSuspended: boolean
  reporterName: string
  courseTitle?: LocalizedText
  reason: TeacherReportDoc["reason"]
  message: string
  status: TeacherReportDoc["status"]
  createdAt: string
}

export type ApplicationView = {
  id: string
  name: string
  email: string
  expertise: string
  motivation: string
  experience?: string
  certificates: number
  status: TeacherApplicationDoc["status"]
  createdAt: string
}

export type TeamOverview = {
  counts: RoleCounts
  admins: TeamAdminView[]
  teachers: TeamTeacherView[]
  reports: ReportView[]
  applications: ApplicationView[]
}

export async function getTeamOverview(): Promise<TeamOverview> {
  if (!isDbConfigured()) {
    return { counts: { student: 0, client: 0, teacher: 0, admin: 0, staff: 0, total: 0 }, admins: [], teachers: [], reports: [], applications: [] }
  }
  const [counts, people, stats, sales, paid, reports, apps] = await Promise.all([
    roleCounts(),
    (await users())
      .find({ role: { $in: ["admin", "staff", "teacher"] } }, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray(),
    teachingStats(),
    (await payments())
      .aggregate<{ _id: string; gross: number; share: number; n: number }>([
        { $match: { status: "success", teacherId: { $exists: true, $ne: null } } },
        { $group: { _id: "$teacherId", gross: { $sum: "$amountUsd" }, share: { $sum: { $ifNull: ["$teacherShareUsd", 0] } }, n: { $sum: 1 } } },
      ])
      .toArray(),
    (await payouts())
      .aggregate<{ _id: string; total: number; reserved: number }>([
        { $match: { kind: { $ne: "platform" }, status: { $in: ["requested", "approved", "processing", "paid"] } } },
        {
          $group: {
            _id: "$teacherId",
            total: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amountUsd", 0] } },
            reserved: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 0, "$amountUsd"] } },
          },
        },
      ])
      .toArray(),
    (await teacherReports()).find({}).sort({ status: -1, createdAt: -1 }).limit(100).toArray(),
    (await teacherApplications()).find({}).sort({ status: 1, createdAt: -1 }).limit(50).toArray(),
  ])

  const names = new Map(people.map((p) => [String(p._id), p.name]))
  const salesBy = new Map(sales.map((s) => [s._id, s]))
  const paidBy = new Map(paid.map((p) => [p._id, p]))
  const openBy = new Map<string, number>()
  for (const r of reports) if (r.status === "open") openBy.set(r.teacherId, (openBy.get(r.teacherId) ?? 0) + 1)

  const teacherDocs = people.filter((p) => p.role === "teacher")
  const teachers = teacherDocs.map((t): TeamTeacherView => {
    const id = String(t._id)
    const s = salesBy.get(id)
    const p = paidBy.get(id)
    const earned = s?.share ?? 0
    return {
      id,
      name: t.name,
      email: t.email,
      expertise: t.expertise,
      createdAt: t.createdAt.toISOString(),
      courses: stats.get(id)?.courses ?? 0,
      students: stats.get(id)?.students ?? 0,
      addedByMe: false,
      addedBy: t.createdBy ? names.get(t.createdBy) : undefined,
      suspended: Boolean(t.suspended),
      suspendedReason: t.suspended?.reason,
      salesCount: s?.n ?? 0,
      grossUsd: cents(s?.gross ?? 0),
      teacherEarnedUsd: cents(earned),
      platformUsd: cents((s?.gross ?? 0) - earned),
      paidOutUsd: cents(p?.total ?? 0),
      balanceUsd: cents(earned - (p?.total ?? 0) - (p?.reserved ?? 0)),
      openReports: openBy.get(id) ?? 0,
      certifiedUntil: t.certifiedUntil && t.certifiedUntil > new Date() ? t.certifiedUntil.toISOString() : undefined,
    }
  })

  const admins = people
    .filter((p): p is typeof p & { role: "admin" | "staff" } => p.role === "admin" || p.role === "staff")
    .map((a) => ({
      id: String(a._id),
      name: a.name,
      email: a.email,
      role: a.role,
      createdAt: a.createdAt.toISOString(),
      teachersAdded: teacherDocs.filter((t) => t.createdBy === String(a._id)).length,
      suspended: Boolean(a.suspended),
    }))

  const slugs = [...new Set(reports.map((r) => r.formationSlug).filter(Boolean))] as string[]
  const courseDocs = slugs.length ? await (await formationsCol()).find({ slug: { $in: slugs } }, { projection: { slug: 1, title: 1 } }).toArray() : []
  const titles = new Map(courseDocs.map((c) => [c.slug, c.title]))
  const suspended = new Set(teacherDocs.filter((t) => t.suspended).map((t) => String(t._id)))

  return {
    counts,
    admins,
    teachers,
    applications: apps
      .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"))
      .map((a) => ({
        id: String(a._id),
        name: a.name,
        email: a.email,
        expertise: a.expertise,
        motivation: a.motivation,
        experience: a.experience,
        certificates: a.certificateCodes.length,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
      })),
    reports: reports.map((r) => ({
      id: String(r._id),
      teacherId: r.teacherId,
      teacherName: names.get(r.teacherId) ?? "—",
      teacherSuspended: suspended.has(r.teacherId),
      reporterName: r.reporterName,
      courseTitle: r.formationSlug ? titles.get(r.formationSlug) : undefined,
      reason: r.reason,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  }
}
