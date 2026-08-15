"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/dashboard-helpers"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const aiFunctions = [
  { key: "search", label: { fr: "Recherche intelligente", en: "Smart search" } },
  { key: "assistant", label: { fr: "Assistant conversationnel", en: "Conversational assistant" } },
  { key: "recommendations", label: { fr: "Recommandations", en: "Recommendations" } },
  { key: "translation", label: { fr: "Traduction FR / EN", en: "FR / EN translation" } },
  { key: "projectDraft", label: { fr: "Rédaction de devis", en: "Quote drafting" } },
] as const

export function AiManagement() {
  const { t, locale } = useI18n()
  const [enabled, setEnabled] = useState(true)
  const [model, setModel] = useState("gemini-1.5-flash")
  const [quota, setQuota] = useState(5000)
  const [active, setActive] = useState<Record<string, boolean>>({
    search: true,
    assistant: true,
    recommendations: true,
    translation: true,
    projectDraft: true,
  })

  const usage = 3120
  const estCost = ((usage / 1000) * 0.35).toFixed(2)

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold">{t("admin.aiManagement")}</h2>
            <p className="text-xs text-muted-foreground">Gemini API</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 transform rounded-full bg-background transition-transform",
              enabled ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">{t("admin.ai.usage")}</p>
          <p className="mt-1 font-heading text-xl font-bold">
            {usage.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ {quota.toLocaleString()}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand" style={{ width: `${(usage / quota) * 100}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">{t("admin.ai.cost")}</p>
          <p className="mt-1 font-heading text-xl font-bold">${estCost}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <label htmlFor="quota" className="text-xs text-muted-foreground">
            {t("admin.ai.quota")}
          </label>
          <input
            id="quota"
            type="number"
            value={quota}
            onChange={(e) => setQuota(Number(e.target.value))}
            className="mt-1 w-full bg-transparent font-heading text-xl font-bold outline-none"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-2">
        <label htmlFor="model" className="text-sm font-medium">
          {t("admin.ai.model")}
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!enabled}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
        </select>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-medium">{t("admin.ai.functions")}</p>
        <div className="flex flex-wrap gap-2">
          {aiFunctions.map((fn) => {
            const on = active[fn.key] && enabled
            return (
              <button
                key={fn.key}
                type="button"
                disabled={!enabled}
                onClick={() => setActive((prev) => ({ ...prev, [fn.key]: !prev[fn.key] }))}
                className="disabled:opacity-50"
              >
                <Badge variant={on ? "brand" : "outline"}>{localize(fn.label, locale)}</Badge>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
