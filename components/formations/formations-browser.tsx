"use client"

import { useMemo, useState } from "react"

import {
  ArrowRight,
  CalendarDays,
  Code2,
  MapPin,
  Smartphone,
  Ticket,
  Users,
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

import { FormationCard } from "@/components/formations/formation-card"
import { CheckoutDialog } from "@/components/payments/checkout-dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { cn } from "@/lib/utils"
import { TrainingBrowser } from "./training-browser"

// ============================================================
// CONSTANTS
// ============================================================

const levels: Level[] = [
  "beginner",
  "intermediate",
  "advanced",
]

// ============================================================
// UPCOMING UNIKIN EVENT
// ============================================================

const UNIKIN_PROGRAMMING_EVENT = {
  id: "unikin-programming-event-2026",

  title: {
    fr: "Événement de Programmation des Étudiants de l'UNIKIN",
    en: "UNIKIN Students Programming Event",
  },

  description: {
    fr: "Une journée exceptionnelle dédiée aux étudiants de l'Université de Kinshasa passionnés par la programmation, l'intelligence artificielle, le développement web et les nouvelles technologies.",

    en: "A special event dedicated to University of Kinshasa students passionate about programming, artificial intelligence, web development, and new technologies.",
  },

  date: null as string | null,

  location: {
    fr: "Université de Kinshasa — UNIKIN",
    en: "University of Kinshasa — UNIKIN",
  },

  ticket: {
    type: "event" as const,

    duration: {
      fr: "1 journée",
      en: "1 day",
    },

    status: "upcoming" as const,
  },

  features: {
    fr: [
      "Ateliers pratiques de programmation",
      "Conférences avec des professionnels",
      "Initiation à l'intelligence artificielle",
      "Développement Web et Mobile",
      "Networking entre étudiants",
      "Certificat de participation",
    ],

    en: [
      "Hands-on programming workshops",
      "Talks with technology professionals",
      "Introduction to artificial intelligence",
      "Web and Mobile development",
      "Student networking",
      "Certificate of participation",
    ],
  },
} as const

// ============================================================
// COMPONENT
// ============================================================

export function FormationsBrowser({
  formations = mockFormations,
}: {
  formations?: Formation[]
}) {
  const { t, locale } = useI18n()

  const [query, setQuery] = useState("")

  const [category, setCategory] =
    useState<FormationCategory | "all">("all")

  const [level, setLevel] =
    useState<Level | "all">("all")

  // ==========================================================
  // USED CATEGORIES
  // ==========================================================

  const usedCategories = useMemo(
    () =>
      Array.from(
        new Set(
          formations.map(
            (formation) => formation.category,
          ),
        ),
      ),
    [formations],
  )

  // ==========================================================
  // FILTER FORMATIONS
  // ==========================================================

  const filtered = useMemo(() => {
    const normalizedQuery = query
      .toLowerCase()
      .trim()

    return formations.filter((formation) => {
      if (
        category !== "all" &&
        formation.category !== category
      ) {
        return false
      }

      if (
        level !== "all" &&
        formation.level !== level
      ) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const searchableContent = [
        localize(formation.title, locale),
        localize(formation.summary, locale),
      ]
        .join(" ")
        .toLowerCase()

      return searchableContent.includes(
        normalizedQuery,
      )
    })
  }, [
    query,
    category,
    level,
    locale,
    formations,
  ])

  // ==========================================================
  // EVENT LOCALIZATION
  // ==========================================================

  const eventTitle = localize(
    UNIKIN_PROGRAMMING_EVENT.title,
    locale,
  )

  const eventDescription = localize(
    UNIKIN_PROGRAMMING_EVENT.description,
    locale,
  )

  const eventLocation = localize(
    UNIKIN_PROGRAMMING_EVENT.location,
    locale,
  )

  const eventDuration = localize(
    UNIKIN_PROGRAMMING_EVENT.ticket.duration,
    locale,
  )

  const eventFeatures =
    locale === "fr"
      ? UNIKIN_PROGRAMMING_EVENT.features.fr
      : UNIKIN_PROGRAMMING_EVENT.features.en

  // ==========================================================
  // DATE DISPLAY
  // ==========================================================

  const eventDateLabel =
    UNIKIN_PROGRAMMING_EVENT.date ??
    (locale === "fr"
      ? "Date bientôt annoncée"
      : "Date coming soon")

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="mb-10 max-w-2xl">
        <h1
          className="
            text-balance
            font-heading
            text-3xl
            font-bold
            tracking-tight
            md:text-4xl
          "
        >
          {t("section.formations.title")}
        </h1>

        <div className="mt-3 h-1 w-14 rounded-full bg-[#064E3B]" />

        <p className="mt-4 text-pretty text-muted-foreground">
          {t("section.formations.subtitle")}
        </p>
      </header>

      {/* =====================================================
          UPCOMING UNIKIN EVENT
      ====================================================== */}
     <h1 className="text-white font-bold">Formation Gratuite</h1>
     <TrainingBrowser/>

      <section
        className="
          relative
          mb-12
          overflow-hidden
          rounded-3xl
          border
          border-[#064E3B]/20
          bg-[#064E3B]
          text-white
          shadow-xl
        "
      >




        {/* PB-pay green glow */}
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative grid gap-8 p-6 md:grid-cols-[1.3fr_0.7fr] md:p-10">

          {/* =================================================
              EVENT INFORMATION
          ================================================== */}

          <div>

            <div
              className="
                mb-5
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-white/10
                px-3
                py-1.5
                text-sm
                font-medium
                text-emerald-50
                ring-1
                ring-white/20
              "
            >
              <CalendarDays className="size-4" />

              {locale === "fr"
                ? "Événement à venir"
                : "Upcoming event"}
            </div>

            <h2
              className="
                max-w-2xl
                font-heading
                text-3xl
                font-bold
                tracking-tight
                md:text-4xl
              "
            >
              {eventTitle}
            </h2>

            <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-emerald-50/80">
              {eventDescription}
            </p>

            {/* Event metadata */}
            <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap">

              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-emerald-300" />
                <span>{eventDateLabel}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-emerald-300" />
                <span>{eventLocation}</span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="size-4 text-emerald-300" />
                <span>
                  {locale === "fr"
                    ? "Étudiants UNIKIN"
                    : "UNIKIN Students"}
                </span>
              </div>

            </div>

            {/* Features */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {eventFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 text-sm text-emerald-50/90"
                >
                  <div
                    className="
                      flex
                      size-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-white/10
                      ring-1
                      ring-white/10
                    "
                  >
                    <Code2 className="size-3.5 text-emerald-300" />
                  </div>

                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* =================================================
              TICKET CARD
          ================================================== */}

          <div className="flex flex-col justify-center">

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white
                p-6
                text-foreground
                shadow-xl
              "
            >

              {/* Header */}
              <div className="flex items-center justify-between">

                <div
                  className="
                    flex
                    size-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#064E3B]/10
                    text-[#064E3B]
                  "
                >
                  <Ticket className="size-5" />
                </div>

                <span className="rounded-full bg-[#064E3B]/10 px-3 py-1 text-xs font-medium text-[#064E3B]">
                  {locale === "fr"
                    ? "Billet en ligne"
                    : "Online ticket"}
                </span>

              </div>

              {/* Ticket type */}
              <p className="mt-6 text-sm text-muted-foreground">
                {locale === "fr"
                  ? "Billet de participation"
                  : "Participation ticket"}
              </p>

              {/* Server price notice */}
              <div
                className="
                  mt-3
                  rounded-xl
                  border
                  border-[#064E3B]/20
                  bg-[#064E3B]/5
                  px-4
                  py-3
                "
              >
                <p className="text-sm font-medium text-[#064E3B]">
                  {locale === "fr"
                    ? "Prix déterminé de manière sécurisée"
                    : "Secure server-calculated price"}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {locale === "fr"
                    ? "Le montant exact du billet sera déterminé par le serveur avant le paiement."
                    : "The exact ticket amount will be determined by the server before payment."}
                </p>
              </div>

              {/* Details */}
              <div className="mt-5 space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    Type
                  </span>

                  <span className="font-medium">
                    {locale === "fr"
                      ? "Événement"
                      : "Event"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {locale === "fr"
                      ? "Durée"
                      : "Duration"}
                  </span>

                  <span className="font-medium">
                    {eventDuration}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {locale === "fr"
                      ? "Lieu"
                      : "Location"}
                  </span>

                  <span className="text-right font-medium">
                    UNIKIN
                  </span>
                </div>

              </div>

              {/* Payment description */}
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {locale === "fr"
                  ? "Payez votre billet en ligne de manière sécurisée avec Mobile Money. Le montant est vérifié par notre serveur avant l'initiation du paiement. Après confirmation, votre ticket personnel sera généré automatiquement."
                  : "Pay securely for your ticket using Mobile Money. The amount is verified by our server before payment begins. Once confirmed, your personal ticket will be generated automatically."}
              </p>

              {/* Checkout */}
              <div className="mt-6">
                <CheckoutDialog
                  kind="event"
                  targetSlug={
                    UNIKIN_PROGRAMMING_EVENT.id
                  }
                  trigger={
                    <Button
                      size="lg"
                      className="
                        w-full
                        gap-2
                        bg-[#064E3B]
                        text-white
                        shadow-sm
                        hover:bg-[#053D2E]
                      "
                    >
                      <Ticket className="size-4" />

                      {locale === "fr"
                        ? "Acheter mon billet"
                        : "Buy my ticket"}

                      <ArrowRight className="size-4" />
                    </Button>
                  }
                />
              </div>

              {/* Security */}
              <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <Smartphone className="size-4 text-[#064E3B]" />

                {locale === "fr"
                  ? "Paiement sécurisé par Mobile Money"
                  : "Secure Mobile Money payment"}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SEARCH AND FILTERS
      ====================================================== */}

      <div className="mb-8 flex flex-col gap-4">

        {/* Search */}
        <Input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder={t("common.search")}
          aria-label={t("common.search")}
          className="
            max-w-md
            focus:border-[#064E3B]
            focus:ring-[#064E3B]/20
            dark:focus:border-emerald-500
          "
        />

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">

          <FilterChip
            active={category === "all"}
            onClick={() => setCategory("all")}
          >
            {t("common.all")}
          </FilterChip>

          {usedCategories.map(
            (currentCategory) => (
              <FilterChip
                key={currentCategory}
                active={
                  category === currentCategory
                }
                onClick={() =>
                  setCategory(currentCategory)
                }
              >
                {localize(
                  categoryLabels[currentCategory],
                  locale,
                )}
              </FilterChip>
            ),
          )}

        </div>

        {/* Level filters */}
        <div className="flex flex-wrap gap-2">

          <FilterChip
            active={level === "all"}
            onClick={() => setLevel("all")}
          >
            {t("common.all")}
          </FilterChip>

          {levels.map((currentLevel) => (
            <FilterChip
              key={currentLevel}
              active={level === currentLevel}
              onClick={() =>
                setLevel(currentLevel)
              }
            >
              {t(
                `common.${currentLevel}` as const,
              )}
            </FilterChip>
          ))}

        </div>
      </div>

      {/* =====================================================
          FORMATIONS
      ====================================================== */}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {locale === "fr"
              ? "Aucune formation ne correspond à votre recherche."
              : "No courses match your search."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((formation) => (
            <FormationCard
              key={formation.id}
              formation={formation}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// FILTER CHIP
// ============================================================

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",

        active
          ? [
              "border-[#064E3B]",
              "bg-[#064E3B]",
              "text-white",
              "shadow-sm",
            ]
          : [
              "border-border",
              "bg-card",
              "text-muted-foreground",
              "hover:border-[#064E3B]/40",
              "hover:bg-[#064E3B]/5",
              "hover:text-[#064E3B]",
              "dark:hover:text-emerald-400",
            ],
      )}
    >
      {children}
    </button>
  )
}