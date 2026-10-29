import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { LiveRoom } from "@/components/lms/live-room"
import { getSession } from "@/lib/auth/session"
import { getFormationBySlug } from "@/lib/data/catalog"
import { getLiveSession, liveAccess } from "@/lib/lms/queries"

export const metadata: Metadata = { title: "Cours en direct" }

export default async function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect("/login")

  const live = await getLiveSession(id)
  if (!live) notFound()
  const access = await liveAccess(session, live)
  if (!access) redirect(`/formations/${live.formationSlug}`)

  const formation = await getFormationBySlug(live.formationSlug)
  return (
    <LiveRoom
      id={id}
      topic={live.topic}
      courseTitle={formation?.title ?? null}
      startAt={live.startAt.toISOString()}
      durationMin={live.durationMin}
      ended={live.status === "ended"}
      isHost={access === "owner" && live.teacherId === session.userId}
      backHref={access === "student" ? "/dashboard/student" : live.privateFor ? "/dashboard/teacher#live-requests" : `/dashboard/teacher/courses/${live.formationSlug}`}
    />
  )
}
