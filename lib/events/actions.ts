"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { tickets } from "@/lib/db/models"
import { getSession } from "@/lib/auth/session"
import { sessionWithRole } from "@/lib/lms/queries"
import { events, getEvent, issueEventTicket } from "@/lib/events/data"

type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }
const fail = (error: string): ActionResult<never> => ({ ok: false, error })

function refresh() {
  revalidatePath("/formations")
  revalidatePath("/dashboard/admin/events")
}

const eventSchema = z.object({
  slug: z.string().max(80).optional(),
  title: z.string().trim().min(4, "Title too short").max(140),
  description: z.string().trim().min(10, "Description too short").max(2000),
  location: z.string().trim().min(2, "Location required").max(140),
  audience: z.string().trim().max(140).optional(),
  /** ISO date-time, or empty while the date is to be announced. */
  startAt: z.string().optional(),
  duration: z.string().trim().min(1, "Duration required").max(60),
  /** One highlight per line. */
  highlights: z.string().max(2000).optional(),
  priceUsd: z.coerce.number().min(0, "Price can't be negative").max(5000),
  published: z.coerce.boolean().default(true),
})

/** Admin creates an event, or edits it when `slug` is given. */
export async function saveEventAction(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const admin = await sessionWithRole("admin")
  if (!admin) return fail("Forbidden")
  const parsed = eventSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")
  const d = parsed.data

  const startAt = d.startAt ? new Date(d.startAt) : undefined
  if (startAt && Number.isNaN(startAt.getTime())) return fail("Invalid date")
  const text = (v: string) => ({ fr: v, en: v })
  const fields = {
    title: text(d.title),
    description: text(d.description),
    location: d.location,
    audience: d.audience || undefined,
    duration: d.duration,
    highlights: (d.highlights ?? "").split("\n").map((h) => h.trim()).filter(Boolean).slice(0, 12),
    priceUsd: Math.round(d.priceUsd * 100) / 100,
    published: d.published,
    updatedAt: new Date(),
  }
  const col = await events()

  if (d.slug) {
    const res = await col.updateOne({ slug: d.slug }, startAt ? { $set: { ...fields, startAt } } : { $set: fields, $unset: { startAt: "" } })
    if (!res.matchedCount) return fail("Event not found")
    // Tickets already sold show the current date and place.
    await (await tickets()).updateMany(
      { eventSlug: d.slug },
      startAt
        ? { $set: { eventDate: startAt, location: d.location, formationDuration: d.duration, updatedAt: new Date() } }
        : { $set: { location: d.location, formationDuration: d.duration, updatedAt: new Date() }, $unset: { eventDate: "" } },
    )
    refresh()
    return { ok: true, data: { slug: d.slug } }
  }

  const base = d.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
  const slug = `${base || "event"}-${randomUUID().slice(0, 4)}`
  await col.insertOne({ slug, ...fields, ...(startAt ? { startAt } : {}), createdBy: admin.userId, createdAt: new Date() })
  refresh()
  return { ok: true, data: { slug } }
}

export async function setEventPublishedAction(input: { slug: string; published: boolean }): Promise<ActionResult> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")
  const res = await (await events()).updateOne({ slug: input.slug }, { $set: { published: input.published, updatedAt: new Date() } })
  if (!res.matchedCount) return fail("Event not found")
  refresh()
  return { ok: true }
}

/** Events with tickets sold can only be hidden, so buyers keep valid tickets. */
export async function deleteEventAction(slug: string): Promise<ActionResult> {
  if (!(await sessionWithRole("admin"))) return fail("Forbidden")
  if (await (await tickets()).findOne({ eventSlug: slug })) return fail("Tickets were already issued for this event. Hide it instead.")
  await (await events()).deleteOne({ slug })
  refresh()
  return { ok: true }
}

/** Free events ($0): registering issues the ticket immediately. */
export async function registerFreeEventAction(slug: string): Promise<ActionResult<{ code: string }>> {
  const session = await getSession()
  if (!session) return fail("Log in to register.")
  const event = await getEvent(slug)
  if (!event?.published) return fail("Event not found")
  if (event.priceUsd > 0) return fail("This event is paid.")
  const existing = await (await tickets()).findOne({ userId: session.userId, eventSlug: slug })
  if (existing) return { ok: true, data: { code: existing.ticketCode } }
  const ticket = await issueEventTicket(session.userId, event, { reference: `free:${slug}:${session.userId}`, amountUsd: 0, amount: 0, currency: "USD" })
  if (!ticket) return fail("Registration failed")
  revalidatePath("/dashboard/student")
  return { ok: true, data: { code: ticket.ticketCode } }
}
