import { generateObject } from "ai"
import { z } from "zod"
import { AI_MODEL, aiEnabled } from "@/lib/ai/config"
import { getAllFormations, getServices } from "@/lib/data/catalog"
import { localize } from "@/lib/mock-data"
import type { Locale } from "@/lib/i18n/dictionary"

export const maxDuration = 30

const resultSchema = z.object({
  summary: z.string().describe("A short, friendly 1-2 sentence summary of the results in the requested language."),
  formationSlugs: z.array(z.string()).describe("Slugs of matching formations, most relevant first (max 4)."),
  serviceIds: z.array(z.string()).describe("Ids of matching services, most relevant first (max 3)."),
})

export async function POST(req: Request) {
  const { query, locale = "fr" } = (await req.json()) as { query?: string; locale?: Locale }
  const q = (query ?? "").trim()

  const formations = await getAllFormations()
  const services = getServices()

  // Build a compact catalog the model can reason over.
  const formationList = formations.map((f) => ({
    slug: f.slug,
    title: localize(f.title, locale),
    summary: localize(f.summary, locale),
    category: f.category,
    level: f.level,
    price: f.priceUsd,
  }))
  const serviceList = services.map((s) => ({
    id: s.id,
    title: localize(s.title, locale),
    description: localize(s.description, locale),
  }))

  // Graceful fallback: simple keyword match when the AI Gateway isn't configured.
  if (!q || !aiEnabled()) {
    const lower = q.toLowerCase()
    const fSlugs = formationList
      .filter((f) => !lower || (f.title + f.summary + f.category).toLowerCase().includes(lower))
      .slice(0, 4)
      .map((f) => f.slug)
    const sIds = serviceList
      .filter((s) => !lower || (s.title + s.description).toLowerCase().includes(lower))
      .slice(0, 3)
      .map((s) => s.id)
    return Response.json({
      summary:
        locale === "fr"
          ? `J'ai trouvé ${fSlugs.length + sIds.length} résultat(s) dans notre catalogue.`
          : `I found ${fSlugs.length + sIds.length} result(s) in our catalog.`,
      formationSlugs: fSlugs,
      serviceIds: sIds,
    })
  }

  try {
    const { object } = await generateObject({
      model: AI_MODEL,
      schema: resultSchema,
      system:
        `You are the search assistant for P Business Online, a tech training and digital services platform. ` +
        `Given a user query, pick the most relevant formations and services from the provided catalog ONLY. ` +
        `Never invent items. Reply in ${locale === "fr" ? "French" : "English"}.`,
      prompt:
        `User query: "${q}"\n\n` +
        `FORMATIONS:\n${JSON.stringify(formationList)}\n\n` +
        `SERVICES:\n${JSON.stringify(serviceList)}`,
    })
    return Response.json(object)
  } catch {
    return Response.json({ summary: "", formationSlugs: [], serviceIds: [] }, { status: 200 })
  }
}
