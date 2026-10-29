import type { Metadata } from "next"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { isDbConfigured } from "@/lib/db/mongodb"
import { getStudentDashboard } from "@/lib/data/dashboard"
import { getLiveRequests, getStudentLms, requireRole } from "@/lib/lms/queries"
import { getAllFormations } from "@/lib/data/catalog"
import { getUserTickets } from "@/lib/events/data"
import { myRatings } from "@/lib/lms/ratings"
import { studentLessonsByWeek } from "@/lib/lms/analytics"

export const metadata: Metadata = { title: "Tableau de bord étudiant" }

export default async function StudentDashboardPage() {
  // When the backend is configured, require a real session.
  if (isDbConfigured()) {
    const session = await requireRole("student", "client")
    const [data, catalog, weekly, liveRequests, tickets, rated] = await Promise.all([
      getStudentLms(session.userId),
      getAllFormations(),
      studentLessonsByWeek(session.userId),
      getLiveRequests(session.userId, "student"),
      getUserTickets(session.userId),
      myRatings(session.userId),
    ])
    const enrolled = new Set(data.courses.map((c) => c.formation.slug))
    return <StudentDashboard data={data} available={catalog.filter((f) => !enrolled.has(f.slug))} weekly={weekly} liveRequests={liveRequests} tickets={tickets} myRatings={rated} />
  }

  // Preview mode: render bundled demo data.
  const demo = await getStudentDashboard("demo")
  return (
    <StudentDashboard
      data={{
        courses: demo.map((e) => ({
          formation: e.formation,
          progress: e.progress,
          lessonCount: e.formation.modules.reduce((sum, m) => sum + m.lessons, 0),
          completedLessons: 0,
          examPassed: false,
        })),
        live: [],
        certificates: [],
        aiModules: [],
      }}
      available={(await getAllFormations()).filter((f) => !demo.some((e) => e.formation.slug === f.slug))}
    />
  )
}
