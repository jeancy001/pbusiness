import { z } from "zod"
import { isDbConfigured } from "@/lib/db/mongodb"
import { quotes } from "@/lib/db/models"
import { getSession } from "@/lib/auth/session"

const quoteSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  service: z.string().min(1).max(120),
  budget: z.string().max(40).optional().default(""),
  deadline: z.string().max(40).optional().default(""),
  description: z.string().min(1).max(5000),
})

export async function POST(req: Request) {
  const parsed = quoteSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid submission." }, { status: 400 })
  }

  const session = await getSession()
  const data = parsed.data

  // Preview / no-DB mode: accept the request so the UX still works.
  if (!isDbConfigured()) {
    return Response.json({ ok: true, persisted: false })
  }

  try {
    const col = await quotes()
    await col.insertOne({
      name: data.name ?? session?.name ?? "",
      email: data.email ?? session?.email ?? "",
      service: data.service,
      budget: data.budget,
      deadline: data.deadline,
      description: data.description,
      status: "new",
      createdAt: new Date(),
    })
    return Response.json({ ok: true, persisted: true })
  } catch {
    return Response.json({ ok: false, error: "Could not save your request." }, { status: 500 })
  }
}
