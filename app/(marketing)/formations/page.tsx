import type { Metadata } from "next"
import { FormationsBrowser } from "@/components/formations/formations-browser"
import { getAvailableFormations } from "@/lib/data/catalog"
import { listAiTracks } from "@/lib/lms/ai-tracks"
import { getPublicEvents } from "@/lib/events/data"

export const metadata: Metadata = {
  title: "Formations",
}

export default async function FormationsPage() {
  const [formations, events, academy] = await Promise.all([getAvailableFormations(), getPublicEvents(), listAiTracks()])
  return <FormationsBrowser formations={formations} events={events} academy={academy} />
}
