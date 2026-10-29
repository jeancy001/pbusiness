import type { Metadata } from "next"
import { AdminTeachers } from "@/components/dashboard/admin-teachers"
import { getAdminTeachers, requireRole } from "@/lib/lms/queries"

export const metadata: Metadata = { title: "Formateurs" }

export default async function AdminTeachersPage() {
  await requireRole("admin")
  const { teachers, formations } = await getAdminTeachers()
  return <AdminTeachers teachers={teachers} formations={formations} />
}
