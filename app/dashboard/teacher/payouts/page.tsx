import type { Metadata } from "next"
import { TeacherPayouts } from "@/components/dashboard/teacher-payouts"
import { requireRole } from "@/lib/lms/queries"
import { getTeacherPayouts } from "@/lib/payments/payouts"

export const metadata: Metadata = { title: "Revenus & retraits" }

export default async function TeacherPayoutsPage() {
  const session = await requireRole("teacher")
  return <TeacherPayouts {...await getTeacherPayouts(session.userId)} />
}
