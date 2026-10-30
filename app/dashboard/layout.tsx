import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"

// New accounts verify their email (6-digit code) before using any dashboard.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (session?.emailVerified === false) redirect("/verify-email")
  return children
}
