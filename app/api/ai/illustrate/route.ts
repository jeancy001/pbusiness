import { createHash } from "crypto"
import { z } from "zod"

import { getSession } from "@/lib/auth/session"
import { isDbConfigured } from "@/lib/db/mongodb"
import { getDb } from "@/lib/db/mongodb"
import { isAiConfigured } from "@/lib/ai/config"
import { findAiModule, hasAiModuleAccess } from "@/lib/lms/ai-tracks"
import { isStorageConfigured, uploadMedia } from "@/lib/storage/supabase"

// Educational illustrations requested by the AI tutor ([[illustration: …]]).
// Generated with Gemini's image model, stored in Supabase Storage (public
// media bucket) and cached by prompt so each image is generated once.

export const maxDuration = 60

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image"
const DAILY_LIMIT = 30

const schema = z.object({ prompt: z.string().trim().min(3).max(400), moduleSlug: z.string().max(60) })

type CacheDoc = { hash: string; url: string; prompt: string; userId: string; createdAt: Date }

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  const session = await getSession()
  const mod = parsed.success ? await findAiModule(parsed.data.moduleSlug) : null
  if (!parsed.success || !session || !mod) return Response.json({ error: "Not found" }, { status: 404 })
  if (!isAiConfigured() || !isDbConfigured()) return Response.json({ error: "Unavailable" }, { status: 503 })

  if (!(await hasAiModuleAccess(session, mod.slug))) return Response.json({ error: "Forbidden" }, { status: 403 })

  const cache = (await getDb()).collection<CacheDoc>("ai_images")
  const hash = createHash("sha256").update(`${mod.track.slug}|${parsed.data.prompt.toLowerCase()}`).digest("hex")
  const hit = await cache.findOne({ hash })
  if (hit) return Response.json({ url: hit.url })

  const today = await cache.countDocuments({ userId: session.userId, createdAt: { $gte: new Date(Date.now() - 86_400_000) } })
  if (today >= DAILY_LIMIT) return Response.json({ error: "Daily illustration limit reached" }, { status: 429 })

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Clean, professional educational illustration for an online ${mod.track.kind === "programming" ? "programming" : mod.track.kind === "skills" ? "professional training" : "language"} course (${mod.track.name.en}). ${parsed.data.prompt}. Flat modern vector style, friendly, high contrast, light background, accurate and culturally respectful (West African context where people appear). No watermark. Avoid text unless it is a short label that is essential.`,
              },
            ],
          },
        ],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } },
      }),
      signal: AbortSignal.timeout(55_000),
    },
  )
  const json = (await res.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[]
    error?: { message?: string }
  } | null
  const image = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData
  if (!image) {
    console.error(`Illustration failed: ${json?.error?.message ?? res.status}`)
    return Response.json({ error: "Generation failed" }, { status: 502 })
  }

  const ext = image.mimeType.includes("png") ? "png" : image.mimeType.includes("webp") ? "webp" : "jpg"
  const inline = `data:${image.mimeType};base64,${image.data}` // without Supabase (or if the upload fails), served inline
  const url = isStorageConfigured()
    ? await uploadMedia(`ai/${mod.track.slug}/${hash}.${ext}`, Buffer.from(image.data, "base64"), image.mimeType).catch((error) => {
        console.error(`Illustration upload failed, serving inline: ${String(error?.message ?? error).slice(0, 160)}`)
        return inline
      })
    : inline

  await cache.updateOne({ hash }, { $setOnInsert: { hash, url, prompt: parsed.data.prompt, userId: session.userId, createdAt: new Date() } }, { upsert: true })
  return Response.json({ url })
}
