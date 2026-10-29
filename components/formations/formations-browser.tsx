"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Award,
  Bot,
  Code2,
  GraduationCap,
  Languages,
  PlayCircle,
  Search,
  SlidersHorizontal,
  Video,
  X,
} from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import {
  formations as mockFormations,
  categoryLabels,
  localize,
  type Formation,
  type FormationCategory,
  type Level,
} from "@/lib/mock-data"
import { AI_COURSE_PRICE_USD, CERTIFICATE_PRICE_USD, CERTIFIER_NAME, type AiTrack } from "@/lib/lms/catalog"

import { FormationCard } from "@/components/formations/formation-card"
import { EventCard } from "@/components/events/event-card"
import { AcademyCourseCard } from "@/components/formations/academy-course-card"
import type { EventView } from "@/lib/events/data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { trainings as freeTracks } from "@/lib/free-course/content"

// ============================================================
// CONSTANTS
// ============================================================

const levels: Level[] = ["beginner", "intermediate", "advanced"]

// ============================================================
// COMPONENT
// ============================================================

export function FormationsBrowser({
  formations = mockFormations,
  events = [],
  academy = [],
}: {
  formations?: Formation[]
  events?: EventView[]
  /** Linko Academy courses: shown in the catalog whenever no regular course is available or matches. */
  academy?: AiTrack[]
}) {
  const { t, locale } = useI18n()
  const fr = locale === "fr"

  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<FormationCategory | "all">("all")
  const [level, setLevel] = useState<Level | "all">("all")

  const usedCategories = useMemo(() => Array.from(new Set(formations.map((f) => f.category))), [formations])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return formations.filter((f) => {
      if (category !== "all" && f.category !== category) return false
      if (level !== "all" && f.level !== level) return false
      if (!q) return true
      return [localize(f.title, locale), localize(f.summary, locale), f.teacherName ?? ""].join(" ").toLowerCase().includes(q)
    })
  }, [query, category, level, locale, formations])

  const hasFilters = query || category !== "all" || level !== "all"
  const noCourses = formations.length === 0
  // When filters match nothing, suggest Academy courses that match the search text (or all of them).
  const academyMatches = useMemo(() => {
    const q = query.toLowerCase().trim()
    const hits = q ? academy.filter((tr) => [localize(tr.name, locale), tr.badge, tr.kind].join(" ").toLowerCase().includes(q)) : []
    return hits.length ? hits : academy
  }, [academy, query, locale])
  const totalLearners = formations.reduce((sum, f) => sum + f.studentsCount, 0)

  const pillars = [
    {
      icon: PlayCircle,
      title: fr ? "Vidéos & leçons écrites" : "Video & written lessons",
      body: fr ? "Des cours structurés, à suivre à votre rythme." : "Structured courses you follow at your own pace.",
    },
    {
      icon: Video,
      title: fr ? "Cours live avec webcam" : "Live classes on webcam",
      body: fr ? "Visio intégrée au navigateur, présence suivie." : "Video built into the browser, attendance tracked.",
    },
    {
      icon: Award,
      title: fr ? `Certification ${CERTIFIER_NAME}` : `${CERTIFIER_NAME} certification`,
      body: fr
        ? `Examen final puis certificat vérifiable — $${CERTIFICATE_PRICE_USD}.`
        : `Final exam, then a verifiable certificate — $${CERTIFICATE_PRICE_USD}.`,
    },
    {
      icon: Bot,
      title: fr ? "Tuteur personnel" : "Personal tutor",
      body: fr
        ? `Langues ghanéennes & programmation — $${AI_COURSE_PRICE_USD}/cours.`
        : `Ghanaian languages & programming — $${AI_COURSE_PRICE_USD}/course.`,
    },
  ]

  return (
    <div>
      {/* ===================================================
          HERO
      ==================================================== */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-[#064E3B]/[0.06] to-transparent dark:from-emerald-950/30">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 pt-14 md:pb-16 md:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#064E3B]/15 bg-card px-3 py-1 text-xs font-medium text-[#064E3B] dark:border-emerald-800 dark:text-emerald-400">
            <GraduationCap className="size-3.5" />
            {fr ? "Formations certifiantes" : "Certified courses"}
          </p>
          <h1 className="mt-5 max-w-3xl text-balance font-heading text-4xl font-bold tracking-tight md:text-5xl">
            {t("section.formations.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">{t("section.formations.subtitle")}</p>

          <div className="mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-[#064E3B]/50 focus-within:ring-4 focus-within:ring-[#064E3B]/10">
            <Search className="ml-2 size-5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={fr ? "Rechercher une formation, un formateur…" : "Search a course or a teacher…"}
              aria-label={t("common.search")}
              className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <Button
              className="h-10 rounded-xl bg-[#064E3B] px-5 text-white hover:bg-[#053D2E]"
              render={<a href="#catalog" />}
            >
              {t("common.search")}
            </Button>
          </div>

          <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-6">
            {[
              { value: formations.length + academy.length, label: fr ? "Formations" : "Courses" },
              { value: totalLearners.toLocaleString(fr ? "fr-FR" : "en-GB"), label: fr ? "Apprenants" : "Learners" },
              { value: "5", label: fr ? "Langues" : "Languages" },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
                <dd className="mt-1 font-heading text-2xl font-bold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ===================================================
          PILLARS
      ==================================================== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <li key={p.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#064E3B]/10 text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-400">
                <p.icon className="size-5" />
              </span>
              <p className="mt-4 font-medium">{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ===================================================
          CATALOG
      ==================================================== */}
      <section id="catalog" className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8 pb-16">
        {noCourses ? (
          <AcademyCatalog tracks={academy} fr={fr} />
        ) : (
        <>
        <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 [mask-image:linear-gradient(to_right,black_90%,transparent)] lg:pb-0 lg:pr-8">
              <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
                {t("common.all")}
              </FilterChip>
              {usedCategories.map((c) => (
                <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {localize(categoryLabels[c], locale)}
                </FilterChip>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
                {(["all", ...levels] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                      level === l ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {l === "all" ? t("common.all") : t(`common.${l}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span>{" "}
            {fr ? (filtered.length > 1 ? "formations" : "formation") : filtered.length === 1 ? "course" : "courses"}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setCategory("all")
                setLevel("all")
              }}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#064E3B] hover:underline dark:text-emerald-400"
            >
              <X className="size-3.5" />
              {fr ? "Réinitialiser" : "Clear filters"}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <>
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Search className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">
                {fr ? "Aucune formation ne correspond à votre recherche." : "No courses match your search."}
              </p>
            </div>
            {academy.length > 0 && (
              <div className="mt-10">
                <AcademyCatalog tracks={academyMatches} fr={fr} suggestion />
              </div>
            )}
          </>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((f) => (
              <FormationCard key={f.id} formation={f} />
            ))}
          </div>
        )}
        </>
        )}
      </section>

      {/* ===================================================
          FREE TRAINING
      ==================================================== */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <SectionHeading
            eyebrow={fr ? "Gratuit" : "Free"}
            title={fr ? "Formation gratuite : HTML & CSS" : "Free course: HTML & CSS"}
            body={
              fr
                ? "Du premier tag aux techniques avancées, sur une seule page, avec un éditeur en direct et le Tuteur."
                : "From your first tag to advanced techniques, on one page, with a live editor and the Tutor."
            }
          />
          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-stretch">
            {freeTracks.map((tr) => (
              <Link
                key={tr.id}
                href={`/free-course#${tr.id}-title`}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-[#064E3B]/40"
              >
                <p className="font-mono text-xs font-semibold uppercase text-[#064E3B] dark:text-emerald-400">{tr.category}</p>
                <h3 className="mt-1 font-heading text-lg font-semibold">{tr.title[fr ? "fr" : "en"]}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tr.modules.length} modules · {tr.lessonsCount} {fr ? "leçons" : "lessons"} · {fr ? "avancé inclus" : "advanced included"}
                </p>
              </Link>
            ))}
            <Button size="lg" className="h-auto min-h-12 bg-[#064E3B] text-white hover:bg-[#053D2E]" render={<Link href="/free-course" />}>
              {fr ? "Commencer gratuitement" : "Start for free"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ===================================================
          EVENT
      ==================================================== */}
      {events.length > 0 && (
        <section className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8">
          {events.map((e) => (
            <EventCard key={e.slug} event={e} />
          ))}
        </section>
      )}

      {/* ===================================================
          AI ACADEMY CTA
      ==================================================== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-border bg-card p-8 md:grid-cols-[1.4fr_1fr] md:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#064E3B] dark:text-emerald-400">{t("nav.academy")}</p>
            <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight">
              {fr ? "Parlez Twi, Ga ou Ewe. Codez en Python." : "Speak Twi, Ga or Ewe. Code in Python."}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {fr
                ? "Un tuteur qui explique, fait pratiquer et corrige — module par module."
                : "A tutor that explains, drills and corrects you — one module at a time."}
            </p>
            <Button className="mt-6 bg-[#064E3B] text-white hover:bg-[#053D2E]" render={<Link href="/academy" />}>
              {fr ? "Explorer l'Académie IA" : "Explore the AI Academy"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {[
              { icon: Languages, label: "Twi · Ga · Ewe" },
              { icon: Languages, label: fr ? "Français · Anglais" : "French · English" },
              { icon: Code2, label: "Python · JavaScript" },
              { icon: Code2, label: "TypeScript · Java · SQL" },
            ].map((x) => (
              <li key={x.label} className="flex items-center gap-2 rounded-xl border border-border px-3 py-3">
                <x.icon className="size-4 shrink-0 text-[#064E3B] dark:text-emerald-400" />
                {x.label}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

// ============================================================
// PIECES
// ============================================================

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#064E3B] dark:text-emerald-400">{eyebrow}</p>
      <h2 className="mt-2 text-balance font-heading text-3xl font-bold tracking-tight">{title}</h2>
      <p className="mt-3 text-muted-foreground">{body}</p>
    </div>
  )
}

/** Linko Academy courses, shown in place of the catalog when no regular course is available. */
function AcademyCatalog({ tracks, fr, suggestion }: { tracks: AiTrack[]; fr: boolean; suggestion?: boolean }) {
  if (!tracks.length) return null
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#064E3B] dark:text-emerald-400">Linko Academy</p>
          <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight">
            {suggestion
              ? fr ? "Essayez plutôt un cours Linko Academy" : "Try a Linko Academy course instead"
              : fr ? "Commencez dès aujourd'hui avec Linko Academy" : "Start today with Linko Academy"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {fr
              ? "Disponibles immédiatement, à votre rythme avec le Tuteur, et certifiés à la fin."
              : "Available right away, at your own pace with the Tutor, and certified at the end."}
          </p>
        </div>
        <Link href="/academy" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[#064E3B] hover:underline dark:text-emerald-400">
          {fr ? "Tout voir" : "See all"}
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.slice(0, suggestion ? 6 : 12).map((tr) => (
          <AcademyCourseCard key={tr.slug} track={tr} />
        ))}
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-[#064E3B] bg-[#064E3B] text-white shadow-sm dark:border-emerald-600 dark:bg-emerald-700"
          : "border-border bg-card text-muted-foreground hover:border-[#064E3B]/40 hover:text-[#064E3B] dark:hover:text-emerald-400",
      )}
    >
      {children}
    </button>
  )
}
