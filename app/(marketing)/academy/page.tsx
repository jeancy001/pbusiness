import type { Metadata } from "next"
import { AiAcademy } from "@/components/lms/ai-academy"
import { getSession } from "@/lib/auth/session"
import { aiProgressFor, listAiTracks } from "@/lib/lms/ai-tracks"
import { myRatings } from "@/lib/lms/ratings"

export const metadata: Metadata = {
  title: "Académie IA",
  description: "Apprenez le Twi, le Ga, l'Ewe, le français, l'anglais, la programmation ou un métier avec un tuteur personnel.",
}

export default async function AcademyPage() {
  const session = await getSession()
  const [tracks, progress, rated] = await Promise.all([
    listAiTracks(),
    session ? aiProgressFor(session.userId) : { owned: [], completed: [] },
    session ? myRatings(session.userId) : {},
  ])
  // Teachers pay like every learner; only admins review courses for free.
  return <AiAcademy tracks={tracks} owned={progress.owned} completed={progress.completed} admin={session?.role === "admin"} myRatings={rated} />
}
