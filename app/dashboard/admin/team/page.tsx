import type { Metadata } from "next"
import { AdminTeam } from "@/components/dashboard/admin-team"
import { getTeamOverview } from "@/lib/admin/team"
import { requireRole } from "@/lib/lms/queries"

export const metadata: Metadata = { title: "Équipe" }

export default async function AdminTeamPage() {
  await requireRole("admin")
  return <AdminTeam data={await getTeamOverview()} />
}
