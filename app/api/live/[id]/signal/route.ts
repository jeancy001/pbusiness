import { ObjectId } from "mongodb"
import { z } from "zod"

import { attendance, rtcSignals } from "@/lib/db/lms"
import { liveContext, ownsPeer } from "@/lib/lms/live"

// WebRTC signaling over plain HTTP (works on serverless hosting):
//   POST — send an offer / answer / ICE candidate to another peer
//   GET  — fetch messages addressed to my peer, plus who is in the room
// Messages expire after 10 minutes (TTL index).

const PRESENCE_WINDOW_MS = 75_000

let indexed = false
async function signals() {
  const col = await rtcSignals()
  if (!indexed) {
    await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 })
    await col.createIndex({ sessionId: 1, to: 1, _id: 1 })
    indexed = true
  }
  return col
}

const sendSchema = z.object({
  from: z.string(),
  to: z.string().min(3).max(80),
  type: z.enum(["offer", "answer", "candidate", "bye"]),
  payload: z.unknown(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const raw = await req.text()
  if (raw.length > 30_000) return Response.json({ ok: false }, { status: 413 })

  let body: unknown = null
  try {
    body = JSON.parse(raw)
  } catch {}
  const parsed = sendSchema.safeParse(body)
  const ctx = await liveContext(id)
  if (!parsed.success || !ctx) return Response.json({ ok: false }, { status: 400 })
  const { from, to, type, payload } = parsed.data

  if (!ownsPeer(ctx.session.userId, from)) return Response.json({ ok: false }, { status: 403 })
  // Star topology: students only ever talk to the teacher.
  if (!ctx.isHost && !to.startsWith(`${ctx.live.teacherId}:`)) return Response.json({ ok: false }, { status: 403 })

  await (await signals()).insertOne({ sessionId: id, from, to, type, payload, createdAt: new Date() })
  return Response.json({ ok: true })
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const peer = url.searchParams.get("peer")
  const since = url.searchParams.get("since")
  const ctx = await liveContext(id)
  if (!ctx || !ownsPeer(ctx.session.userId, peer)) return Response.json({ ok: false }, { status: 403 })

  const query: Record<string, unknown> = { sessionId: id, to: peer }
  if (since && ObjectId.isValid(since)) query._id = { $gt: new ObjectId(since) }

  const [messages, present] = await Promise.all([
    (await signals()).find(query).sort({ _id: 1 }).limit(200).toArray(),
    (await attendance())
      .find({ sessionId: id, leftAt: { $exists: false }, lastSeenAt: { $gte: new Date(Date.now() - PRESENCE_WINDOW_MS) } })
      .project<{ peerId?: string; userId: string; userName: string; role: string }>({ peerId: 1, userId: 1, userName: 1, role: 1 })
      .toArray(),
  ])

  return Response.json({
    ok: true,
    cursor: messages.at(-1)?._id ?? since ?? null,
    messages: messages.map((m) => ({ from: m.from, type: m.type, payload: m.payload })),
    peers: present.filter((p) => p.peerId).map((p) => ({ peerId: p.peerId, userId: p.userId, name: p.userName, role: p.role })),
    status: ctx.live.status,
  })
}
