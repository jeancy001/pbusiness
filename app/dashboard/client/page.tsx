import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ClientDashboard } from "@/components/dashboard/client-dashboard"
import { isDbConfigured } from "@/lib/db/mongodb"
import { getSession } from "@/lib/auth/session"
import { getClientDashboard } from "@/lib/data/dashboard"

export const metadata: Metadata = { title: "Tableau de bord client" }

export default async function ClientDashboardPage() {
  if (isDbConfigured()) {
    const session = await getSession()
    if (!session) redirect("/login")
    const { projects, payments } = await getClientDashboard(session.userId)
    return <ClientDashboard projects={projects} payments={payments} />
  }
  const { projects, payments } = await getClientDashboard("demo")
  return <ClientDashboard projects={projects} payments={payments} />
}
