"use client"

import Link from "next/link"
import { ArrowRight, Award, Bot, Briefcase, Code2, Languages } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/mock-data"
import { AI_COURSE_PRICE_USD, type AiTrack } from "@/lib/lms/catalog"
import { TrackCover } from "@/components/lms/track-cover"
import { RatingSummary } from "@/components/lms/stars"

const KIND = {
  language: { icon: Languages, fr: "Langue", en: "Language" },
  programming: { icon: Code2, fr: "Programmation", en: "Programming" },
  skills: { icon: Briefcase, fr: "Compétence pro", en: "Professional skill" },
}

/** Linko Academy course shown in the catalog; opens the Academy where it is bought and taught by the Tutor. */
export function AcademyCourseCard({ track }: { track: AiTrack }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const kind = KIND[track.kind]
  const advanced = track.modules.filter((m) => m.advanced).length

  return (
    <Link
      href="/academy"
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-[#064E3B]/40 hover:shadow-lg"
    >
      <div className="relative">
        <TrackCover track={track} className="aspect-[16/9] transition-transform duration-500 group-hover:scale-[1.02]" />
        <span className="absolute left-3 top-3 rounded-full bg-[#064E3B]/85 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur">Linko Academy</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#064E3B] dark:text-emerald-400">
          <kind.icon className="size-3.5" />
          {fr ? kind.fr : kind.en}
        </p>
        <h3 className="mt-1 font-heading text-lg font-semibold">{localize(track.name, locale)}</h3>
        <RatingSummary rating={track.rating ?? 5} count={track.ratingCount} className="mt-1" />
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {track.description
            ? localize(track.description, locale)
            : track.modules.map((m) => localize(m.title, locale)).slice(0, 3).join(" · ")}
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1">
            <Bot className="size-3.5" />
            {track.modules.length} modules{advanced ? ` · ${advanced} ${fr ? "avancés" : "advanced"}` : ""}
          </li>
          <li className="flex items-center gap-1">
            <Award className="size-3.5" />
            {fr ? "Certificat inclus" : "Certificate included"}
          </li>
        </ul>
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="font-heading text-xl font-bold">${AI_COURSE_PRICE_USD}</span>
          <span className="flex items-center gap-1 text-sm font-medium text-[#064E3B] group-hover:underline dark:text-emerald-400">
            {fr ? "Commencer avec le Tuteur" : "Start with the Tutor"}
            <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}
