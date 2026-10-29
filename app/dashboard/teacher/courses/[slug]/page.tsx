import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { CourseManager } from "@/components/dashboard/course-manager"
import { courseAccess, getTeacherCourse, requireRole } from "@/lib/lms/queries"

export const metadata: Metadata = { title: "Gestion du cours" }

export default async function TeacherCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await requireRole("teacher", "admin")
  const access = await courseAccess(session, slug)
  if (access !== "owner" && access !== "admin") redirect(`/dashboard/${session.role}`)

  const data = await getTeacherCourse(slug)
  if (!data) notFound()
  return <CourseManager data={data} adminView={session.role === "admin"} />
}
