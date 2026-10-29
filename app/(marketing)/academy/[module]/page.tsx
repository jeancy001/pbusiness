import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { AiTutorChat } from "@/components/lms/ai-tutor-chat"
import { getSession } from "@/lib/auth/session"
import { aiProgressFor, findAiModule, hasAiModuleAccess } from "@/lib/lms/ai-tracks"

export const metadata: Metadata = { title: "Tuteur" }

export default async function TutorPage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params
  const mod = await findAiModule(slug)
  if (!mod) notFound()

  const session = await getSession()
  if (!session) redirect("/login")
  if (!(await hasAiModuleAccess(session, slug))) redirect("/academy")

  const { owned, completed } = await aiProgressFor(session.userId)
  return <AiTutorChat mod={mod} completed={completed} tracksProgress={owned.includes(mod.track.slug)} />
}
