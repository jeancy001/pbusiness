"use client"

import { Award, Bot, Smartphone, Video } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { CERTIFIER_NAME } from "@/lib/lms/catalog"
import { PBPayLogo } from "@/components/ui/pb-pay-logo"
import { CertificationPartner, LinkoAcademyLogo } from "@/components/brand/linko-academy-logo"

export function AuthAside() {
  const { locale } = useI18n()
  const fr = locale === "fr"

  const points = [
    { icon: Video, label: fr ? "Cours vidéo et classes live avec votre formateur" : "Video courses and live classes with your teacher" },
    { icon: Award, label: fr ? `Certificats ${CERTIFIER_NAME} vérifiables` : `Verifiable ${CERTIFIER_NAME} certificates` },
    { icon: Bot, label: fr ? "Tuteur pour les langues et la programmation" : "Tutor for languages and programming" },
    { icon: Smartphone, label: fr ? "Paiement Mobile Money dans votre devise" : "Mobile Money payments in your currency" },
  ]

  return (
    <aside className="relative hidden overflow-hidden bg-[#064E3B] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-emerald-300/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-emerald-200/10 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-white">
          <PBPayLogo className="size-7" />
        </span>
        <span className="leading-none">
          <span className="block font-display font-bold">P Business</span>
          <span className="text-xs tracking-wide text-emerald-100/70">ONLINE</span>
        </span>
      </div>

      <div className="relative max-w-md">
        <h2 className="text-balance font-heading text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
          {fr ? "Apprenez, certifiez-vous, construisez." : "Learn, get certified, build."}
        </h2>
        <ul className="mt-8 space-y-4">
          {points.map((p) => (
            <li key={p.label} className="flex items-center gap-3 text-emerald-50/90">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                <p.icon className="size-4 text-emerald-300" />
              </span>
              {p.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex flex-wrap items-center gap-6">
        <LinkoAcademyLogo tone="light" />
        <CertificationPartner tone="light" />
      </div>
    </aside>
  )
}
