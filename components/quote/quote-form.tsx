'use client'

import { useState } from 'react'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { services, localize } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function QuoteForm() {
  const { t, locale } = useI18n()

  const [projectType, setProjectType] = useState(services[0].slug)
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAiDraft() {
    if (drafting) return

    setDrafting(true)
    setDescription('')

    try {
      const seed = services.find((s) => s.slug === projectType)

      const res = await fetch('/api/ai/quote-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectType: seed
            ? localize(seed.title, locale)
            : projectType,
          locale,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error('draft failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let acc = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        acc += decoder.decode(value, { stream: true })
        setDescription(acc)
      }
    } catch {
      setError(t('ai.error'))
    } finally {
      setDrafting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: projectType,
          description,
          budget,
          deadline,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? 'submit failed')
      }

      setSubmitted(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  {/* ============================================================
      SUCCESS STATE
      ============================================================ */}
  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">

        <div
          className="
            mx-auto flex size-16
            items-center justify-center
            rounded-full
            bg-[#064E3B]/10
            text-[#064E3B]
            dark:bg-emerald-950/40
            dark:text-emerald-400
          "
        >
          <CheckCircle2 className="size-8" />
        </div>

        <h1 className="mt-6 font-heading text-2xl font-bold">
          {t('quote.title')}
        </h1>

        <p className="mt-3 text-pretty text-muted-foreground">
          {t('quote.success')}
        </p>

        <Button
          className="
            mt-8
            bg-[#064E3B]
            text-white
            hover:bg-[#053D2E]
          "
          onClick={() => setSubmitted(false)}
        >
          {t('client.newQuote')}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">

      {/* Header */}
      <header className="mb-8">
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
          {t('quote.title')}
        </h1>

        <div className="mt-3 h-1 w-14 rounded-full bg-[#064E3B]" />

        <p className="mt-4 text-pretty text-muted-foreground">
          {t('quote.subtitle')}
        </p>
      </header>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="
          flex flex-col gap-6
          rounded-2xl
          border border-[#064E3B]/15
          bg-card
          p-6
          shadow-sm
          md:p-8
        "
      >

        {/* Project type */}
        <div className="grid gap-2">
          <Label htmlFor="projectType">
            {t('quote.projectType')}
          </Label>

          <select
            id="projectType"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="
              h-10
              rounded-md
              border border-input
              bg-background
              px-3
              text-sm
              outline-none
              transition-colors

              focus:border-[#064E3B]
              focus:ring-2
              focus:ring-[#064E3B]/20

              dark:focus:border-emerald-500
            "
          >
            {services.map((s) => (
              <option
                key={s.id}
                value={s.slug}
              >
                {localize(s.title, locale)}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="grid gap-2">

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="description">
              {t('quote.description')}
            </Label>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAiDraft}
              disabled={drafting}
              className="
                h-8
                gap-1.5
                text-[#064E3B]
                hover:bg-[#064E3B]/10
                hover:text-[#064E3B]

                dark:text-emerald-400
                dark:hover:bg-emerald-950/40
                dark:hover:text-emerald-300
              "
            >
              <Sparkles className="size-3.5" />

              {t('quote.aiDraft')}
            </Button>
          </div>

          <Textarea
            id="description"
            required
            rows={7}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('quote.descriptionPlaceholder')}
            className="
              resize-y
              focus:border-[#064E3B]
              focus:ring-[#064E3B]/20
              dark:focus:border-emerald-500
            "
          />

          <p className="text-xs text-muted-foreground">
            {t('quote.aiDraftHint')}
          </p>
        </div>

        {/* Budget + deadline */}
        <div className="grid gap-6 sm:grid-cols-2">

          <div className="grid gap-2">
            <Label htmlFor="budget">
              {t('quote.budget')}
            </Label>

            <Input
              id="budget"
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="500"
              className="
                focus:border-[#064E3B]
                focus:ring-[#064E3B]/20
                dark:focus:border-emerald-500
              "
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deadline">
              {t('quote.deadline')}
            </Label>

            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="
                focus:border-[#064E3B]
                focus:ring-[#064E3B]/20
                dark:focus:border-emerald-500
              "
            />
          </div>

        </div>

        {/* Error */}
        {error && (
          <p
            className="
              rounded-md
              bg-destructive/10
              px-3
              py-2
              text-sm
              text-destructive
            "
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="
            w-full
            bg-[#064E3B]
            text-white
            shadow-sm
            transition-colors
            hover:bg-[#053D2E]
            disabled:opacity-60
          "
        >
          {submitting
            ? t('common.loading')
            : t('quote.submit')}
        </Button>

      </form>
    </div>
  )
}