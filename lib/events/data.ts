import "server-only"
import { randomBytes } from "crypto"
import type { ObjectId } from "mongodb"

import { getDb, isDbConfigured } from "@/lib/db/mongodb"
import { tickets, users, type TicketDoc } from "@/lib/db/models"
import { byUserId } from "@/lib/db/lms"
import type { LocalizedText } from "@/lib/mock-data"

// ============================================================
// EVENTS — posted by admins, sold as tickets through Mobile Money.
// ============================================================

export interface EventDoc {
  _id?: ObjectId
  slug: string
  title: LocalizedText
  description: LocalizedText
  location: string
  audience?: string
  /** Absent while the date is still to be announced. */
  startAt?: Date
  duration: string
  highlights: string[]
  /** 0 = free registration. */
  priceUsd: number
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type EventView = Omit<EventDoc, "_id" | "startAt" | "createdAt" | "updatedAt" | "createdBy"> & {
  startAt?: string
  ticketsSold: number
}

export async function events() {
  return (await getDb()).collection<EventDoc>("events")
}

function view(doc: EventDoc, ticketsSold = 0): EventView {
  return {
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    location: doc.location,
    audience: doc.audience,
    startAt: doc.startAt?.toISOString(),
    duration: doc.duration,
    highlights: doc.highlights,
    priceUsd: doc.priceUsd,
    published: doc.published,
    ticketsSold,
  }
}

/** Published events that haven't happened yet (undated ones included), soonest first. */
export async function getPublicEvents(): Promise<EventView[]> {
  if (!isDbConfigured()) return []
  const docs = await (await events())
    .find({ published: true, $or: [{ startAt: { $exists: false } }, { startAt: { $gte: new Date(Date.now() - 86_400_000) } }] })
    .sort({ startAt: 1, createdAt: -1 })
    .limit(6)
    .toArray()
  return docs.map((d) => view(d))
}

export async function getAdminEvents(): Promise<EventView[]> {
  if (!isDbConfigured()) return []
  const [docs, counts] = await Promise.all([
    (await events()).find({}).sort({ createdAt: -1 }).toArray(),
    (await tickets()).aggregate<{ _id: string; n: number }>([{ $group: { _id: "$eventSlug", n: { $sum: 1 } } }]).toArray(),
  ])
  return docs.map((d) => view(d, counts.find((c) => c._id === d.slug)?.n ?? 0))
}

export async function getEvent(slug: string) {
  if (!isDbConfigured()) return null
  return (await events()).findOne({ slug })
}

// ============================================================
// TICKETS
// ============================================================

/** One ticket per payment (or per free registration); repeat calls return the same ticket. */
export async function issueEventTicket(
  userId: string,
  event: EventDoc,
  payment: { reference: string; amountUsd: number; amount: number; currency: string },
) {
  const col = await tickets()
  const existing = await col.findOne({ paymentReference: payment.reference })
  if (existing) return existing
  const user = await (await users()).findOne(byUserId(userId))
  if (!user) return null

  const now = new Date()
  const doc: TicketDoc = {
    ticketCode: `EVT-${now.getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`,
    eventSlug: event.slug,
    eventName: event.title,
    userId,
    studentName: user.name,
    studentEmail: user.email,
    eventDate: event.startAt,
    formationDuration: event.duration,
    location: event.location,
    paymentReference: payment.reference,
    amountUsd: payment.amountUsd,
    amount: payment.amount,
    currency: payment.currency,
    status: "active",
    issuedAt: now,
    createdAt: now,
    updatedAt: now,
  }
  await col.insertOne(doc)
  return doc
}

export type TicketView = { code: string; eventName: LocalizedText; eventDate?: string; location: string; status: TicketDoc["status"] }

export async function getUserTickets(userId: string): Promise<TicketView[]> {
  if (!isDbConfigured()) return []
  const rows = await (await tickets()).find({ userId }).sort({ issuedAt: -1 }).limit(20).toArray()
  return rows.map((t) => ({ code: t.ticketCode, eventName: t.eventName, eventDate: t.eventDate?.toISOString(), location: t.location, status: t.status }))
}
