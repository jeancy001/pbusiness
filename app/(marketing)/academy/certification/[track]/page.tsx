import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { ExamRunner } from "@/components/lms/exam-runner"
import { getSession } from "@/lib/auth/session"
import { certificates } from "@/lib/db/lms"
import { bestAttempt } from "@/lib/lms/queries"
import { aiCertKey, effectivePassScore } from "@/lib/lms/catalog"
import { aiProgressFor, findAiTrack, getOrCreateAiExam, trackCompleted } from "@/lib/lms/ai-tracks"

export const metadata: Metadata = { title: "Certification Linko Academy" }

export default async function AiCertificationPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: slug } = await params
  const track = await findAiTrack(slug)
  if (!track) notFound()

  const session = await getSession()
  if (!session) redirect("/login")
  const { owned, completed } = await aiProgressFor(session.userId)
  if (!owned.includes(slug) || !trackCompleted(track, completed)) redirect("/academy")

  const key = aiCertKey(slug)
  const [exam, best, cert] = await Promise.all([
    getOrCreateAiExam(track),
    bestAttempt(session.userId, key),
    (await certificates()).findOne({ userId: session.userId, formationSlug: key }),
  ])

  return (
    <ExamRunner
      course={{ slug, title: track.name }}
      mode="ai"
      // Correct answers never leave the server.
      questions={exam?.questions.map(({ id, prompt, options }) => ({ id, prompt, options })) ?? null}
      passScore={effectivePassScore(exam?.passScore)}
      previous={best ? { score: best.score, passed: best.passed } : null}
      certificateCode={cert?.code ?? null}
    />
  )
}
