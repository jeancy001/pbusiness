'use client'

import { Bot, Send, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

type Message = { id: string; role: 'user' | 'assistant'; content: string; streaming?: boolean }

export function AssistantWidget() {
  const { t, locale } = useLanguage()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: 'greeting', role: 'assistant', content: t('ai.assistant.greeting') }])
    }
  }, [open, messages.length, t])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || busy) return
    const userMsg: Message = { id: 'u' + Date.now(), role: 'user', content: text }
    const botId = 'a' + Date.now()
    // Build the conversation history the API expects (exclude the greeting + streaming placeholder).
    const history = messages
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({ role: m.role, content: m.content }))
    setMessages((m) => [...m, userMsg, { id: botId, role: 'assistant', content: '', streaming: true }])
    setInput('')
    setBusy(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          messages: [...history, { role: 'user', content: text }],
        }),
      })

      if (!res.ok || !res.body) throw new Error('AI request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((m) => m.map((msg) => (msg.id === botId ? { ...msg, content: acc } : msg)))
      }
      setMessages((m) =>
        m.map((msg) =>
          msg.id === botId
            ? { ...msg, content: acc || t('ai.error'), streaming: false }
            : msg,
        ),
      )
    } catch {
      setMessages((m) =>
        m.map((msg) => (msg.id === botId ? { ...msg, content: t('ai.error'), streaming: false } : msg)),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('ai.assistant.title')}
        className="fixed bottom-5 right-5 z-50 size-14 rounded-full shadow-lg shadow-primary/25"
      >
        {open ? <X className="size-5" /> : <Bot className="size-5" />}
      </Button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border bg-primary p-4 text-primary-foreground">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/15">
              <Sparkles className="size-4.5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{t('ai.assistant.title')}</span>
              <span className="text-xs text-primary-foreground/80">{t('ai.assistant.subtitle')}</span>
            </div>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-muted text-foreground',
                  )}
                >
                  {msg.content}
                  {msg.streaming && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary/60 align-middle" />}
                </div>
              </div>
            ))}
            {busy && messages[messages.length - 1]?.content === '' && (
              <span className="text-xs text-muted-foreground">{t('ai.thinking')}</span>
            )}
          </div>

          <div className="border-t border-border p-3">
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
                placeholder={t('ai.assistant.placeholder')}
                aria-label={t('ai.assistant.placeholder')}
                className="max-h-24 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              />
              <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label={t('common.send')}>
                <Send className="size-4" />
              </Button>
            </form>
            <p className="mt-2 text-[0.7rem] leading-snug text-muted-foreground">{t('ai.assistant.disclaimer')}</p>
          </div>
        </div>
      )}
    </>
  )
}
