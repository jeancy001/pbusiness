import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { isDbConfigured } from "@/lib/db/mongodb"
import { getSession } from "@/lib/auth/session"
import { getStudentDashboard } from "@/lib/data/dashboard"

export const metadata: Metadata = { title: "Tableau de bord étudiant" }

export default async function StudentDashboardPage() {
  // When the backend is configured, require a real session.
  if (isDbConfigured()) {
    const session = await getSession()
    if (!session) redirect("/login")
    const enrolled = await getStudentDashboard(session.userId)
    return <StudentDashboard enrolled={enrolled} />
  }
  // Preview mode: render bundled demo data.
  const enrolled = await getStudentDashboard("demo")
  return <StudentDashboard enrolled={enrolled} />
}
