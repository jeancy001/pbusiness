import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { formations as mockFormations } from "@/lib/mock-data"
import { getFormationBySlug } from "@/lib/data/catalog"
import { FormationDetail } from "@/components/formations/formation-detail"

// Seed known slugs from bundled data; DB-only slugs still render dynamically.
export function generateStaticParams() {
  return mockFormations.map((f) => ({ slug: f.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const formation = await getFormationBySlug(slug)
  return { title: formation ? formation.title.fr : "Formation" }
}

export default async function FormationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const formation = await getFormationBySlug(slug)
  if (!formation) notFound()
  return <FormationDetail formation={formation} />
}
