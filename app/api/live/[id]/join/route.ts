import { iceServers, liveContext } from "@/lib/lms/live"

// Room configuration for the WebRTC classroom.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await liveContext((await params).id)
  if (!ctx) return Response.json({ ok: false, error: "Not found" }, { status: 404 })
  if (ctx.live.status === "ended") return Response.json({ ok: false, error: "This live class has ended." }, { status: 410 })

  return Response.json({
    ok: true,
    userId: ctx.session.userId,
    userName: ctx.session.name,
    hostUserId: ctx.live.teacherId,
    role: ctx.isHost ? "host" : "attendee",
    iceServers: iceServers(),
  })
}
