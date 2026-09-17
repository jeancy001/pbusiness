"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/dashboard-helpers"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const aiFunctions = [
  {
    key: "search",
    label: { fr: "Recherche intelligente", en: "Smart search" },
  },
  {
    key: "assistant",
    label: {
      fr: "Assistant conversationnel",
      en: "Conversational assistant",
    },
  },
  {
    key: "recommendations",
    label: { fr: "Recommandations", en: "Recommendations" },
  },
  {
    key: "translation",
    label: { fr: "Traduction FR / EN", en: "FR / EN translation" },
  },
  {
    key: "projectDraft",
    label: { fr: "Rédaction de devis", en: "Quote drafting" },
  },
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
    <div
      className="
        rounded-2xl border border-border bg-card p-6
        transition-all duration-200
        hover:border-[#064E3B]/20 hover:shadow-md
        dark:hover:border-emerald-800/60
      "
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="
              flex size-9 items-center justify-center rounded-lg
              bg-[#064E3B]/10 text-[#064E3B]
              transition-colors
              dark:bg-emerald-950/50 dark:text-emerald-400
            "
          >
            <Sparkles className="size-4" />
          </span>

          <div>
            <h2 className="font-heading text-lg font-semibold">
              {t("admin.aiManagement")}
            </h2>

            <p className="text-xs text-muted-foreground">
              Gemini API
            </p>
          </div>
        </div>

        {/* AI enable switch */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30",
            "dark:focus-visible:ring-emerald-500/30",
            enabled
              ? "bg-[#064E3B] dark:bg-emerald-700"
              : "bg-muted",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 transform rounded-full bg-background shadow-sm",
              "transition-transform duration-200",
              enabled ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {/* Usage / Cost / Quota */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {/* Usage */}
        <div
          className="
            rounded-xl border border-border bg-background p-4
            transition-colors
            hover:border-[#064E3B]/20
            dark:hover:border-emerald-800/60
          "
        >
          <p className="text-xs text-muted-foreground">
            {t("admin.ai.usage")}
          </p>

          <p className="mt-1 font-heading text-xl font-bold">
            {usage.toLocaleString()}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              / {quota.toLocaleString()}
            </span>
          </p>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#064E3B] transition-all duration-300 dark:bg-emerald-600"
              style={{
                width: `${Math.min((usage / quota) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Cost */}
        <div
          className="
            rounded-xl border border-border bg-background p-4
            transition-colors
            hover:border-[#064E3B]/20
            dark:hover:border-emerald-800/60
          "
        >
          <p className="text-xs text-muted-foreground">
            {t("admin.ai.cost")}
          </p>

          <p className="mt-1 font-heading text-xl font-bold text-[#064E3B] dark:text-emerald-400">
            ${estCost}
          </p>
        </div>

        {/* Quota */}
        <div
          className="
            rounded-xl border border-border bg-background p-4
            transition-colors
            hover:border-[#064E3B]/20
            dark:hover:border-emerald-800/60
          "
        >
          <label
            htmlFor="quota"
            className="
              text-xs text-muted-foreground
              transition-colors
              focus-within:text-[#064E3B]
              dark:focus-within:text-emerald-400
            "
          >
            {t("admin.ai.quota")}
          </label>

          <input
            id="quota"
            type="number"
            value={quota}
            onChange={(e) => setQuota(Number(e.target.value))}
            className="
              mt-1 w-full bg-transparent
              font-heading text-xl font-bold
              text-[#064E3B]
              outline-none
              transition-colors
              focus:text-[#053D2E]
              dark:text-emerald-400
              dark:focus:text-emerald-300
            "
          />
        </div>
      </div>

      {/* Model */}
      <div className="mt-6 grid gap-2">
        <label
          htmlFor="model"
          className="text-sm font-medium"
        >
          {t("admin.ai.model")}
        </label>

        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!enabled}
          className="
            h-10 rounded-lg border border-input
            bg-background px-3 text-sm
            outline-none transition-all
            hover:border-[#064E3B]/40
            focus-visible:border-[#064E3B]
            focus-visible:ring-2
            focus-visible:ring-[#064E3B]/20
            disabled:cursor-not-allowed
            disabled:opacity-50
            dark:bg-input/30
            dark:hover:border-emerald-800
            dark:focus-visible:border-emerald-500
            dark:focus-visible:ring-emerald-500/20
          "
        >
          <option value="gemini-1.5-flash">
            Gemini 1.5 Flash
          </option>

          <option value="gemini-1.5-pro">
            Gemini 1.5 Pro
          </option>

          <option value="gemini-2.0-flash">
            Gemini 2.0 Flash
          </option>
        </select>
      </div>

      {/* AI Functions */}
      <div className="mt-6">
        <p className="mb-3 text-sm font-medium">
          {t("admin.ai.functions")}
        </p>

        <div className="flex flex-wrap gap-2">
          {aiFunctions.map((fn) => {
            const on = active[fn.key] && enabled

            return (
              <button
                key={fn.key}
                type="button"
                disabled={!enabled}
                onClick={() =>
                  setActive((prev) => ({
                    ...prev,
                    [fn.key]: !prev[fn.key],
                  }))
                }
                className="
                  rounded-full
                  transition-all duration-150
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#064E3B]/30
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:focus-visible:ring-emerald-500/30
                "
              >
                <Badge
                  variant={on ? "brand" : "outline"}
                  className={
                    on
                      ? "bg-[#064E3B]/15 text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "border-[#064E3B]/20 text-muted-foreground hover:border-[#064E3B]/40 hover:text-[#064E3B] dark:border-emerald-800/50 dark:hover:text-emerald-400"
                  }
                >
                  {localize(fn.label, locale)}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}