import "server-only"
import { isDbConfigured } from "@/lib/db/mongodb"
import { formations as formationsCol } from "@/lib/db/models"
import { lessons } from "@/lib/db/lms"
import { ratingSummaries } from "@/lib/lms/ratings"
import { certifiedTeacherIds } from "@/lib/teachers/badge"
import {
  formations as mockFormations,
  services as mockServices,
  type Formation,
} from "@/lib/mock-data"

// Catalog reads: MongoDB courses merged with the bundled starter catalog
// (a stored course with the same slug overrides the bundled one). Hidden
// courses are left out of the public catalog. Without a database, the
// bundled catalog is served so the preview always renders.

/** `teacherSuspended`: the teacher was suspended, so the course is off sale until reactivation. */
export type CatalogFormation = Formation & { hidden?: boolean; deleted?: boolean; teacherSuspended?: boolean }

/** Shown in the public catalog and open to new purchases. */
export function isOnSale(f: CatalogFormation) {
  return !f.hidden && !f.deleted && !f.teacherSuspended
}

async function merged(): Promise<CatalogFormation[]> {
  if (!isDbConfigured()) return mockFormations
  try {
    const docs = (await (await formationsCol()).find({}, { projection: { _id: 0 } }).toArray()) as CatalogFormation[]
    const stored = new Set(docs.map((d) => d.slug))
    // Deleted courses keep a tombstone so the bundled copy doesn't reappear.
    return [...docs.filter((d) => !d.deleted), ...mockFormations.filter((f) => !stored.has(f.slug))]
  } catch {
    return mockFormations
  }
}

/** Flags courses whose teacher holds the Certified Teacher badge. */
async function withBadges<T extends Formation>(list: T[]): Promise<T[]> {
  const certified = await certifiedTeacherIds(list.map((f) => f.teacherId).filter(Boolean) as string[]).catch(() => new Set<string>())
  return list.map((f) => ({ ...f, teacherCertified: Boolean(f.teacherId && certified.has(f.teacherId)) }))
}

/**
 * Public catalog (visible courses only), with live student ratings and
 * badges. Courses by certified teachers are listed first.
 */
export async function getAllFormations(): Promise<Formation[]> {
  const visible = await withBadges((await merged()).filter(isOnSale))
  const summaries = await ratingSummaries(visible.map((f) => `formation:${f.slug}` as const))
  const rated = visible.map((f) => {
    const r = summaries.get(`formation:${f.slug}`)
    return r ? { ...f, rating: r.avg, ratingCount: r.count } : { ...f, ratingCount: 0 }
  })
  return rated.sort((a, b) => Number(Boolean(b.teacherCertified)) - Number(Boolean(a.teacherCertified)))
}

/**
 * Courses promoted on the homepage and by the AI assistant: platform
 * courses and courses by certified teachers. Other teachers' courses
 * only appear in the full catalog.
 */
export async function getFeaturedFormations(): Promise<Formation[]> {
  return (await getAllFormations()).filter((f) => !f.teacherId || f.teacherCertified)
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
    const doc = (await col.findOne({ slug }, { projection: { _id: 0 } })) as CatalogFormation | null
    if (doc?.deleted) return null
    if (!doc) return mockFormations.find((f) => f.slug === slug) ?? null
    return (await withBadges([doc]))[0]
  } catch {
    return mockFormations.find((f) => f.slug === slug) ?? null
  }
}

export function getServices() {
  return mockServices
}
