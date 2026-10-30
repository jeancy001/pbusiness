import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ProfileView } from "@/components/account/profile-view"
import { getProfile } from "@/lib/account/profile"
import { getSession } from "@/lib/auth/session"

export const metadata: Metadata = { title: "Mon profil" }

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")
  const profile = await getProfile(session)
  if (!profile) redirect("/login")
  return <ProfileView profile={profile} />
}
