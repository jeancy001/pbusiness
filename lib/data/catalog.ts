import "server-only"
import { isDbConfigured } from "@/lib/db/mongodb"
import { formations as formationsCol } from "@/lib/db/models"
import {
  formations as mockFormations,
  services as mockServices,
  type Formation,
} from "@/lib/mock-data"

// Catalog reads: use MongoDB when configured, otherwise fall back to the
// bundled seed data so the preview always renders.

export async function getAllFormations(): Promise<Formation[]> {
  if (!isDbConfigured()) return mockFormations
  try {
    const col = await formationsCol()
    const docs = await col.find({}, { projection: { _id: 0 } }).toArray()
    return docs.length ? (docs as Formation[]) : mockFormations
  } catch {
    return mockFormations
  }
}

export async function getFormationBySlug(slug: string): Promise<Formation | null> {
  if (!isDbConfigured()) {
    return mockFormations.find((f) => f.slug === slug) ?? null
  }
  try {
    const col = await formationsCol()
    const doc = await col.findOne({ slug }, { projection: { _id: 0 } })
    return (doc as Formation) ?? mockFormations.find((f) => f.slug === slug) ?? null
  } catch {
    return mockFormations.find((f) => f.slug === slug) ?? null
  }
}

export function getServices() {
  return mockServices
}
