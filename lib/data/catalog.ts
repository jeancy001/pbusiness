import "server-only"
import { isDbConfigured } from "@/lib/db/mongodb"
import { formations as formationsCol } from "@/lib/db/models"
import { lessons } from "@/lib/db/lms"
import { ratingSummaries } from "@/lib/lms/ratings"
import {
  formations as mockFormations,
  services as mockServices,
  type Formation,
} from "@/lib/mock-data"

// Catalog reads: MongoDB courses merged with the bundled starter catalog
// (a stored course with the same slug overrides the bundled one). Hidden
// courses are left out of the public catalog. Without a database, the
// bundled catalog is served so the preview always renders.

export type CatalogFormation = Formation & { hidden?: boolean }

async function merged(): Promise<CatalogFormation[]> {
  if (!isDbConfigured()) return mockFormations
  try {
    const docs = (await (await formationsCol()).find({}, { projection: { _id: 0 } }).toArray()) as CatalogFormation[]
    const stored = new Set(docs.map((d) => d.slug))
    return [...docs, ...mockFormations.filter((f) => !stored.has(f.slug))]
  } catch {
    return mockFormations
  }
}

/** Public catalog (visible courses only), with live student ratings. */
export async function getAllFormations(): Promise<Formation[]> {
  const visible = (await merged()).filter((f) => !f.hidden)
  const summaries = await ratingSummaries(visible.map((f) => `formation:${f.slug}` as const))
  return visible.map((f) => {
    const r = summaries.get(`formation:${f.slug}`)
    return r ? { ...f, rating: r.avg, ratingCount: r.count } : { ...f, ratingCount: 0 }
  })
}

/**
 * Courses a student can actually follow today: visible and with at least one
 * lesson. Others appear automatically once their teacher publishes content.
 * Without a database (preview) the bundled catalog counts as available.
 */
export async function getAvailableFormations(): Promise<Formation[]> {
  const visible = await getAllFormations()
  if (!isDbConfigured()) return visible
  try {
    const withLessons = new Set<string>(await (await lessons()).distinct("formationSlug"))
    return visible.filter((f) => withLessons.has(f.slug))
  } catch {
    return visible
  }
}

/** Admin view: every course, including hidden ones. */
export async function getCatalogForAdmin(): Promise<CatalogFormation[]> {
  return merged()
}

export async function getFormationBySlug(slug: string): Promise<CatalogFormation | null> {
  if (!isDbConfigured()) {
    return mockFormations.find((f) => f.slug === slug) ?? null
  }
  try {
    const col = await formationsCol()
    const doc = await col.findOne({ slug }, { projection: { _id: 0 } })
    return (doc as CatalogFormation) ?? mockFormations.find((f) => f.slug === slug) ?? null
  } catch {
    return mockFormations.find((f) => f.slug === slug) ?? null
  }
}

export function getServices() {
  return mockServices
}
