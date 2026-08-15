import { Hero } from "@/components/home/hero"
import { FormationsPreview } from "@/components/home/formations-preview"
import { Solutions } from "@/components/home/solutions"
import { Features } from "@/components/home/features"
import { ServicesPreview } from "@/components/home/services-preview"
import { Recommendations } from "@/components/ai/recommendations"
import { CtaSection } from "@/components/home/cta"
import { getAllFormations } from "@/lib/data/catalog"

export default async function HomePage() {
  const formations = await getAllFormations()

  return (
    <>
      <Hero />
      <FormationsPreview formations={formations} />
      <Solutions />
      <Features />
      <ServicesPreview />
      <Recommendations formations={formations} />
      <CtaSection />
    </>
  )
}
