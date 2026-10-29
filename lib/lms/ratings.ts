import "server-only"
import { getDb, isDbConfigured } from "@/lib/db/mongodb"

// Course ratings (1–5 stars): one per student per course, editable.
// Keys: "formation:<slug>" for regular courses, "ai:<slug>" for Linko Academy courses.

export type RatingKey = `formation:${string}` | `ai:${string}`
export type RatingSummary = { avg: number; count: number }

type RatingDoc = { key: RatingKey; userId: string; stars: number; createdAt: Date; updatedAt: Date }

let indexed = false
export async function ratings() {
  const col = (await getDb()).collection<RatingDoc>("course_ratings")
  if (!indexed) {
    await col.createIndex({ key: 1, userId: 1 }, { unique: true })
    indexed = true
  }
  return col
}

/** Average and count per course key (only keys that have ratings are returned). */
export async function ratingSummaries(keys: RatingKey[]): Promise<Map<string, RatingSummary>> {
  const map = new Map<string, RatingSummary>()
  if (!keys.length || !isDbConfigured()) return map
  try {
    const rows = await (await ratings())
      .aggregate<{ _id: string; avg: number; count: number }>([
        { $match: { key: { $in: keys } } },
        { $group: { _id: "$key", avg: { $avg: "$stars" }, count: { $sum: 1 } } },
      ])
      .toArray()
    for (const r of rows) map.set(r._id, { avg: Math.round(r.avg * 10) / 10, count: r.count })
  } catch {}
  return map
}

/** The stars a student already gave, by course key. */
export async function myRatings(userId: string): Promise<Record<string, number>> {
  if (!isDbConfigured()) return {}
  const rows = await (await ratings()).find({ userId }, { projection: { key: 1, stars: 1 } }).toArray()
  return Object.fromEntries(rows.map((r) => [r.key, r.stars]))
}
