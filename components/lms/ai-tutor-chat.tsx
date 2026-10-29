"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, ArrowUp, Award, BookOpenCheck, Briefcase, CheckCircle2, Circle, Code2, Lightbulb, ListChecks, Loader2, RotateCcw, Sparkles, Target } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/mock-data"
import { aiModuleSlug, type AiModule } from "@/lib/lms/catalog"
import { completeAiModuleAction } from "@/lib/lms/actions"
import { AiVideoButton } from "@/components/lms/ai-video"
import { TrackMark } from "@/components/lms/track-cover"
import { langIcon } from "@/lib/lms/lang-icons"
import { Markdown } from "@/components/lms/markdown"
import { LinkoAcademyMark } from "@/components/brand/linko-academy-logo"
import { FormError } from "@/components/lms/ui"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Message = { role: "user" | "assistant"; content: string }

const storageKey = (slug: string) => `pbbo-tutor-${slug}`

/** `tracksProgress` is false for admins reviewing a course they did not buy. */
export function AiTutorChat({ mod, completed, tracksProgress }: { mod: AiModule; completed: string[]; tracksProgress: boolean }) {
  const { t, locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const moduleSlug = mod.slug
  const programming = mod.track.kind === "programming"
  const skills = mod.track.kind === "skills"
  const [completing, startCompleting] = useTransition()
  const done = completed.includes(moduleSlug)
  const isLast = mod.index === mod.track.modules.length
  const allDone = mod.track.modules.every((_, i) => completed.includes(aiModuleSlug(mod.track.slug, i + 1)))
  const nextHref = isLast ? (allDone ? `/academy/certification/${mod.track.slug}` : null) : `/academy/${aiModuleSlug(mod.track.slug, mod.index + 1)}`
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  const quick = skills
    ? [
        { icon: Briefcase, label: fr ? "Étude de cas" : "Case study", prompt: fr ? "Donne-moi une étude de cas réelle sur ce sujet et analysons-la." : "Give me a real-world case study on this topic and let's analyse it." },
        { icon: Target, label: fr ? "Exercice pratique" : "Practical task", prompt: fr ? "Donne-moi un exercice pratique professionnel à réaliser." : "Give me a professional hands-on assignment." },
        { icon: Lightbulb, label: fr ? "Explique autrement" : "Explain differently", prompt: fr ? "Explique-le autrement, avec un exemple concret et une illustration." : "Explain it differently, with a concrete example and an illustration." },
        { icon: ListChecks, label: fr ? "Quiz rapide" : "Quick quiz", prompt: fr ? "Fais-moi un quiz rapide de 5 questions." : "Give me a quick 5-question quiz." },
      ]
    : programming
    ? [
        { icon: Code2, label: fr ? "Montre-moi du code" : "Show me code", prompt: fr ? "Montre-moi un exemple de code complet et commenté." : "Show me a complete, commented code example." },
        { icon: Target, label: fr ? "Donne un exercice" : "Give me an exercise", prompt: fr ? "Donne-moi un exercice pratique à coder." : "Give me a hands-on coding exercise." },
        { icon: Lightbulb, label: fr ? "Explique autrement" : "Explain differently", prompt: fr ? "Explique-le autrement, avec une analogie simple et une illustration." : "Explain it differently, with a simple analogy and an illustration." },
        { icon: ListChecks, label: fr ? "Quiz rapide" : "Quick quiz", prompt: fr ? "Fais-moi un quiz rapide de 5 questions." : "Give me a quick 5-question quiz." },
      ]
    : [
        { icon: BookOpenCheck, label: fr ? "Nouveau vocabulaire" : "New vocabulary", prompt: fr ? "Apprends-moi 5 nouveaux mots avec la prononciation et une illustration." : "Teach me 5 new words with pronunciation and an illustration." },
        { icon: Sparkles, label: fr ? "Petit dialogue" : "Short dialogue", prompt: fr ? "Créons un petit dialogue de la vie quotidienne pour pratiquer." : "Let's practise a short everyday dialogue." },
        { icon: Target, label: fr ? "Exercice" : "Exercise", prompt: fr ? "Donne-moi un exercice de traduction." : "Give me a translation exercise." },
        { icon: ListChecks, label: fr ? "Quiz rapide" : "Quick quiz", prompt: fr ? "Fais-moi un quiz rapide de 5 questions." : "Give me a quick 5-question quiz." },
      ]

  async function send(history: Message[]) {
    setError(null)
    setStreaming(true)
    setMessages([...history, { role: "assistant", content: "" }])
    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleSlug, locale, messages: history }),
      })
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => null))?.error ?? "Tutor unavailable")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ""
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setMessages([...history, { role: "assistant", content: text }])
      }
      try {
        localStorage.setItem(storageKey(moduleSlug), JSON.stringify([...history, { role: "assistant", content: text }].slice(-40)))
      } catch {}
    } catch (e) {
      setError((e as Error).message)
      setMessages(history)
    } finally {
      setStreaming(false)
    }
  }

  // Resume the previous conversation on this device, or let the tutor open the lesson.
  useEffect(() => {
    if (started.current) return
    started.current = true
    let saved: Message[] = []
    try {
      saved = JSON.parse(localStorage.getItem(storageKey(moduleSlug)) ?? "[]")
    } catch {}
    if (saved.length) setMessages(saved)
    else void send([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleSlug])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  function ask(text: string) {
    if (!text.trim() || streaming) return
    setInput("")
    void send([...messages, { role: "user", content: text.trim() }])
  }

  function complete() {
    setError(null)
    startCompleting(async () => {
      const res = await completeAiModuleAction(moduleSlug)
      if (!res.ok) return setError(res.error)
      router.refresh()
    })
  }

  function restart() {
    try {
      localStorage.removeItem(storageKey(moduleSlug))
    } catch {}
    void send([])
  }

  return (
    <div className="mx-auto grid h-[calc(100dvh-4rem)] max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
      {/* Syllabus */}
      <aside className="hidden overflow-y-auto py-6 lg:block">
        <Link href="/academy" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Linko Academy
        </Link>
        <div className="mt-5 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-11 min-w-11 items-center justify-center whitespace-nowrap rounded-xl px-2 font-bold",
                langIcon(mod.track) ? "bg-white ring-1 ring-border" : "bg-[#064E3B] text-white",
                programming ? "font-mono text-xs" : "text-[10px]",
              )}
            >
              <TrackMark track={mod.track} logoClassName="size-7" />
            </span>
            <div>
              <p className="font-heading font-semibold">{localize(mod.track.name, locale)}</p>
              <p className="text-xs text-muted-foreground">
                Module {mod.index}/{mod.track.modules.length}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{fr ? "Objectifs" : "Focus"}</p>
          <p className="mt-1 text-sm">{mod.focus}</p>
        </div>
        <ol className="mt-4 space-y-1">
          {mod.track.modules.map((m, i) => {
            const slug = aiModuleSlug(mod.track.slug, i + 1)
            return (
              <li key={slug}>
                <Link
                  href={`/academy/${slug}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted",
                    i + 1 === mod.index ? "bg-[#064E3B]/10 font-medium text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-300" : "text-muted-foreground",
                  )}
                >
                  {completed.includes(slug) ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <Circle className="size-4 shrink-0" />}
                  {localize(m.title, locale)}
                </Link>
              </li>
            )
          })}
        </ol>
        {tracksProgress && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Award className="size-4 text-[#064E3B] dark:text-emerald-400" />
              {t("lms.certification")}
            </p>
            <p className="mt-1 text-muted-foreground">
              {allDone
                ? fr ? "Tous les modules sont terminés : passez l'examen final." : "All modules finished: take the final exam."
                : fr ? "Terminez chaque module puis réussissez l'examen final pour obtenir votre certificat." : "Finish every module, then pass the final exam to earn your certificate."}
            </p>
            {allDone && (
              <Button size="sm" className="mt-3 w-full" render={<Link href={`/academy/certification/${mod.track.slug}`} />}>
                {fr ? "Examen final" : "Final exam"}
              </Button>
            )}
          </div>
        )}
      </aside>

      {/* Conversation */}
      <section className="flex min-h-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/academy" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Linko Academy">
              <ArrowLeft className="size-5" />
            </Link>
            <LinkoAcademyMark className="size-9" />
            <div className="min-w-0">
              <p className="truncate font-heading font-semibold">{localize(mod.title, locale)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t("lms.aiTutor")} · {localize(mod.track.name, locale)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <AiVideoButton moduleSlug={moduleSlug} defaultTopic={localize(mod.title, locale)} />
            <Button variant="ghost" size="sm" onClick={restart} disabled={streaming}>
              <RotateCcw className="size-4" />
              <span className="hidden sm:inline">{fr ? "Recommencer" : "Restart"}</span>
            </Button>
            {tracksProgress && !done && (
              <Button size="sm" variant="outline" onClick={complete} disabled={completing || streaming}>
                {completing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                <span className="hidden sm:inline">{fr ? "Marquer le module terminé" : "Mark module complete"}</span>
              </Button>
            )}
            {(done || !tracksProgress) && nextHref && (
              <Button size="sm" render={<Link href={nextHref} />}>
                {isLast ? <Award className="size-4" /> : null}
                <span className="hidden sm:inline">{isLast ? (fr ? "Examen final" : "Final exam") : fr ? "Module suivant" : "Next module"}</span>
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-6" aria-live="polite">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#064E3B] px-4 py-2.5 text-sm text-white">{m.content}</p>
              </div>
            ) : (
              <div key={i} className="flex gap-3">
                <LinkoAcademyMark className="mt-0.5 size-8 shrink-0" />
                <div className="min-w-0 flex-1 text-[15px]">
                  {m.content ? (
                    <Markdown source={m.content} illustrations={{ moduleSlug }} />
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      {fr ? "Le tuteur prépare la leçon…" : "Your tutor is preparing the lesson…"}
                    </p>
                  )}
                </div>
              </div>
            ),
          )}
          <div ref={endRef} />
        </div>

        <div className="pb-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {quick.map((q) => (
              <button
                key={q.label}
                type="button"
                disabled={streaming}
                onClick={() => ask(q.prompt)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-[#064E3B]/40 hover:text-foreground disabled:opacity-50"
              >
                <q.icon className="size-3.5 text-[#064E3B] dark:text-emerald-400" />
                {q.label}
              </button>
            ))}
          </div>
          <FormError message={error} />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              ask(input)
            }}
            className="mt-2 flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-[#064E3B]/40"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  ask(input)
                }
              }}
              placeholder={programming ? (fr ? "Posez une question ou collez votre code…" : "Ask a question or paste your code…") : t("lms.askTutor")}
              aria-label={t("lms.askTutor")}
              className={cn("min-h-11 resize-none border-0 shadow-none focus-visible:ring-0", programming && "font-mono text-[13px]")}
              rows={1}
            />
            <Button type="submit" size="icon" disabled={streaming || !input.trim()} className="shrink-0 rounded-xl" aria-label={t("common.send")}>
              {streaming ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {fr ? "Le tuteur peut se tromper. Vérifiez les informations importantes." : "The tutor can make mistakes. Check important information."}
          </p>
        </div>
      </section>
    </div>
  )
}
