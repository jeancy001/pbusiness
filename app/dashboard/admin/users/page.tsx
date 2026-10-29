import type { Metadata } from "next"
import { AdminUsers } from "@/components/dashboard/admin-users"
import { getAllFormations } from "@/lib/data/catalog"
import { getAdminUsers } from "@/lib/lms/admin"
import { requireRole } from "@/lib/lms/queries"

export const metadata: Metadata = { title: "Utilisateurs" }

export default async function AdminUsersPage() {
  await requireRole("admin")
  const [users, courses] = await Promise.all([getAdminUsers(), getAllFormations()])
  return <AdminUsers users={users} courses={courses} />
}
