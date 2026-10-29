import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { ExamRunner } from "@/components/lms/exam-runner"
import { getSession } from "@/lib/auth/session"
import { getFormationBySlug } from "@/lib/data/catalog"
import { enrollments } from "@/lib/db/models"
import { certificates } from "@/lib/db/lms"
import { effectivePassScore } from "@/lib/lms/catalog"
import { bestAttempt, courseAccess, getOrCreateExam } from "@/lib/lms/queries"

export const metadata: Metadata = { title: "Examen de certification" }

export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()
  if (!session) redirect("/login")
  if ((await courseAccess(session, slug)) !== "student") redirect(`/learn/${slug}`)

  const enrollment = await (await enrollments()).findOne({ userId: session.userId, formationSlug: slug })
  if (!enrollment || enrollment.progress < 100) redirect(`/learn/${slug}`)

  const [formation, exam, best, cert] = await Promise.all([
    getFormationBySlug(slug),
    getOrCreateExam(slug),
    bestAttempt(session.userId, slug),
    (await certificates()).findOne({ userId: session.userId, formationSlug: slug }),
  ])
  if (!formation) notFound()

  return (
    <ExamRunner
      course={formation}
      // Correct answers never leave the server.
      questions={exam?.questions.map(({ id, prompt, options }) => ({ id, prompt, options })) ?? null}
      passScore={effectivePassScore(exam?.passScore)}
      previous={best ? { score: best.score, passed: best.passed } : null}
      certificateCode={cert?.code ?? null}
    />
  )
}
