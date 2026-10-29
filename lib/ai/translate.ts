import "server-only"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

import { AI_MODEL, isAiConfigured } from "@/lib/ai/config"
import { formations } from "@/lib/db/models"
import type { Formation, LocalizedText } from "@/lib/mock-data"

// Course content is written once (in the teacher's language) and translated
// by Gemini into every platform language: fr, en, Twi, Ga, Ewe.

const localized = z.object({ fr: z.string(), en: z.string(), tw: z.string(), gaa: z.string(), ee: z.string() })

const schema = z.object({
  title: localized,
  summary: localized,
  description: localized,
  objectives: z.array(localized),
  prerequisites: z.array(localized),
})

export async function translateCourse(f: Pick<Formation, "title" | "summary" | "description" | "objectives" | "prerequisites">) {
  const source = (t: LocalizedText) => t.fr || t.en
  const { object } = await generateObject({
    model: google(AI_MODEL),
    schema,
    temperature: 0.2,
    prompt: `Translate this online course listing into French (fr), English (en), Asante Twi (tw), Ga (gaa) and Ewe (ee).
Keep it professional and natural for learners in West and Central Africa. Keep technology terms, product names, brand names and code identifiers as they are (e.g. "React", "Python", "API", "Mobile Money"). Preserve meaning exactly; do not add content.

TITLE: ${source(f.title)}
SUMMARY: ${source(f.summary)}
DESCRIPTION: ${source(f.description)}
OBJECTIVES:
${f.objectives.map((o, i) => `${i + 1}. ${source(o)}`).join("\n") || "(none)"}
PREREQUISITES:
${f.prerequisites.map((o, i) => `${i + 1}. ${source(o)}`).join("\n") || "(none)"}`,
  })
  return object
}

/** Fills every language for one course stored in MongoDB. Safe to re-run. */
export async function translateStoredCourse(slug: string) {
  if (!isAiConfigured()) return false
  const col = await formations()
  const course = await col.findOne({ slug })
  if (!course) return false
  const t = await translateCourse(course)
  await col.updateOne(
    { slug },
    {
      $set: {
        title: t.title,
        summary: t.summary,
        description: t.description,
        ...(t.objectives.length === course.objectives.length ? { objectives: t.objectives } : {}),
        ...(t.prerequisites.length === course.prerequisites.length ? { prerequisites: t.prerequisites } : {}),
        translatedAt: new Date(),
      } as Partial<Formation>,
    },
  )
  return true
}
