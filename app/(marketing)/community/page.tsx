import type { Metadata } from "next"
import { CommunityChat } from "@/components/community/community-chat"
import { getSession } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Communauté",
  description: "Discutez avec les étudiants, posez vos questions et obtenez des réponses de la communauté et du Tuteur.",
}

export default async function CommunityPage() {
  const session = await getSession()
  return <CommunityChat me={session ? { userId: session.userId, role: session.role } : null} />
}
