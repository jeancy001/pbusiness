'use client'

import { ArrowRight, Loader2, Search, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { localize, services as allServices, formations as allFormations, type Formation, type Service } from '@/lib/mock-data'

type SearchResponse = { summary: string; formationSlugs: string[]; serviceIds: string[] }

export function SmartSearch({
  formations = allFormations,
  services = allServices,
}: {
  formations?: Formation[]
  services?: Service[]
}) {
  const { t, locale } = useLanguage()
  const [query, setQuery] = useState('')
  const [matchedFormations, setMatchedFormations] = useState<Formation[]>([])
  const [matchedServices, setMatchedServices] = useState<Service[]>([])
  const [summary, setSummary] = useState('')
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function runSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q || loading) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setSummary('')
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, locale }),
        signal: controller.signal,
      })
      const data = (await res.json()) as SearchResponse

      const fMatches = data.formationSlugs
        .map((slug) => formations.find((f) => f.slug === slug))
        .filter((f): f is Formation => Boolean(f))
      const sMatches = data.serviceIds
        .map((id) => services.find((s) => s.id === id))
        .filter((s): s is Service => Boolean(s))

      setMatchedFormations(fMatches)
      setMatchedServices(sMatches)
      setSummary(data.summary || '')
      setHasResults(true)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setSummary(t('ai.error'))
        setMatchedFormations([])
        setMatchedServices([])
        setHasResults(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={runSearch} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('ai.search.placeholder')}
          aria-label={t('ai.search.title')}
          className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-32 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        />
        <Button type="submit" className="absolute right-2 top-2 h-10 gap-1.5 px-4" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {t('common.search')}
        </Button>
      </form>

      {(summary || hasResults) && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="brand">
              <Sparkles className="size-3" />
              {t('common.aiGenerated')}
            </Badge>
          </div>
          {summary && <p className="mb-4 text-sm leading-relaxed text-foreground">{summary}</p>}

          <div className="flex flex-col gap-2">
            {matchedFormations.map((item) => (
              <Link
                key={item.id}
                href={`/formations/${item.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted"
              >
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{localize(item.title, locale)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('nav.formations')} · ${item.priceUsd}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
            {matchedServices.map((item) => (
              <Link
                key={item.id}
                href="/services"
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted"
              >
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{localize(item.title, locale)}</span>
                  <span className="text-xs text-muted-foreground">{t('nav.services')}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
