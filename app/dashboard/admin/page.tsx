import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { isDbConfigured } from "@/lib/db/mongodb"
import { getSession } from "@/lib/auth/session"
import { getAdminDashboard } from "@/lib/data/dashboard"
import { platformRevenue } from "@/lib/payments/payouts"
import { adminAnalytics } from "@/lib/lms/analytics"

export const metadata: Metadata = { title: "Administration" }

export default async function AdminDashboardPage() {
  if (isDbConfigured()) {
    const session = await getSession()
    if (!session) redirect("/login")
    if (session.role !== "admin") redirect(`/dashboard/${session.role}`)
    const [data, revenue, analytics] = await Promise.all([getAdminDashboard(), platformRevenue(), adminAnalytics()])
    return <AdminDashboard data={data} revenue={revenue} analytics={analytics} />
  }
  // Preview mode: render bundled demo data.
  return <AdminDashboard data={null} />
}
