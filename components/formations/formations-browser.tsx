"use client"

import { useMemo, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const levels: Level[] = ["beginner", "intermediate", "advanced"]

export function FormationsBrowser({ formations = mockFormations }: { formations?: Formation[] }) {
  const { t, locale } = useI18n()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<FormationCategory | "all">("all")
  const [level, setLevel] = useState<Level | "all">("all")

  const usedCategories = useMemo(
    () => Array.from(new Set(formations.map((f) => f.category))),
    [formations],
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return formations.filter((f) => {
      if (category !== "all" && f.category !== category) return false
      if (level !== "all" && f.level !== level) return false
      if (!q) return true
      const hay = `${localize(f.title, locale)} ${localize(f.summary, locale)}`.toLowerCase()
      return hay.includes(q)
    })
  }, [query, category, level, locale, formations])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {t("section.formations.title")}
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">{t("section.formations.subtitle")}</p>
      </header>

      <div className="mb-8 flex flex-col gap-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.search")}
          aria-label={t("common.search")}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
            {t("common.all")}
          </FilterChip>
          {usedCategories.map((c) => (
            <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
              {localize(categoryLabels[c], locale)}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={level === "all"} onClick={() => setLevel("all")}>
            {t("common.all")}
          </FilterChip>
          {levels.map((l) => (
            <FilterChip key={l} active={level === l} onClick={() => setLevel(l)}>
              {t(`common.${l}` as const)}
            </FilterChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          {t("common.loading").replace("…", "")} — 0
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <FormationCard key={f.id} formation={f} />
          ))}
        </div>
      )}
    </div>
  )
}

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
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
