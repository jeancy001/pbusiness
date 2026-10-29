"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUp, CheckCircle2, Hash, Loader2, MessageCircleQuestion, MessagesSquare, Sparkles, Trash2, X } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/mock-data"
import { CHANNELS, type ChannelId } from "@/lib/community/channels"
import type { CommunityMessageView } from "@/lib/community/data"
import { Markdown } from "@/components/lms/markdown"
import { LinkoAcademyMark } from "@/components/brand/linko-academy-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const POLL_MS = 3000

type Me = { userId: string; role: string } | null

async function api<T>(init?: RequestInit & { query?: string }): Promise<T> {
  const res = await fetch(`/api/community${init?.query ?? ""}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? "Error")
  return data as T
}

export function CommunityChat({ me }: { me: Me }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const [channel, setChannel] = useState<ChannelId>("general")
  const [messages, setMessages] = useState<CommunityMessageView[]>([])
  const [loading, setLoading] = useState(true)
  const [threadId, setThreadId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)

  // Initial load per channel, then poll for newer messages (and fresh answer counts).
  useEffect(() => {
    let alive = true
    setLoading(true)
    setMessages([])
    setThreadId(null)
    const load = async () => {
      try {
        const data = await api<{ messages: CommunityMessageView[] }>({ query: `?channel=${channel}` })
        if (alive) setMessages(data.messages)
      } catch {}
      if (alive) setLoading(false)
    }
    void load()
    const id = setInterval(load, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [channel])

  useEffect(() => {
    if (atBottom.current) listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const current = CHANNELS.find((c) => c.id === channel)!

  async function remove(id: string) {
    if (!confirm(fr ? "Supprimer ce message ?" : "Delete this message?")) return
    await api({ method: "PATCH", body: JSON.stringify({ action: "delete", id }) }).catch(() => undefined)
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, deleted: true, body: "" } : x)))
  }

  return (
    <div className="mx-auto grid h-[calc(100dvh-4rem)] max-w-7xl gap-0 px-0 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 lg:px-8">
      {/* Channels */}
      <aside className="hidden py-6 lg:block">
        <p className="flex items-center gap-2 font-heading text-lg font-semibold">
          <MessagesSquare className="size-5 text-[#064E3B] dark:text-emerald-400" />
          {fr ? "Communauté" : "Community"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {fr ? "Discutez, posez vos questions, obtenez des réponses." : "Chat, ask questions, get answers."}
        </p>
        <ul className="mt-5 space-y-0.5">
          {CHANNELS.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setChannel(c.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  channel === c.id ? "bg-[#064E3B]/10 font-medium text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-300" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Hash className="size-4 shrink-0" />
                {localize(c.name, locale)}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="relative flex min-h-0 flex-col border-x border-border bg-card lg:my-4 lg:rounded-2xl lg:border">
        <header className="border-b border-border px-4 py-3">
          <div className="flex gap-1.5 overflow-x-auto pb-2 lg:hidden">
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                className={cn("shrink-0 rounded-full border px-3 py-1 text-xs", channel === c.id ? "border-[#064E3B] bg-[#064E3B] text-white" : "border-border text-muted-foreground")}
              >
                # {localize(c.name, locale)}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-1.5 font-heading font-semibold">
            <Hash className="size-4 text-muted-foreground" />
            {localize(current.name, locale)}
          </p>
          <p className="text-xs text-muted-foreground">{localize(current.description, locale)}</p>
        </header>

        <div
          ref={listRef}
          onScroll={(e) => {
            const el = e.currentTarget
            atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
          }}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
          aria-live="polite"
        >
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </p>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <MessagesSquare className="mx-auto size-8" />
              <p className="mt-2">{fr ? "Aucun message. Lancez la discussion !" : "No messages yet. Start the conversation!"}</p>
            </div>
          ) : (
            messages.map((m) => (
              <MessageItem
                key={m.id}
                m={m}
                canDelete={Boolean(me && !m.deleted && (me.userId === m.userId || me.role === "admin" || me.role === "teacher"))}
                onDelete={() => remove(m.id)}
                onOpen={m.question ? () => setThreadId(m.id) : undefined}
              />
            ))
          )}
        </div>

        <Composer
          me={me}
          channel={channel}
          allowQuestion
          onPosted={(m) => {
            atBottom.current = true
            setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]))
            if (m.question) setThreadId(m.id)
          }}
        />

        {threadId && <Thread id={threadId} me={me} channel={channel} onClose={() => setThreadId(null)} />}
      </section>
    </div>
  )
}

function RoleBadge({ role }: { role: CommunityMessageView["role"] }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const label = { tutor: fr ? "Tuteur" : "Tutor", teacher: fr ? "Formateur" : "Teacher", admin: "Admin" }[role as string]
  if (!label) return null
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        role === "tutor" ? "bg-[#064E3B] text-white" : "bg-[#B8893B]/15 text-[#8A6420] dark:text-amber-300",
      )}
    >
      {label}
    </span>
  )
}

function Avatar({ m }: { m: CommunityMessageView }) {
  if (m.role === "tutor") return <LinkoAcademyMark className="size-8" />
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#064E3B]/10 text-xs font-semibold text-[#064E3B] dark:bg-emerald-950/60 dark:text-emerald-300">
      {m.userName.slice(0, 1).toUpperCase()}
    </span>
  )
}

function MessageItem({
  m,
  canDelete,
  onDelete,
  onOpen,
  accepted,
  onAccept,
}: {
  m: CommunityMessageView
  canDelete: boolean
  onDelete: () => void
  onOpen?: () => void
  accepted?: boolean
  onAccept?: () => void
}) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const time = new Intl.DateTimeFormat(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(m.createdAt))

  return (
    <div className={cn("group flex gap-3", accepted && "rounded-xl bg-success/5 p-2 ring-1 ring-success/30")}>
      <Avatar m={m} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{m.userName}</span>
          <RoleBadge role={m.role} />
          <span className="text-xs text-muted-foreground">{time}</span>
          {accepted && (
            <span className="flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle2 className="size-3.5" />
              {fr ? "Meilleure réponse" : "Accepted answer"}
            </span>
          )}
          {canDelete && (
            <button type="button" onClick={onDelete} aria-label={fr ? "Supprimer" : "Delete"} className="ml-auto text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100 focus:opacity-100">
              <Trash2 className="size-3.5" />
            </button>
          )}
        </p>
        {m.deleted ? (
          <p className="mt-0.5 text-sm italic text-muted-foreground">{fr ? "Message supprimé" : "Message deleted"}</p>
        ) : m.question ? (
          <button type="button" onClick={onOpen} className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-[#064E3B]/40">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#064E3B] dark:text-emerald-400">
              <MessageCircleQuestion className="size-3.5" />
              Question
              {m.acceptedId && <CheckCircle2 className="size-3.5 text-success" aria-label={fr ? "Résolue" : "Solved"} />}
            </span>
            <span className="mt-1 line-clamp-4 block whitespace-pre-wrap text-sm">{m.body}</span>
            <span className="mt-2 block text-xs text-muted-foreground">
              {m.answers} {fr ? (m.answers > 1 ? "réponses" : "réponse") : m.answers === 1 ? "answer" : "answers"} · {fr ? "Voir la discussion" : "View thread"}
            </span>
          </button>
        ) : (
          <div className="mt-0.5 text-sm [&_p]:my-1">
            <Markdown source={m.body} />
          </div>
        )}
        {onAccept && !m.deleted && (
          <button type="button" onClick={onAccept} className="mt-1 text-xs font-medium text-[#064E3B] hover:underline dark:text-emerald-400">
            {fr ? "Marquer comme meilleure réponse" : "Mark as accepted answer"}
          </button>
        )}
      </div>
    </div>
  )
}

function Composer({
  me,
  channel,
  parentId,
  allowQuestion,
  onPosted,
}: {
  me: Me
  channel: ChannelId
  parentId?: string
  allowQuestion?: boolean
  onPosted: (m: CommunityMessageView) => void
}) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const [body, setBody] = useState("")
  const [question, setQuestion] = useState(false)
  const [askTutor, setAskTutor] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!me) {
    return (
      <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-[#064E3B] underline dark:text-emerald-400">
          {fr ? "Connectez-vous" : "Log in"}
        </Link>{" "}
        {fr ? "pour écrire et poser vos questions." : "to write and ask questions."}
      </div>
    )
  }

  async function send() {
    if (!body.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const { message } = await api<{ message: CommunityMessageView }>({
        method: "POST",
        body: JSON.stringify({ channel, body, parentId, question: allowQuestion && question, askTutor: allowQuestion && question && askTutor }),
      })
      setBody("")
      setQuestion(false)
      onPosted(message)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    // Right padding keeps the send button clear of the floating site assistant.
    <div className="border-t border-border p-3 sm:pr-20">
      {allowQuestion && (
        <div className="mb-2 flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={question} onChange={(e) => setQuestion(e.target.checked)} className="accent-[#064E3B]" />
            <MessageCircleQuestion className="size-3.5" />
            {fr ? "C'est une question" : "This is a question"}
          </label>
          {question && (
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={askTutor} onChange={(e) => setAskTutor(e.target.checked)} className="accent-[#064E3B]" />
              <Sparkles className="size-3.5 text-[#064E3B] dark:text-emerald-400" />
              {fr ? "Demander aussi au Tuteur" : "Also ask the Tutor"}
            </label>
          )}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
        className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-[#064E3B]/40"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={parentId ? (fr ? "Votre réponse…" : "Your answer…") : question ? (fr ? "Décrivez votre question…" : "Describe your question…") : fr ? "Écrivez un message…" : "Write a message…"}
          aria-label={fr ? "Message" : "Message"}
          className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
        />
        <Button type="submit" size="icon" disabled={busy || !body.trim()} className="shrink-0 rounded-xl" aria-label={fr ? "Envoyer" : "Send"}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </Button>
      </form>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}

function Thread({ id, me, channel, onClose }: { id: string; me: Me; channel: ChannelId; onClose: () => void }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const [data, setData] = useState<{ question: CommunityMessageView; answers: CommunityMessageView[] } | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await api({ query: `?thread=${id}` }))
    } catch {}
  }, [id])

  useEffect(() => {
    void load()
    const t = setInterval(load, POLL_MS)
    return () => clearInterval(t)
  }, [load])

  const waitingForTutor = data && data.answers.length === 0 && Date.now() - new Date(data.question.createdAt).getTime() < 60_000

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-card lg:inset-y-0 lg:left-auto lg:w-[460px] lg:border-l lg:border-border lg:shadow-xl">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="flex items-center gap-2 font-heading font-semibold">
          <MessageCircleQuestion className="size-4 text-[#064E3B] dark:text-emerald-400" />
          {fr ? "Discussion" : "Thread"}
        </p>
        <button type="button" onClick={onClose} aria-label={fr ? "Fermer" : "Close"} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {!data ? (
          <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="rounded-xl border border-border p-3">
              <MessageItem m={{ ...data.question, question: false }} canDelete={false} onDelete={() => undefined} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {data.answers.length} {fr ? (data.answers.length > 1 ? "réponses" : "réponse") : data.answers.length === 1 ? "answer" : "answers"}
            </p>
            {data.answers.map((a) => (
              <MessageItem
                key={a.id}
                m={a}
                accepted={data.question.acceptedId === a.id}
                canDelete={Boolean(me && !a.deleted && (me.userId === a.userId || me.role === "admin" || me.role === "teacher"))}
                onDelete={async () => {
                  await api({ method: "PATCH", body: JSON.stringify({ action: "delete", id: a.id }) }).catch(() => undefined)
                  void load()
                }}
                onAccept={
                  me?.userId === data.question.userId && data.question.acceptedId !== a.id
                    ? async () => {
                        await api({ method: "PATCH", body: JSON.stringify({ action: "accept", questionId: id, answerId: a.id }) }).catch(() => undefined)
                        void load()
                      }
                    : undefined
                }
              />
            ))}
            {waitingForTutor && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {fr ? "En attente de réponses…" : "Waiting for answers…"}
              </p>
            )}
          </>
        )}
      </div>
      <Composer me={me} channel={channel} parentId={id} onPosted={() => void load()} />
    </div>
  )
}
