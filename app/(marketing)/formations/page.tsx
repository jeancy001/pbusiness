import type { Metadata } from "next"
import { FormationsBrowser } from "@/components/formations/formations-browser"
import { getAllFormations } from "@/lib/data/catalog"

export const metadata: Metadata = {
  title: "Formations",
}

export default async function FormationsPage() {
  const formations = await getAllFormations()
  return <FormationsBrowser formations={formations} />
}
