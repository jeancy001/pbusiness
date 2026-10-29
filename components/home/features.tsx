"use client"

import { Award, Code2, GraduationCap, Headset, ShieldCheck, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { SectionHeading } from "@/components/site/section-heading"

const features = [
  { icon: GraduationCap, title: "feature.videos.title", desc: "feature.videos.desc" },
  { icon: Award, title: "feature.certificate.title", desc: "feature.certificate.desc" },
  { icon: Code2, title: "feature.sourceCode.title", desc: "feature.sourceCode.desc" },
  { icon: ShieldCheck, title: "feature.payments.title", desc: "feature.payments.desc" },
  { icon: Sparkles, title: "feature.ai.title", desc: "feature.ai.desc" },
  { icon: Headset, title: "feature.support.title", desc: "feature.support.desc" },
] as const

export function Features() {
  const { t, locale } = useI18n()

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        align="center"
        eyebrow={locale === "fr" ? "Pourquoi nous" : "Why us"}
        title={t("section.why.title")}
        subtitle={t("section.why.subtitle")}
      />
      <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#064E3B] text-white shadow-sm dark:bg-emerald-700">
              <f.icon className="size-5" />
            </span>
            <div>
              <h3 className="font-heading font-semibold">{t(f.title)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(f.desc)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
