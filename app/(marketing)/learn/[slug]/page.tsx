import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { CoursePlayer } from "@/components/lms/course-player"
import { getSession } from "@/lib/auth/session"
import { getFormationBySlug } from "@/lib/data/catalog"
import { enrollments } from "@/lib/db/models"
import { liveSessions, toObjectId } from "@/lib/db/lms"
import { courseAccess, getCompletedLessonIds, getCourseLessons } from "@/lib/lms/queries"

export const metadata: Metadata = { title: "Cours" }

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lesson?: string }>
}) {
  const { slug } = await params
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.emailVerified === false) redirect("/verify-email")

  const formation = await getFormationBySlug(slug)
  if (!formation) notFound()
  const access = await courseAccess(session, slug)
  if (!access) redirect(`/formations/${slug}`)

  const lessons = await getCourseLessons(slug)
  const isStudent = access === "student"
  const [completed, enrollment] = isStudent
    ? await Promise.all([
        getCompletedLessonIds(session.userId, slug),
        (await enrollments()).findOne({ userId: session.userId, formationSlug: slug }),
      ])
    : [[], null]

  const liveIds = lessons.map((l) => l.liveSessionId).filter(Boolean).map((id) => toObjectId(id!)).filter(Boolean)
  const sessions = liveIds.length ? await (await liveSessions()).find({ _id: { $in: liveIds as never[] } }).toArray() : []

  const requested = (await searchParams).lesson
  const current =
    lessons.find((l) => l.id === requested) ?? lessons.find((l) => !completed.includes(l.id)) ?? lessons[0] ?? null

  return (
    <CoursePlayer
      formation={formation}
      lessons={lessons}
      currentId={current?.id ?? null}
      completed={completed}
      progress={enrollment?.progress ?? 0}
      isStudent={isStudent}
      live={Object.fromEntries(
        sessions.map((s) => [String(s._id), { startAt: s.startAt.toISOString(), durationMin: s.durationMin, status: s.status }]),
      )}
    />
  )
}
