import type { Metadata } from "next"
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard"
import { isDbConfigured } from "@/lib/db/mongodb"
import { getLiveRequests, getTeacherDashboard, requireRole } from "@/lib/lms/queries"
import { teacherEarningsByMonth } from "@/lib/lms/analytics"

export const metadata: Metadata = { title: "Espace formateur" }

export default async function TeacherDashboardPage() {
  if (!isDbConfigured()) return <TeacherDashboard data={{ courses: [], students: [], live: [] }} />
  const session = await requireRole("teacher")
  const [data, earnings, liveRequests] = await Promise.all([
    getTeacherDashboard(session.userId),
    teacherEarningsByMonth(session.userId),
    getLiveRequests(session.userId, "teacher"),
  ])
  return <TeacherDashboard data={data} earnings={earnings} liveRequests={liveRequests} />
}
