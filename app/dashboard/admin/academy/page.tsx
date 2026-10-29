import type { Metadata } from "next"
import { AdminAiCourses } from "@/components/dashboard/admin-ai-courses"
import { listAiTracks } from "@/lib/lms/ai-tracks"
import { requireRole } from "@/lib/lms/queries"

export const metadata: Metadata = { title: "Linko Academy" }

export default async function AdminAcademyPage() {
  await requireRole("admin")
  return <AdminAiCourses tracks={await listAiTracks({ includeHidden: true })} />
}
