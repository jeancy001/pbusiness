"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Captions, Clapperboard, Loader2, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import type { Storyboard } from "@/app/api/ai/video/route"
import { illustrate } from "@/components/lms/ai-illustration"
import { LinkoAcademyMark } from "@/components/brand/linko-academy-logo"
import { CodeBlock } from "@/components/lms/code-block"
import { FormError } from "@/components/lms/ui"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** Opens a dialog where the learner asks for a 2-minute explainer video on any topic of the module. */
export function AiVideoButton({ moduleSlug, defaultTopic, disabled }: { moduleSlug: string; defaultTopic: string; disabled?: boolean }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState(defaultTopic)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null)

  async function generate() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleSlug, locale, topic: topic.trim() || undefined }),
      })
      const data = (await res.json().catch(() => null)) as { storyboard?: Storyboard; error?: string } | null
      if (!res.ok || !data?.storyboard) throw new Error(data?.error ?? "Video unavailable")
      setStoryboard(data.storyboard)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) {
          window.speechSynthesis?.cancel()
          setStoryboard(null)
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" disabled={disabled}>
            <Clapperboard className="size-4" />
            <span className="hidden sm:inline">{fr ? "Vidéo 2 min" : "2-min video"}</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{storyboard?.title ?? (fr ? "Vidéo explicative de 2 minutes" : "2-minute explainer video")}</DialogTitle>
          {!storyboard && (
            <DialogDescription>
              {fr
                ? "Dites ce que vous voulez comprendre : l'IA prépare une courte vidéo narrée et illustrée."
                : "Say what you want explained: the AI prepares a short narrated, illustrated video."}
            </DialogDescription>
          )}
        </DialogHeader>
        {storyboard ? (
          <VideoPlayer storyboard={storyboard} moduleSlug={moduleSlug} />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void generate()
            }}
            className="grid gap-3"
          >
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} aria-label={fr ? "Sujet" : "Topic"} placeholder={fr ? "Ex. : les boucles en Python" : "e.g. loops in Python"} />
            <FormError message={error} />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Clapperboard className="size-4" />}
              {loading ? (fr ? "Préparation de la vidéo…" : "Preparing your video…") : fr ? "Générer la vidéo" : "Generate video"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Seconds of speech for a narration, used for the timeline and when no voice is available. */
const speechSeconds = (text: string) => Math.max(6, text.split(/\s+/).length / 2.5)

function VideoPlayer({ storyboard, moduleSlug }: { storyboard: Storyboard; moduleSlug: string }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const { scenes } = storyboard
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [captions, setCaptions] = useState(true)
  const [images, setImages] = useState<Record<number, string | null>>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ended = index >= scenes.length
  const scene = scenes[Math.min(index, scenes.length - 1)]
  const total = Math.round(scenes.reduce((sum, s) => sum + speechSeconds(s.narration), 0))
  const elapsed = Math.round(scenes.slice(0, index).reduce((sum, s) => sum + speechSeconds(s.narration), 0))

  // Illustrations load ahead of playback: the current scene and the next one.
  useEffect(() => {
    for (const i of [index, index + 1]) {
      const s = scenes[i]
      if (!s || i in images) continue
      illustrate(s.visual.slice(0, 390), moduleSlug).then((url) => setImages((prev) => ({ ...prev, [i]: url })))
    }
  }, [index, scenes, moduleSlug, images])

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    window.speechSynthesis?.cancel()
  }, [])

  // Narrate the current scene, then move on.
  useEffect(() => {
    if (!playing || ended) return
    const next = () => setIndex((i) => i + 1)
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined
    if (synth) {
      const utterance = new SpeechSynthesisUtterance(scene.narration)
      const lang = storyboard.lang === "fr" ? "fr" : "en"
      utterance.lang = lang === "fr" ? "fr-FR" : "en-US"
      utterance.voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null
      utterance.rate = 1
      utterance.onend = next
      synth.cancel()
      synth.speak(utterance)
    } else {
      timer.current = setTimeout(next, speechSeconds(scene.narration) * 1000)
    }
    return stop
  }, [playing, index, ended, scene, storyboard.lang, stop])

  useEffect(() => {
    if (ended) setPlaying(false)
  }, [ended])

  useEffect(() => stop, [stop])

  const go = (i: number) => {
    stop()
    setIndex(Math.max(0, Math.min(scenes.length - 1, i)))
  }
  const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#04281F] text-white">
      {/* Stage */}
      <div className="relative aspect-video">
        <div className="absolute inset-0 grid grid-cols-1 gap-5 p-5 sm:grid-cols-[1.1fr_1fr] sm:p-7">
          <div className="hidden min-h-0 items-center justify-center overflow-hidden rounded-lg bg-white/5 sm:flex">
            {images[index] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[index]!} alt={scene.visual} className="size-full object-cover" />
            ) : (
              <Loader2 className="size-6 animate-spin text-emerald-300/70" />
            )}
          </div>
          <div className="flex min-h-0 flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              {Math.min(index + 1, scenes.length)} / {scenes.length}
            </p>
            <h3 className="mt-2 text-balance font-heading text-xl font-bold leading-tight sm:text-2xl">{scene.heading}</h3>
            {scene.code ? (
              <div className="mt-3 min-h-0 overflow-hidden text-xs [&_pre]:max-h-40">
                <CodeBlock code={scene.code} lang={moduleSlug.replace(/-\d+$/, "")} />
              </div>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm text-emerald-50/90">
                {scene.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#D4A646]" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <LinkoAcademyMark className="absolute right-3 top-3 size-6 opacity-80" />
        {captions && !ended && (
          <p className="absolute inset-x-4 bottom-3 mx-auto max-w-3xl rounded-md bg-black/70 px-3 py-1.5 text-center text-xs leading-relaxed sm:text-sm">
            {scene.narration}
          </p>
        )}
        {ended && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#04281F]/90">
            <p className="font-heading text-lg font-semibold">{fr ? "Fin de la vidéo" : "End of video"}</p>
            <Button
              size="sm"
              variant="outline"
              className="text-foreground"
              onClick={() => {
                setIndex(0)
                setPlaying(true)
              }}
            >
              <RotateCcw className="size-4" />
              {fr ? "Revoir" : "Replay"}
            </Button>
          </div>
        )}
      </div>

      {/* Timeline: one segment per scene */}
      <div className="flex gap-1 px-4 pt-3">
        {scenes.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={s.heading}
            style={{ flex: speechSeconds(s.narration) }}
            className={cn("h-1.5 rounded-full transition-colors", i < index ? "bg-emerald-400" : i === index ? "bg-[#D4A646]" : "bg-white/20")}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 px-2 py-2">
        <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={() => go(index - 1)} aria-label={fr ? "Précédent" : "Previous"}>
          <SkipBack className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => {
            if (ended) setIndex(0)
            if (playing) stop()
            setPlaying((p) => !p)
          }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </Button>
        <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={() => go(index + 1)} aria-label={fr ? "Suivant" : "Next"}>
          <SkipForward className="size-4" />
        </Button>
        <span className="ml-2 text-xs tabular-nums text-emerald-50/80">
          {mmss(elapsed)} / {mmss(total)}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className={cn("ml-auto hover:bg-white/10", captions ? "text-emerald-300" : "text-white/60")}
          onClick={() => setCaptions((c) => !c)}
          aria-label={fr ? "Sous-titres" : "Captions"}
          aria-pressed={captions}
        >
          <Captions className="size-4" />
        </Button>
      </div>
    </div>
  )
}
