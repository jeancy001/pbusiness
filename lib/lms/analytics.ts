import "server-only"

import { isDbConfigured } from "@/lib/db/mongodb"
import { enrollments, payments } from "@/lib/db/models"
import { lessonProgress } from "@/lib/db/lms"
import { getCatalogForAdmin } from "@/lib/data/catalog"
import type { LocalizedText } from "@/lib/mock-data"

// Time-series data for dashboard charts. Buckets are returned as ISO keys
// ("2026-10" for months, "2026-10-26" for week starts) and formatted on the
// client in the viewer's language. Empty buckets are filled with zeros.

const cents = (n: number) => Math.round(n * 100) / 100

function lastMonths(n: number) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1 - i), 1))
    return d.toISOString().slice(0, 7)
  })
}

function weekStart(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)) // Monday
  return x
}

function lastWeeks(n: number) {
  const start = weekStart(new Date())
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() - 7 * (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

export type RevenueMonth = { month: string; course: number; certificate: number; academy: number; other: number }

export type AdminAnalytics = {
  revenue: RevenueMonth[]
  enrollments: { month: string; count: number }[]
  topCourses: { title: LocalizedText; students: number }[]
}

export async function adminAnalytics(): Promise<AdminAnalytics> {
  const months = lastMonths(12)
  if (!isDbConfigured()) {
    return { revenue: months.map((month) => ({ month, course: 0, certificate: 0, academy: 0, other: 0 })), enrollments: months.map((month) => ({ month, count: 0 })), topCourses: [] }
  }
  const since = new Date(`${months[0]}-01T00:00:00Z`)
  const [pay, enr, perCourse, catalog] = await Promise.all([
    (await payments())
      .aggregate<{ _id: { m: string; k: string }; total: number }>([
        { $match: { status: "success", createdAt: { $gte: since } } },
        { $group: { _id: { m: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, k: "$kind" }, total: { $sum: "$amountUsd" } } },
      ])
      .toArray(),
    (await enrollments())
      .aggregate<{ _id: string; n: number }>([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, n: { $sum: 1 } } },
      ])
      .toArray(),
    (await enrollments()).aggregate<{ _id: string; n: number }>([{ $group: { _id: "$formationSlug", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }]).toArray(),
    getCatalogForAdmin(),
  ])

  const bucket = (kind: string) => (kind === "formation" ? "course" : kind === "certificate" ? "certificate" : kind === "ai_module" ? "academy" : "other")
  const revenue = months.map((month) => {
    const row: RevenueMonth = { month, course: 0, certificate: 0, academy: 0, other: 0 }
    for (const p of pay.filter((p) => p._id.m === month)) row[bucket(p._id.k) as keyof Omit<RevenueMonth, "month">] += p.total
    return { ...row, course: cents(row.course), certificate: cents(row.certificate), academy: cents(row.academy), other: cents(row.other) }
  })

  return {
    revenue,
    enrollments: months.map((month) => ({ month, count: enr.find((e) => e._id === month)?.n ?? 0 })),
    topCourses: perCourse
      .map((c) => ({ title: catalog.find((f) => f.slug === c._id)?.title, students: c.n }))
      .filter((c): c is { title: LocalizedText; students: number } => Boolean(c.title)),
  }
}

export async function teacherEarningsByMonth(teacherId: string) {
  const months = lastMonths(12)
  if (!isDbConfigured()) return months.map((month) => ({ month, usd: 0 }))
  const rows = await (await payments())
    .aggregate<{ _id: string; total: number }>([
      { $match: { teacherId, status: "success", createdAt: { $gte: new Date(`${months[0]}-01T00:00:00Z`) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: "$teacherShareUsd" } } },
    ])
    .toArray()
  return months.map((month) => ({ month, usd: cents(rows.find((r) => r._id === month)?.total ?? 0) }))
}

export async function studentLessonsByWeek(userId: string) {
  const weeks = lastWeeks(8)
  if (!isDbConfigured()) return weeks.map((week) => ({ week, count: 0 }))
  const rows = await (await lessonProgress())
    .find({ userId, completedAt: { $gte: new Date(`${weeks[0]}T00:00:00Z`) } }, { projection: { completedAt: 1 } })
    .toArray()
  return weeks.map((week) => ({
    week,
    count: rows.filter((r) => weekStart(r.completedAt).toISOString().slice(0, 10) === week).length,
  }))
}
