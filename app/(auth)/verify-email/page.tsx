import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { VerifyForm } from "@/components/auth/verify-form"
import { getSession } from "@/lib/auth/session"

export const metadata: Metadata = { title: "Vérifier votre e-mail" }

export default async function VerifyEmailPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  const home = `/dashboard/${session.role}`
  if (session.emailVerified !== false) redirect(home)
  return <VerifyForm email={session.email} next={home} />
}
