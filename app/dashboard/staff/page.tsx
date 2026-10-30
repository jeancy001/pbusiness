import type { Metadata } from "next"
import { StaffDashboard } from "@/components/dashboard/staff-dashboard"
import { getStaffOverview } from "@/lib/admin/team"
import { requireRole } from "@/lib/lms/queries"

export const metadata: Metadata = { title: "Administration adjointe" }

export default async function StaffDashboardPage() {
  const session = await requireRole("staff")
  const { counts, teachers } = await getStaffOverview(session.userId)
  return <StaffDashboard counts={counts} teachers={teachers} />
}
