import "server-only"

import { getSession } from "@/lib/auth/session"
import { getLiveSession, liveAccess } from "@/lib/lms/queries"

/** Who is calling into a live room, and whether they host it (the course teacher). */
export async function liveContext(sessionId: string) {
  const [session, live] = await Promise.all([getSession(), getLiveSession(sessionId)])
  if (!session || !live) return null
  const access = await liveAccess(session, live)
  if (!access) return null
  return { session, live, isHost: access === "owner" && live.teacherId === session.userId }
}

/** A peer id is "<userId>:<tab>", so a caller can only speak for their own tabs. */
export function ownsPeer(userId: string, peerId: unknown): peerId is string {
  return typeof peerId === "string" && peerId.length < 80 && peerId.startsWith(`${userId}:`)
}

/**
 * STUN finds direct routes; TURN relays media when both sides are behind
 * strict NATs (common on mobile networks). Configure TURN for production.
 */
export function iceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }]
  const turn = process.env.TURN_URLS?.split(",").map((u) => u.trim()).filter(Boolean)
  if (turn?.length) {
    servers.push({ urls: turn, username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL })
  }
  return servers
}
