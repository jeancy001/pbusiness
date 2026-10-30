import { Hero } from "@/components/home/hero"
import { FormationsPreview } from "@/components/home/formations-preview"
import { LearningPath } from "@/components/home/learning-path"
import { Solutions } from "@/components/home/solutions"
import { Features } from "@/components/home/features"
import { ServicesPreview } from "@/components/home/services-preview"
import { LinkoPayBand } from "@/components/home/linko-pay-band"
import { CtaSection } from "@/components/home/cta"
import { getFeaturedFormations } from "@/lib/data/catalog"

export default async function HomePage() {
  const formations = await getFeaturedFormations()

  return (
    <>
      <Hero />
      <FormationsPreview formations={formations} />
      <LearningPath />
      <Solutions />
      <Features />
      <ServicesPreview />
      <LinkoPayBand />
      <CtaSection />
    </>
  )
}
