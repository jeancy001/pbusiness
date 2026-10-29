import { z } from "zod"

import { getSession } from "@/lib/auth/session"
import { attendance, liveSessions, toObjectId } from "@/lib/db/lms"
import { getLiveSession, liveAccess } from "@/lib/lms/queries"
import { ownsPeer } from "@/lib/lms/live"

const HEARTBEAT_SEC = 30
const schema = z.object({ event: z.enum(["join", "heartbeat", "leave"]), peerId: z.string().max(80).optional() })

/**
 * Participation tracking. The embedded client reports join/leave and a
 * heartbeat every 30s; time is credited per heartbeat (capped) so a
 * closed tab stops accruing presence.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  const session = await getSession()
  const { id } = await params
  const live = await getLiveSession(id)
  if (!parsed.success || !session || !live) return Response.json({ ok: false }, { status: 400 })

  const access = await liveAccess(session, live)
  if (!access) return Response.json({ ok: false }, { status: 403 })

  const isHost = access === "owner" && live.teacherId === session.userId
  // The tab's WebRTC peer id makes the user visible in the room's presence list.
  const peerId = ownsPeer(session.userId, parsed.data.peerId) ? parsed.data.peerId : undefined
  const col = await attendance()
  const now = new Date()
  const key = { sessionId: id, userId: session.userId }
  const existing = await col.findOne(key)
  const credited = existing && !existing.leftAt
    ? Math.min(HEARTBEAT_SEC * 2, Math.max(0, Math.round((now.getTime() - existing.lastSeenAt.getTime()) / 1000)))
    : 0

  if (parsed.data.event === "join") {
    await col.updateOne(
      key,
      {
        $setOnInsert: { joinedAt: now, secondsPresent: 0, userName: session.name, role: isHost ? "host" : "attendee" },
        $set: { lastSeenAt: now, ...(peerId ? { peerId } : {}) },
        $unset: { leftAt: "" },
      },
      { upsert: true },
    )
    if (isHost && live.status === "scheduled") {
      await (await liveSessions()).updateOne({ _id: toObjectId(id)! }, { $set: { status: "live" } })
    }
  } else if (existing) {
    await col.updateOne(key, {
      $inc: { secondsPresent: credited },
      $set: parsed.data.event === "leave" ? { lastSeenAt: now, leftAt: now } : { lastSeenAt: now, ...(peerId ? { peerId } : {}) },
    })
  }
  return Response.json({ ok: true })
}
