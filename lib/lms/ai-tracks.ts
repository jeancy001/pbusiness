import "server-only"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import { randomUUID } from "crypto"

import type { SessionPayload } from "@/lib/auth/session"
import { isDbConfigured } from "@/lib/db/mongodb"
import { aiModuleAccess, aiTracksCol, exams, type ExamDoc } from "@/lib/db/lms"
import { AI_MODEL, isAiConfigured } from "@/lib/ai/config"
import { ratingSummaries } from "@/lib/lms/ratings"
import { EXAM_PASS_SCORE, aiCertKey, aiModuleSlug, aiTracks, moduleOf, type AiModule, type AiTrack, type AiTrackKind } from "@/lib/lms/catalog"

// ============================================================
// CATALOG — bundled tracks + courses the admin generated with AI.
// ============================================================

export type AiTrackView = AiTrack & { hidden?: boolean }

export async function listAiTracks({ includeHidden = false } = {}): Promise<AiTrackView[]> {
  if (!isDbConfigured()) return aiTracks
  const docs = await (await aiTracksCol()).find(includeHidden ? {} : { hidden: { $ne: true } }, { projection: { _id: 0, createdBy: 0, createdAt: 0 } }).sort({ createdAt: 1 }).toArray()
  const all = [...aiTracks, ...(docs as AiTrackView[])]
  const summaries = await ratingSummaries(all.map((t) => `ai:${t.slug}` as const))
  return all.map((t) => {
    const r = summaries.get(`ai:${t.slug}`)
    return r ? { ...t, rating: r.avg, ratingCount: r.count } : { ...t, ratingCount: 0 }
  })
}

export async function findAiTrack(slug: string): Promise<AiTrack | null> {
  const bundled = aiTracks.find((t) => t.slug === slug)
  if (bundled) return bundled
  if (!isDbConfigured()) return null
  return (await (await aiTracksCol()).findOne({ slug, hidden: { $ne: true } }, { projection: { _id: 0, createdBy: 0, createdAt: 0 } })) as AiTrack | null
}

/** Module slugs are "<track>-<n>". */
export async function findAiModule(slug: string): Promise<AiModule | null> {
  const match = /^(.+)-(\d+)$/.exec(slug)
  if (!match) return null
  const track = await findAiTrack(match[1])
  return track ? moduleOf(track, Number(match[2])) : null
}

// ============================================================
// ACCESS — every learner pays, teachers included. Admins review for free.
// ============================================================

/** Buying a course grants module 1 onwards; owning module 1 unlocks every module, including ones added later. */
export async function ownsAiTrack(userId: string, trackSlug: string) {
  if (!isDbConfigured()) return null
  return (await aiModuleAccess()).findOne({ userId, moduleSlug: aiModuleSlug(trackSlug, 1) })
}

export async function hasAiModuleAccess(session: SessionPayload, moduleSlug: string) {
  if (session.role === "admin") return true
  const mod = await findAiModule(moduleSlug)
  return Boolean(mod && (await ownsAiTrack(session.userId, mod.track.slug)))
}

/** Track slugs the user bought, and module slugs they finished. */
export async function aiProgressFor(userId: string) {
  if (!isDbConfigured()) return { owned: [] as string[], completed: [] as string[] }
  const rows = await (await aiModuleAccess()).find({ userId }).toArray()
  return {
    owned: rows.filter((r) => r.moduleSlug.endsWith("-1")).map((r) => r.moduleSlug.slice(0, -2)),
    completed: rows.filter((r) => r.completedAt).map((r) => r.moduleSlug),
  }
}

export function trackCompleted(track: AiTrack, completed: string[]) {
  return track.modules.every((_, i) => completed.includes(aiModuleSlug(track.slug, i + 1)))
}

// ============================================================
// AI GENERATION
// ============================================================

const syllabusSchema = z.object({
  nameFr: z.string(),
  nameEn: z.string(),
  badge: z.string().describe("2–8 character label for the course card, e.g. 'SEO', 'Excel', 'PM'"),
  descriptionFr: z.string(),
  descriptionEn: z.string(),
  modules: z
    .array(
      z.object({
        titleFr: z.string(),
        titleEn: z.string(),
        focus: z.string().describe("Comma-separated precise learning outcomes and topics covered in this module, in English"),
        advanced: z.boolean().describe("true for advanced-level modules"),
      }),
    )
    .min(4)
    .max(9),
})

/** Professional syllabus for a course the admin names; the AI tutor teaches from it. */
export async function generateAiSyllabus(input: { name: string; kind: AiTrackKind; level: NonNullable<AiTrack["level"]>; notes?: string }) {
  const { object } = await generateObject({
    model: google(AI_MODEL),
    schema: syllabusSchema,
    temperature: 0.4,
    prompt: `You are the head of curriculum at Linko Academy, a professional online academy certified by LinkoPayroll.
Design a rigorous, industry-grade syllabus for a self-paced course taught one-to-one by an AI tutor.

Course name requested by the administrator: "${input.name}"
Type: ${input.kind === "language" ? "spoken language" : input.kind === "programming" ? "programming language / technology" : "professional skill"}
Level: ${input.level}
${input.notes ? `Administrator notes: ${input.notes}` : ""}

Requirements:
- 5 to 7 modules in a logical progression, from foundations to an applied capstone project or real-world scenario in the last module.${input.kind === "programming" ? `
- Then add 2 or 3 ADVANCED modules (advanced: true) at the end: expert topics (internals, performance, concurrency, architecture, testing, security) and an advanced production-grade project. All other modules have advanced: false.` : `
- Set advanced: true only on modules that are genuinely expert level.`}
- Module titles are concise and professional (no emojis, no numbering).
- Each "focus" lists the concrete skills and topics of the module as they would appear in a university or corporate training syllabus. Follow current industry standards and best practices; never invent statistics, laws or facts.
- The description (2–3 sentences) states who the course is for and what the learner will be able to do at the end.
- Write French fields in natural professional French and English fields in natural professional English. Keep the course name close to what the administrator asked for.`,
  })
  return object
}

const examSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string(),
        options: z.array(z.string()).length(4),
        answerIndex: z.number().int().min(0).max(3),
      }),
    )
    .min(10)
    .max(15),
})

/** Final certification exam of an AI course, generated once so every learner gets the same test. */
export async function getOrCreateAiExam(track: AiTrack): Promise<ExamDoc | null> {
  const col = await exams()
  const key = aiCertKey(track.slug)
  const existing = await col.findOne({ formationSlug: key })
  if (existing?.questions.length) return existing
  if (!isAiConfigured()) return null

  const { object } = await generateObject({
    model: google(AI_MODEL),
    schema: examSchema,
    temperature: 0.3,
    prompt: `Write a 12-question multiple-choice final certification exam for the Linko Academy course "${track.name.en}".
${track.description ? `Course description: ${track.description.en}` : ""}
Modules:
${track.modules.map((m, i) => `${i + 1}. ${m.title.en} — ${m.focus}`).join("\n")}

Cover every module. Each question has exactly 4 plausible options and one unambiguous correct answer.
Test applied understanding (scenarios, code reading, usage in context), not trivia. ${track.kind === "language" ? `Questions may quote words or phrases in ${track.name.en}; only use forms you are certain are correct.` : ""}
Write the questions in English, professional and precise.`,
  })

  const doc: ExamDoc = {
    formationSlug: key,
    questions: object.questions.map((q) => ({ id: randomUUID(), ...q })),
    passScore: EXAM_PASS_SCORE,
    source: "ai",
    updatedAt: new Date(),
  }
  await col.updateOne({ formationSlug: key }, { $set: doc }, { upsert: true })
  return doc
}
