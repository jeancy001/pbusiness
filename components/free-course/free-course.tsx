"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUp, BookOpen, CheckCircle2, Circle, FileCode2, Loader2, MessageCircleQuestion, Palette, RotateCcw, Sparkles, Target, Trophy, X } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { previewDocument, trainings, type Lesson } from "@/lib/free-course/content"
import { Markdown } from "@/components/lms/markdown"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PROGRESS_KEY = "linko-free-course-progress"
const STARTER_HTML = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <title>Mon projet</title>
  </head>
  <body>
    <h1>Mon projet</h1>
  </body>
</html>`

type Msg = { role: "user" | "assistant"; content: string }

const starter = (lesson: Lesson) => lesson.code ?? (lesson.language === "css" ? "/* Écrivez votre CSS ici */\n.card { padding: 16px; }" : STARTER_HTML)

export function FreeCourse() {
  const { locale } = useI18n()
  const lang = locale === "fr" ? "fr" : "en"
  const fr = lang === "fr"
  const allLessons = useMemo(() => trainings.flatMap((tr) => tr.modules.flatMap((m) => m.lessons)), [])

  const [done, setDone] = useState<string[]>([])
  const [code, setCode] = useState<Record<string, string>>({})
  const [active, setActive] = useState(allLessons[0].id)
  const [tutorFor, setTutorFor] = useState<string | null>(null)

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "[]"))
    } catch {}
  }, [])

  function toggleDone(id: string) {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  // Highlight the lesson being read in the table of contents.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: "-20% 0px -70% 0px" },
    )
    for (const l of allLessons) {
      const el = document.getElementById(l.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [allLessons])

  const progress = Math.round((done.filter((id) => allLessons.some((l) => l.id === id)).length / allLessons.length) * 100)
  const nextLesson = allLessons.find((l) => !done.includes(l.id)) ?? allLessons[0]
  const tutorLesson = tutorFor ? allLessons.find((l) => l.id === tutorFor) : null

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-[#064E3B] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr] md:items-end lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm ring-1 ring-white/20">
              <Sparkles className="size-4 text-emerald-300" />
              {fr ? "Cours gratuit · sans inscription" : "Free course · no sign-up"}
            </span>
            <h1 className="mt-4 text-balance font-heading text-4xl font-bold tracking-tight md:text-5xl">
              {fr ? "HTML & CSS, du premier tag au site professionnel" : "HTML & CSS, from your first tag to a professional site"}
            </h1>
            <p className="mt-4 max-w-2xl text-emerald-50/80">
              {fr
                ? "Tout le cours sur une seule page : lisez, modifiez le code, voyez le résultat en direct, et demandez de l'aide au Tuteur à tout moment."
                : "The whole course on one page: read, edit the code, see the result live, and ask the Tutor for help at any time."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="bg-white text-[#064E3B] hover:bg-emerald-50" render={<a href={`#${nextLesson.id}`} />}>
                {progress > 0 ? (fr ? "Continuer" : "Continue") : fr ? "Commencer" : "Start"}
              </Button>
              <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10" render={<Link href="/community" />}>
                {fr ? "Poser une question à la communauté" : "Ask the community"}
              </Button>
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="flex items-end justify-between">
              <p className="text-sm text-emerald-100/80">{fr ? "Votre progression" : "Your progress"}</p>
              <p className="font-heading text-3xl font-bold tabular-nums">{progress}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
              {[
                [String(allLessons.length), fr ? "leçons" : "lessons"],
                [String(trainings.reduce((n, tr) => n + tr.modules.length, 0)), "modules"],
                ["2", fr ? "niveaux avancés" : "advanced levels"],
              ].map(([v, k]) => (
                <div key={k} className="rounded-xl bg-white/5 py-2">
                  <dt className="font-heading text-xl font-bold">{v}</dt>
                  <dd className="text-xs text-emerald-100/70">{k}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:px-8">
        {/* Table of contents */}
        <nav aria-label={fr ? "Sommaire" : "Contents"} className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pb-6 pr-2">
            {trainings.map((tr) => (
              <div key={tr.id} className="mb-6">
                <p className="flex items-center gap-2 font-heading text-sm font-semibold">
                  {tr.category === "html" ? <FileCode2 className="size-4 text-orange-500" /> : <Palette className="size-4 text-sky-500" />}
                  {tr.title[lang]}
                </p>
                {tr.modules.map((m) => (
                  <div key={m.id} className="mt-3">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {m.title[lang].replace(/^Module \d+ — /, "")}
                      {m.advanced && <AdvancedBadge fr={fr} />}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {m.lessons.map((l) => (
                        <li key={l.id}>
                          <a
                            href={`#${l.id}`}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                              active === l.id ? "bg-[#064E3B]/10 font-medium text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-300" : "text-muted-foreground",
                            )}
                          >
                            {done.includes(l.id) ? <CheckCircle2 className="size-3.5 shrink-0 text-success" /> : <Circle className="size-3.5 shrink-0" />}
                            <span className="truncate">{l.title[lang]}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </nav>

        {/* Lessons */}
        <main className="min-w-0 space-y-16">
          {trainings.map((tr) => (
            <section key={tr.id} aria-labelledby={`${tr.id}-title`}>
              <header className="rounded-2xl border border-border bg-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#064E3B] dark:text-emerald-400">
                  {tr.level[lang]} → {fr ? "Avancé" : "Advanced"} · {tr.duration[lang]}
                </p>
                <h2 id={`${tr.id}-title`} className="mt-2 font-heading text-3xl font-bold tracking-tight">
                  {tr.title[lang]}
                </h2>
                <p className="mt-2 text-muted-foreground">{tr.description[lang]}</p>
                <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  {tr.objectives[lang].map((o) => (
                    <li key={o} className="flex gap-2">
                      <Target className="mt-0.5 size-4 shrink-0 text-[#064E3B] dark:text-emerald-400" />
                      {o}
                    </li>
                  ))}
                </ul>
              </header>

              {tr.modules.map((m) => (
                <div key={m.id} className="mt-10">
                  <h3 className="flex flex-wrap items-center gap-3 font-heading text-xl font-semibold">
                    <BookOpen className="size-5 text-[#064E3B] dark:text-emerald-400" />
                    {m.title[lang]}
                    {m.advanced && <AdvancedBadge fr={fr} />}
                  </h3>
                  <div className="mt-4 space-y-8">
                    {m.lessons.map((l) => (
                      <LessonBlock
                        key={l.id}
                        lesson={l}
                        lang={lang}
                        code={code[l.id] ?? starter(l)}
                        onCode={(v) => setCode((c) => ({ ...c, [l.id]: v }))}
                        onReset={() => setCode(({ [l.id]: _drop, ...rest }) => rest)}
                        done={done.includes(l.id)}
                        onDone={() => toggleDone(l.id)}
                        onAsk={() => setTutorFor(l.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}

          {progress === 100 && (
            <div className="rounded-2xl border border-[#B8893B]/40 bg-[#B8893B]/10 p-6 text-center">
              <Trophy className="mx-auto size-10 text-[#B8893B]" />
              <p className="mt-3 font-heading text-xl font-semibold">{fr ? "Bravo, vous avez terminé le cours !" : "Well done, you finished the course!"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {fr ? "Continuez avec JavaScript ou TypeScript dans Linko Academy." : "Continue with JavaScript or TypeScript in Linko Academy."}
              </p>
              <Button className="mt-4" render={<Link href="/academy" />}>
                Linko Academy
              </Button>
            </div>
          )}
        </main>
      </div>

      {tutorLesson && <TutorDrawer key={tutorLesson.id} lesson={tutorLesson} lang={lang} code={code[tutorLesson.id] ?? starter(tutorLesson)} onClose={() => setTutorFor(null)} />}
    </div>
  )
}

function AdvancedBadge({ fr }: { fr: boolean }) {
  return (
    <span className="rounded-full bg-[#B8893B]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A6420] dark:text-amber-300">
      {fr ? "Avancé" : "Advanced"}
    </span>
  )
}

function LessonBlock({
  lesson,
  lang,
  code,
  onCode,
  onReset,
  done,
  onDone,
  onAsk,
}: {
  lesson: Lesson
  lang: "fr" | "en"
  code: string
  onCode: (v: string) => void
  onReset: () => void
  done: boolean
  onDone: () => void
  onAsk: () => void
}) {
  const fr = lang === "fr"
  // Debounced so the preview doesn't reload on every keystroke.
  const [preview, setPreview] = useState(code)
  useEffect(() => {
    const id = setTimeout(() => setPreview(code), 400)
    return () => clearTimeout(id)
  }, [code])

  return (
    <article id={lesson.id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="font-heading text-lg font-semibold">{lesson.title[lang]}</h4>
            <p className="text-sm text-muted-foreground">{lesson.description[lang]}</p>
          </div>
          <span className={cn("rounded-full px-2.5 py-1 font-mono text-xs font-semibold uppercase", lesson.language === "css" ? "bg-sky-500/10 text-sky-600" : "bg-orange-500/10 text-orange-600")}>
            {lesson.language ?? "html"}
          </span>
        </div>
        <p className="mt-4 leading-relaxed">{lesson.explanation[lang]}</p>
      </div>

      {/* Playground */}
      <div className="grid border-y border-border md:grid-cols-2">
        <div className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
          <div className="flex items-center justify-between bg-[#0D1B16] px-3 py-1.5 text-xs text-emerald-100/70">
            <span>{fr ? "Éditeur — modifiez le code" : "Editor — edit the code"}</span>
            <button type="button" onClick={onReset} className="flex items-center gap-1 hover:text-white">
              <RotateCcw className="size-3" />
              {fr ? "Réinitialiser" : "Reset"}
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => onCode(e.target.value)}
            onKeyDown={(e) => {
              // Tab indents instead of leaving the editor.
              if (e.key !== "Tab") return
              e.preventDefault()
              const el = e.currentTarget
              const { selectionStart: a, selectionEnd: b } = el
              onCode(code.slice(0, a) + "  " + code.slice(b))
              requestAnimationFrame(() => el.setSelectionRange(a + 2, a + 2))
            }}
            spellCheck={false}
            aria-label={fr ? "Éditeur de code" : "Code editor"}
            className="min-h-72 flex-1 resize-y bg-[#0B1512] p-4 font-mono text-[13px] leading-relaxed text-emerald-50 outline-none"
          />
        </div>
        <div className="flex flex-col">
          <div className="bg-muted px-3 py-1.5 text-xs text-muted-foreground">{fr ? "Résultat en direct" : "Live result"}</div>
          <iframe
            title={`${lesson.title[lang]} — preview`}
            srcDoc={previewDocument(lesson, preview)}
            sandbox=""
            className="min-h-72 w-full flex-1 bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex-1 rounded-xl bg-[#064E3B]/5 p-4 text-sm dark:bg-emerald-950/30">
          <p className="flex items-center gap-2 font-medium">
            <Target className="size-4 text-[#064E3B] dark:text-emerald-400" />
            {fr ? "Exercice" : "Exercise"}
          </p>
          <p className="mt-1 text-muted-foreground">{lesson.exercise[lang]}</p>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col">
          <Button variant="outline" size="sm" onClick={onAsk}>
            <MessageCircleQuestion className="size-4" />
            {fr ? "Demander au Tuteur" : "Ask the Tutor"}
          </Button>
          <Button size="sm" variant={done ? "outline" : "default"} onClick={onDone}>
            <CheckCircle2 className={cn("size-4", done && "text-success")} />
            {done ? (fr ? "Terminée" : "Completed") : fr ? "Marquer terminée" : "Mark complete"}
          </Button>
        </div>
      </div>
    </article>
  )
}

function TutorDrawer({ lesson, lang, code, onClose }: { lesson: Lesson; lang: "fr" | "en"; code: string; onClose: () => void }) {
  const fr = lang === "fr"
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ text: string; login?: boolean } | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [messages])

  async function ask(text: string) {
    if (!text.trim() || busy) return
    const history: Msg[] = [...messages, { role: "user", content: text.trim() }]
    setInput("")
    setError(null)
    setBusy(true)
    setMessages([...history, { role: "assistant", content: "" }])
    try {
      const res = await fetch("/api/ai/free-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, locale: lang, code, messages: history }),
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null)
        setError({ text: data?.error ?? "Tutor unavailable", login: res.status === 401 })
        setMessages(history)
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let reply = ""
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        setMessages([...history, { role: "assistant", content: reply }])
      }
    } catch {
      setError({ text: fr ? "Connexion impossible." : "Connection failed." })
      setMessages(history)
    } finally {
      setBusy(false)
    }
  }

  const quick = fr
    ? ["Explique cette leçon plus simplement", "Vérifie mon code", "Donne-moi un indice pour l'exercice"]
    : ["Explain this lesson more simply", "Check my code", "Give me a hint for the exercise"]

  return (
    <aside
      role="dialog"
      aria-label={fr ? "Tuteur" : "Tutor"}
      className="fixed inset-x-2 bottom-2 z-50 flex max-h-[75dvh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[420px]"
    >
      <header className="flex items-center gap-3 border-b border-border bg-[#064E3B] px-4 py-3 text-white">
        <MessageCircleQuestion className="size-5 text-emerald-300" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{fr ? "Tuteur" : "Tutor"}</p>
          <p className="truncate text-xs text-emerald-100/70">{lesson.title[lang]}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={fr ? "Fermer" : "Close"} className="rounded-md p-1 hover:bg-white/10">
          <X className="size-4" />
        </button>
      </header>
      <div className="min-h-40 flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        {messages.length === 0 && (
          <p className="text-muted-foreground">
            {fr ? "Posez une question sur cette leçon. Le Tuteur voit aussi le code de votre éditeur." : "Ask anything about this lesson. The Tutor also sees the code in your editor."}
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <p key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#064E3B] px-3 py-2 text-white">
              {m.content}
            </p>
          ) : m.content ? (
            <div key={i}>
              <Markdown source={m.content} />
            </div>
          ) : (
            <p key={i} className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {fr ? "Le Tuteur réfléchit…" : "The Tutor is thinking…"}
            </p>
          ),
        )}
        {error && (
          <p className="text-destructive">
            {error.text}{" "}
            {error.login && (
              <>
                <Link href="/register" className="font-medium underline">
                  {fr ? "Créer un compte gratuit" : "Create a free account"}
                </Link>
                {" · "}
                <Link href="/login" className="font-medium underline">
                  {fr ? "Se connecter" : "Log in"}
                </Link>
              </>
            )}
          </p>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t border-border p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto">
          {quick.map((q) => (
            <button key={q} type="button" disabled={busy} onClick={() => ask(q)} className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void ask(input)
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={fr ? "Votre question…" : "Your question…"}
            className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#064E3B]/50"
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label={fr ? "Envoyer" : "Send"}>
            <ArrowUp className="size-4" />
          </Button>
        </form>
      </div>
    </aside>
  )
}
