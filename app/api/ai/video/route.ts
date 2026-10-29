import { createHash } from "crypto"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

import { getSession } from "@/lib/auth/session"
import { getDb, isDbConfigured } from "@/lib/db/mongodb"
import { AI_MODEL, isAiConfigured } from "@/lib/ai/config"
import { findAiModule, hasAiModuleAccess } from "@/lib/lms/ai-tracks"

// Two-minute explainer "videos" on demand: the AI writes a storyboard
// (8 scenes × ~15 s of narration, key points, code, an illustration each)
// and the browser plays it as a narrated slideshow. Storyboards are cached
// by module + language + topic, so each one is generated once.

export const maxDuration = 60

const DAILY_LIMIT = 10

const bodySchema = z.object({
  moduleSlug: z.string().max(60),
  locale: z.enum(["fr", "en", "tw", "gaa", "ee"]).default("en"),
  topic: z.string().trim().max(200).optional(),
})

const storyboardSchema = z.object({
  title: z.string(),
  scenes: z
    .array(
      z.object({
        heading: z.string().describe("Short slide heading, max 8 words"),
        narration: z.string().describe("Spoken narration for this scene, 35 to 45 words"),
        points: z.array(z.string()).max(3).describe("Up to 3 short on-screen key points, max 8 words each"),
        code: z.string().optional().describe("Optional short code snippet (max 10 lines) when the scene explains code"),
        visual: z.string().describe("Precise English description of an educational illustration for this scene"),
      }),
    )
    .min(7)
    .max(9),
})

export type Storyboard = z.infer<typeof storyboardSchema> & { lang: "fr" | "en" }

type CacheDoc = { hash: string; storyboard: Storyboard; userId: string; createdAt: Date }

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  const session = await getSession()
  const mod = parsed.success ? await findAiModule(parsed.data.moduleSlug) : null
  if (!parsed.success || !session || !mod) return Response.json({ error: "Not found" }, { status: 404 })
  if (!isAiConfigured() || !isDbConfigured()) return Response.json({ error: "Video explainers are not configured." }, { status: 503 })
  // Same rule as the tutor: the course must be paid for (admins excepted).
  if (!(await hasAiModuleAccess(session, mod.slug))) {
    return Response.json({ error: "Unlock this course to watch its videos." }, { status: 402 })
  }

  // Browser voices exist for French and English; Ghanaian locales are narrated in English.
  const lang = parsed.data.locale === "fr" ? "fr" : "en"
  const topic = parsed.data.topic || mod.title.en
  const cache = (await getDb()).collection<CacheDoc>("ai_videos")
  const hash = createHash("sha256").update(`${mod.slug}|${lang}|${topic.toLowerCase()}`).digest("hex")
  const hit = await cache.findOne({ hash })
  if (hit) return Response.json({ storyboard: hit.storyboard })

  const today = await cache.countDocuments({ userId: session.userId, createdAt: { $gte: new Date(Date.now() - 86_400_000) } })
  if (today >= DAILY_LIMIT) return Response.json({ error: "Daily video limit reached. Try again tomorrow." }, { status: 429 })

  try {
    const { object } = await generateObject({
      model: google(AI_MODEL),
      schema: storyboardSchema,
      temperature: 0.4,
      prompt: `You are an expert instructional designer at Linko Academy producing a 2-minute explainer video.
Course: ${mod.track.name.en} — module ${mod.index}: "${mod.title.en}" (${mod.track.modules[mod.index - 1]?.advanced ? "advanced level" : "core level"}).
Module focus: ${mod.focus}.
What the learner asked to have explained: "${topic}".

Write a storyboard of 8 scenes (about 15 seconds each, 2 minutes total):
1. Hook: why this matters in real work.
2–6. Explain the idea step by step, one concept per scene, with a concrete example${mod.track.kind === "programming" ? " and a short runnable code snippet where it helps" : ""}.
7. A common mistake and how to avoid it.
8. Recap of the key takeaways and what to practise next.

Narration is spoken aloud: natural, warm, professional, no markdown, no lists, no emojis; never read code character by character — describe what it does.
Be accurate and current; never invent facts.
Write title, headings, narration and points in ${lang === "fr" ? "French" : "English"}; code and visual descriptions in English.`,
    })
    const storyboard: Storyboard = { ...object, lang }
    await cache.updateOne({ hash }, { $setOnInsert: { hash, storyboard, userId: session.userId, createdAt: new Date() } }, { upsert: true })
    return Response.json({ storyboard })
  } catch (error) {
    console.error(`Video storyboard failed: ${String((error as Error)?.message ?? error).slice(0, 200)}`)
    return Response.json({ error: "The video could not be generated. Please try again." }, { status: 502 })
  }
}
