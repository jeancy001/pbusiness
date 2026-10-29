import "server-only"
import { formations as bundledFormations, type Formation } from "@/lib/mock-data"

/**
 * The teacher who earns from a course sale, or undefined when the sale goes
 * 100% to the platform. Bundled starter courses and admin-created courses are
 * the platform's even when a teacher is assigned to teach them. Older stored
 * courses without `revenueOwner` keep paying their assigned teacher.
 */
export function courseEarner(formation: Pick<Formation, "slug" | "teacherId" | "revenueOwner">): string | undefined {
  if (!formation.teacherId) return undefined
  if (formation.revenueOwner) return formation.revenueOwner === "teacher" ? formation.teacherId : undefined
  return bundledFormations.some((b) => b.slug === formation.slug) ? undefined : formation.teacherId
}
