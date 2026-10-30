import type { Metadata } from "next"
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard"
import { isDbConfigured } from "@/lib/db/mongodb"
import { getLiveRequests, getTeacherDashboard, requireRole } from "@/lib/lms/queries"
import { teacherEarningsByMonth } from "@/lib/lms/analytics"
import { badgeUntil } from "@/lib/teachers/badge"

export const metadata: Metadata = { title: "Espace formateur" }

export default async function TeacherDashboardPage() {
  if (!isDbConfigured()) return <TeacherDashboard data={{ courses: [], students: [], live: [] }} />
  const session = await requireRole("teacher")
  const [data, earnings, liveRequests, until] = await Promise.all([
    getTeacherDashboard(session.userId),
    teacherEarningsByMonth(session.userId),
    getLiveRequests(session.userId, "teacher"),
    badgeUntil(session.userId),
  ])
  // Days are computed here so server and browser render the same number.
  const daysLeft = until ? Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 86_400_000)) : 0
  return <TeacherDashboard data={data} earnings={earnings} liveRequests={liveRequests} badge={{ until, daysLeft }} />
}
