"use client"

import {
  GraduationCap,
  Award,
  Code2,
  ShieldCheck,
  Sparkles,
  Headset,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

const features = [
  { icon: GraduationCap, title: "feature.videos.title", desc: "feature.videos.desc" },
  { icon: Award, title: "feature.certificate.title", desc: "feature.certificate.desc" },
  { icon: Code2, title: "feature.sourceCode.title", desc: "feature.sourceCode.desc" },
  { icon: ShieldCheck, title: "feature.payments.title", desc: "feature.payments.desc" },
  { icon: Sparkles, title: "feature.ai.title", desc: "feature.ai.desc" },
  { icon: Headset, title: "feature.support.title", desc: "feature.support.desc" },
] as const

export function Features() {
  const { t } = useI18n()

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {t("section.why.title")}
        </h2>

        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-[#064E3B] dark:bg-emerald-500" />

        <p className="mt-3 text-pretty text-muted-foreground">
          {t("section.why.subtitle")}
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="
              group rounded-2xl border border-border bg-card p-6
              transition-all duration-200
              hover:-translate-y-0.5
              hover:border-[#064E3B]/30
              hover:shadow-md
              dark:hover:border-emerald-800
            "
          >
            <div
              className="
                flex size-11 items-center justify-center rounded-xl
                bg-[#064E3B]/10 text-[#064E3B]
                transition-all duration-200
                group-hover:bg-[#064E3B]
                group-hover:text-white
                dark:bg-emerald-950/50
                dark:text-emerald-400
                dark:group-hover:bg-emerald-800
                dark:group-hover:text-white
              "
            >
              <f.icon className="size-5" />
            </div>

            <h3
              className="
                mt-4 font-heading text-lg font-semibold
                transition-colors duration-200
                group-hover:text-[#064E3B]
                dark:group-hover:text-emerald-400
              "
            >
              {t(f.title)}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(f.desc)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}