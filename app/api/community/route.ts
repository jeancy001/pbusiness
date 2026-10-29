import { after } from "next/server"
import { ObjectId } from "mongodb"
import { z } from "zod"

import { getSession } from "@/lib/auth/session"
import { isDbConfigured } from "@/lib/db/mongodb"
import { CHANNELS } from "@/lib/community/channels"
import { communityMessages, messageView, tutorAnswer, type CommunityMessageDoc } from "@/lib/community/data"

// Community chat over plain HTTP polling (same approach as the live room):
//   GET   ?channel=…[&after=id]  channel messages · ?thread=id  a question and its answers
//   POST  post a message, a question, or an answer
//   PATCH accept an answer / delete a message

const channelIds = CHANNELS.map((c) => c.id) as [string, ...string[]]
const PER_MINUTE = 8

export async function GET(req: Request) {
  if (!isDbConfigured()) return Response.json({ messages: [] })
  const url = new URL(req.url)
  const col = await communityMessages()

  const thread = url.searchParams.get("thread")
  if (thread) {
    if (!ObjectId.isValid(thread)) return Response.json({ error: "Not found" }, { status: 404 })
    const [question, answers] = await Promise.all([
      col.findOne({ _id: new ObjectId(thread) }),
      col.find({ parentId: thread }).sort({ _id: 1 }).limit(200).toArray(),
    ])
    if (!question) return Response.json({ error: "Not found" }, { status: 404 })
    return Response.json({ question: messageView(question), answers: answers.map(messageView) })
  }

  const channel = url.searchParams.get("channel") ?? "general"
  if (!channelIds.includes(channel)) return Response.json({ error: "Unknown channel" }, { status: 400 })
  const afterId = url.searchParams.get("after")
  const query: Record<string, unknown> = { channel, parentId: { $exists: false } }
  if (afterId && ObjectId.isValid(afterId)) query._id = { $gt: new ObjectId(afterId) }
  const docs = await col.find(query).sort({ _id: -1 }).limit(80).toArray()
  return Response.json({ messages: docs.reverse().map(messageView) })
}

const postSchema = z.object({
  channel: z.enum(channelIds),
  body: z.string().trim().min(1, "Write a message").max(2000, "Message too long (2000 characters max)"),
  question: z.boolean().optional(),
  askTutor: z.boolean().optional(),
  parentId: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Log in to take part in the community." }, { status: 401 })
  if (!isDbConfigured()) return Response.json({ error: "Unavailable" }, { status: 503 })
  const parsed = postSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid message" }, { status: 400 })
  const d = parsed.data

  const col = await communityMessages()
  if ((await col.countDocuments({ userId: session.userId, createdAt: { $gte: new Date(Date.now() - 60_000) } })) >= PER_MINUTE) {
    return Response.json({ error: "You're posting too fast. Wait a moment." }, { status: 429 })
  }

  let parent = null
  if (d.parentId) {
    parent = ObjectId.isValid(d.parentId) ? await col.findOne({ _id: new ObjectId(d.parentId), question: true, deleted: { $ne: true } }) : null
    if (!parent || parent.channel !== d.channel) return Response.json({ error: "Question not found" }, { status: 404 })
  }

  const doc: CommunityMessageDoc = {
    channel: d.channel as CommunityMessageDoc["channel"],
    userId: session.userId,
    userName: session.name,
    role: session.role,
    body: d.body,
    ...(parent ? { parentId: d.parentId } : d.question ? { question: true, answers: 0 } : {}),
    createdAt: new Date(),
  }
  const { insertedId } = await col.insertOne(doc)
  if (parent) await col.updateOne({ _id: parent._id }, { $inc: { answers: 1 } })

  // The Tutor answers in the thread a few seconds later.
  if (doc.question && d.askTutor) {
    after(async () => {
      try {
        await tutorAnswer({ ...doc, _id: insertedId })
      } catch (error) {
        console.error(`Community tutor answer failed: ${String((error as Error)?.message ?? error).slice(0, 200)}`)
      }
    })
  }
  return Response.json({ message: messageView({ ...doc, _id: insertedId }) })
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept"), questionId: z.string(), answerId: z.string() }),
  z.object({ action: z.literal("delete"), id: z.string() }),
])

export async function PATCH(req: Request) {
  const session = await getSession()
  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!session || !parsed.success) return Response.json({ error: "Forbidden" }, { status: 403 })
  const col = await communityMessages()
  const d = parsed.data

  if (d.action === "accept") {
    if (!ObjectId.isValid(d.questionId)) return Response.json({ error: "Not found" }, { status: 404 })
    const question = await col.findOne({ _id: new ObjectId(d.questionId), question: true })
    if (!question || question.userId !== session.userId) return Response.json({ error: "Only the author can accept an answer." }, { status: 403 })
    const answer = ObjectId.isValid(d.answerId) ? await col.findOne({ _id: new ObjectId(d.answerId), parentId: d.questionId }) : null
    if (!answer) return Response.json({ error: "Answer not found" }, { status: 404 })
    await col.updateOne({ _id: question._id }, { $set: { acceptedId: d.answerId } })
    return Response.json({ ok: true })
  }

  if (!ObjectId.isValid(d.id)) return Response.json({ error: "Not found" }, { status: 404 })
  const msg = await col.findOne({ _id: new ObjectId(d.id) })
  const moderator = session.role === "admin" || session.role === "teacher"
  if (!msg || (msg.userId !== session.userId && !moderator)) return Response.json({ error: "Forbidden" }, { status: 403 })
  await col.updateOne({ _id: msg._id }, { $set: { deleted: true } })
  return Response.json({ ok: true })
}
