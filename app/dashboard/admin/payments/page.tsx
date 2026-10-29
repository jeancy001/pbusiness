import type { Metadata } from "next"
import { AdminPayments } from "@/components/dashboard/admin-payments"
import { requireRole } from "@/lib/lms/queries"
import { getAdminPayments } from "@/lib/payments/payouts"

export const metadata: Metadata = { title: "Paiements & retraits" }

export default async function AdminPaymentsPage() {
  await requireRole("admin")
  return <AdminPayments {...await getAdminPayments()} />
}
