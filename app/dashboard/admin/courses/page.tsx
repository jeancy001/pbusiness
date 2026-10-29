import type { Metadata } from "next"
import { AdminCourses } from "@/components/dashboard/admin-courses"
import { getAdminCourses } from "@/lib/lms/admin"
import { requireRole } from "@/lib/lms/queries"

export const metadata: Metadata = { title: "Cours" }

export default async function AdminCoursesPage() {
  await requireRole("admin")
  return <AdminCourses {...await getAdminCourses()} />
}
