"use client"

import { useEffect, useState } from "react"
import { ImageOff, Sparkles } from "lucide-react"

// Renders an image the AI tutor asked for. Results are cached server-side
// by prompt, so re-opening a conversation doesn't regenerate them.
const memo = new Map<string, Promise<string | null>>()

export function illustrate(prompt: string, moduleSlug: string) {
  const key = `${moduleSlug}:${prompt}`
  if (!memo.has(key)) {
    memo.set(
      key,
      fetch("/api/ai/illustrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, moduleSlug }),
      })
        .then((r) => r.json())
        .then((d: { url?: string }) => d.url ?? null)
        .catch(() => null),
    )
  }
  return memo.get(key)!
}

export function AiIllustration({ prompt, moduleSlug }: { prompt: string; moduleSlug: string }) {
  const [url, setUrl] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    illustrate(prompt, moduleSlug).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [prompt, moduleSlug])

  return (
    <figure className="max-w-lg overflow-hidden rounded-xl border border-border bg-muted/40">
      {url === undefined ? (
        <div className="flex aspect-[16/10] animate-pulse flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-5" />
          Illustration…
        </div>
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={prompt} className="w-full" data-ai-illustration />
      ) : (
        <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
          <ImageOff className="size-5" />
        </div>
      )}
      <figcaption className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">{prompt}</figcaption>
    </figure>
  )
}
