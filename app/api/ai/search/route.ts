
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

import {
  AI_MODEL,
  aiEnabled,
} from "@/lib/ai/config"

import {
  getAllFormations,
  getServices,
} from "@/lib/data/catalog"

import { localize } from "@/lib/mock-data"

import type {
  Locale,
} from "@/lib/i18n/dictionary"

export const maxDuration = 30

// ============================================================
// AI RESPONSE SCHEMA
// ============================================================

const resultSchema = z.object({
  summary: z
    .string()
    .describe(
      "A short and friendly 1-2 sentence summary of the search results in the requested language.",
    ),

  formationSlugs: z
    .array(z.string())
    .max(4)
    .describe(
      "Slugs of matching formations, ordered from most relevant to least relevant.",
    ),

  serviceIds: z
    .array(z.string())
    .max(3)
    .describe(
      "IDs of matching services, ordered from most relevant to least relevant.",
    ),
})

type SearchRequest = {
  query?: string
  locale?: Locale
}

// ============================================================
// KEYWORD SEARCH FALLBACK
// ============================================================

function searchCatalog(
  query: string,
  formations: Array<{
    slug: string
    title: string
    summary: string
    category: string
  }>,
  services: Array<{
    id: string
    title: string
    description: string
  }>,
) {
  const lower = query.toLowerCase().trim()

  const formationSlugs = formations
    .filter((formation) => {
      if (!lower) return true

      const searchableText = [
        formation.title,
        formation.summary,
        formation.category,
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(lower)
    })
    .slice(0, 4)
    .map((formation) => formation.slug)

  const serviceIds = services
    .filter((service) => {
      if (!lower) return true

      const searchableText = [
        service.title,
        service.description,
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(lower)
    })
    .slice(0, 3)
    .map((service) => service.id)

  return {
    formationSlugs,
    serviceIds,
  }
}

// ============================================================
// API ROUTE
// ============================================================

export async function POST(req: Request) {
  try {
    const {
      query,
      locale = "fr",
    } = (await req.json()) as SearchRequest

    const safeLocale =
      locale === "en" ? "en" : "fr"

    const q =
      typeof query === "string"
        ? query.trim().slice(0, 500)
        : ""

    // Load catalog data.
    const [formations, services] = await Promise.all([
      getAllFormations(),
      Promise.resolve(getServices()),
    ])

    // ============================================================
    // BUILD LOCALIZED CATALOG
    // ============================================================

    const formationList = formations.map((formation) => ({
      slug: formation.slug,
      title: localize(
        formation.title,
        safeLocale,
      ),
      summary: localize(
        formation.summary,
        safeLocale,
      ),
      category: formation.category,
      level: formation.level,
      price: formation.priceUsd,
    }))

    const serviceList = services.map((service) => ({
      id: service.id,
      title: localize(
        service.title,
        safeLocale,
      ),
      description: localize(
        service.description,
        safeLocale,
      ),
    }))

    // ============================================================
    // FALLBACK SEARCH
    // ============================================================

    if (!q || !aiEnabled()) {
      const {
        formationSlugs,
        serviceIds,
      } = searchCatalog(
        q,
        formationList,
        serviceList,
      )

      const total =
        formationSlugs.length +
        serviceIds.length

      return Response.json({
        summary:
          safeLocale === "fr"
            ? `J'ai trouvé ${total} résultat${
                total > 1 ? "s" : ""
              } dans notre catalogue.`
            : `I found ${total} result${
                total !== 1 ? "s" : ""
              } in our catalog.`,

        formationSlugs,
        serviceIds,
      })
    }

    // ============================================================
    // GEMINI AI SEARCH
    // ============================================================

    const { object } =
      await generateObject({
        model: google(AI_MODEL),

        schema: resultSchema,

        system:
          `You are the intelligent search assistant for P Business Online, ` +
          `a technology training and digital services platform.

Your task is to analyze the user's search query and select the most relevant items from the provided catalog.

STRICT RULES:
- Only recommend formations and services that exist in the provided catalog.
- Never invent a slug, service ID, formation, or service.
- Return a maximum of 4 formation slugs.
- Return a maximum of 3 service IDs.
- Order results from most relevant to least relevant.
- If nothing is relevant, return empty arrays.
- Write the summary in ${
            safeLocale === "fr"
              ? "French"
              : "English"
          }.
- Keep the summary friendly, natural, and concise.`,

        prompt:
          `USER SEARCH QUERY:
"${q}"

AVAILABLE FORMATIONS:
${JSON.stringify(formationList)}

AVAILABLE SERVICES:
${JSON.stringify(serviceList)}

Analyze the query and return only relevant items from the available catalog.`,

        temperature: 0.2,
      })

    // ============================================================
    // VALIDATE AI RESULTS
    // ============================================================

    const validFormationSlugs =
      new Set(
        formationList.map(
          (formation) => formation.slug,
        ),
      )

    const validServiceIds =
      new Set(
        serviceList.map(
          (service) => service.id,
        ),
      )

    const formationSlugs =
      object.formationSlugs
        .filter((slug) =>
          validFormationSlugs.has(slug),
        )
        .slice(0, 4)

    const serviceIds =
      object.serviceIds
        .filter((id) =>
          validServiceIds.has(id),
        )
        .slice(0, 3)

    return Response.json({
      summary: object.summary,
      formationSlugs,
      serviceIds,
    })
  } catch (error) {
    console.error(
      "Gemini AI search error:",
      error,
    )

    // Never break the search experience because AI failed.
    return Response.json(
      {
        summary: "",
        formationSlugs: [],
        serviceIds: [],
      },
      {
        status: 200,
      },
    )
  }
}

