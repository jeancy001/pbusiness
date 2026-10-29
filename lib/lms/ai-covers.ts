import "server-only"
import { Binary } from "mongodb"

import { getDb } from "@/lib/db/mongodb"
import { isAiConfigured } from "@/lib/ai/config"
import { isStorageConfigured, uploadMedia } from "@/lib/storage/supabase"
import { AI_COVER_STYLE, type AiTrack } from "@/lib/lms/catalog"
import { coverPrompt } from "@/lib/lms/cover-prompt"

// Cover pictures for Linko Academy courses, generated once per course from
// its subject with Gemini's image model. Stored in Supabase (public media
// bucket) when configured, otherwise in MongoDB, and served by
// /api/academy/cover/[slug].

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image"

/** `style` records which prompt made the cover; covers in an older style are regenerated. */
type CoverDoc = { slug: string; url?: string; data?: Binary; mimeType: string; style?: string; createdAt: Date }

async function covers() {
  return (await getDb()).collection<CoverDoc>("ai_track_covers")
}

export async function getStoredCover(slug: string) {
  return (await covers()).findOne({ slug })
}

/** Covers are shown at card size: a 1200px WebP is ~10× lighter than the raw image. */
async function compress(input: Buffer, mimeType: string) {
  try {
    const sharp = (await import("sharp")).default
    const bytes = await sharp(input).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer()
    return { bytes, mimeType: "image/webp" }
  } catch {
    return { bytes: input, mimeType }
  }
}

const inFlight = new Map<string, Promise<CoverDoc | null>>()

/** Returns the stored cover, generating it on first request (concurrent requests share one generation). */
export function ensureCover(track: AiTrack): Promise<CoverDoc | null> {
  const running = inFlight.get(track.slug)
  if (running) return running
  const job = (async () => {
    const existing = await getStoredCover(track.slug)
    if (existing?.style === AI_COVER_STYLE) return existing
    // Older-style covers keep showing until their replacement is ready.
    if (!isAiConfigured()) return existing

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: coverPrompt(track) }] }],
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
      console.error(`Cover generation failed (${track.slug}): ${json?.error?.message ?? res.status}`)
      return existing
    }

    const { bytes, mimeType } = await compress(Buffer.from(image.data, "base64"), image.mimeType)
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg"
    const doc: CoverDoc = isStorageConfigured()
      ? { slug: track.slug, url: await uploadMedia(`academy/covers/${track.slug}-${Date.now()}.${ext}`, bytes, mimeType), mimeType, style: AI_COVER_STYLE, createdAt: new Date() }
      : { slug: track.slug, data: new Binary(bytes), mimeType, style: AI_COVER_STYLE, createdAt: new Date() }
    await (await covers()).replaceOne({ slug: track.slug }, doc, { upsert: true })
    return doc
  })().finally(() => inFlight.delete(track.slug))
  inFlight.set(track.slug, job)
  return job
}

/** Admin: drop a cover so the next request generates a new one. */
export async function resetCover(slug: string) {
  await (await covers()).deleteOne({ slug })
}
