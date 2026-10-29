import type { Metadata } from "next"
import { AdminEvents } from "@/components/dashboard/admin-events"
import { getAdminEvents } from "@/lib/events/data"
import { requireRole } from "@/lib/lms/queries"

export const metadata: Metadata = { title: "Événements" }

export default async function AdminEventsPage() {
  await requireRole("admin")
  return <AdminEvents events={await getAdminEvents()} />
}
