"use client"

import { Award, ClipboardCheck, PlayCircle, Video } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { CERTIFICATE_PRICE_USD, CERTIFIER_NAME, EXAM_PASS_SCORE } from "@/lib/lms/catalog"
import { SectionHeading } from "@/components/site/section-heading"

export function LearningPath() {
  const { locale } = useI18n()
  const fr = locale === "fr"

  const steps = [
    {
      icon: PlayCircle,
      title: fr ? "Apprenez" : "Learn",
      body: fr ? "Vidéos et leçons écrites par des formateurs, à votre rythme." : "Video and written lessons from real teachers, at your pace.",
    },
    {
      icon: Video,
      title: fr ? "Pratiquez en direct" : "Practise live",
      body: fr ? "Cours live avec webcam, directement sur la plateforme." : "Live webcam classes, right inside the platform.",
    },
    {
      icon: ClipboardCheck,
      title: fr ? "Passez l'examen" : "Pass the exam",
      body: fr ? `Un examen final, réussi à partir de ${EXAM_PASS_SCORE} %.` : `A final exam, passed from ${EXAM_PASS_SCORE}%.`,
    },
    {
      icon: Award,
      title: fr ? "Soyez certifié" : "Get certified",
      body: fr
        ? `Certificat ${CERTIFIER_NAME} vérifiable — $${CERTIFICATE_PRICE_USD}, payé en monnaie locale.`
        : `A verifiable ${CERTIFIER_NAME} certificate — $${CERTIFICATE_PRICE_USD}, paid in local currency.`,
    },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        align="center"
        eyebrow={fr ? "Parcours certifiant" : "Certification path"}
        title={fr ? "De la première leçon au certificat" : "From first lesson to certificate"}
        subtitle={
          fr
            ? "Un parcours clair, suivi par votre formateur et visible dans votre tableau de bord."
            : "A clear path, followed by your teacher and visible in your dashboard."
        }
      />

      <ol className="relative mt-14 grid gap-6 md:grid-cols-4">
        <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-border md:block" />
        {steps.map((step, i) => (
          <li key={step.title} className="relative text-center">
            <span className="relative mx-auto flex size-12 items-center justify-center rounded-full border border-border bg-card text-[#064E3B] shadow-sm dark:text-emerald-400">
              <step.icon className="size-5" />
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#064E3B] text-[10px] font-bold text-white dark:bg-emerald-600">
                {i + 1}
              </span>
            </span>
            <h3 className="mt-4 font-heading font-semibold">{step.title}</h3>
            <p className="mx-auto mt-1.5 max-w-[15rem] text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
