"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Plus, Video, X } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/mock-data"
import type { LiveRequestView } from "@/lib/lms/queries"
import { cancelLiveRequestAction, requestLiveAction, respondLiveRequestAction } from "@/lib/lms/actions"
import { Field, FormError, Panel, formatDateTime, liveWindow, selectClass } from "@/components/lms/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const primaryBtn = "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"

/** A course (student side) or an enrolled student in a course (teacher side) the user can request a session with. */
export type LiveTarget = { key: string; slug: string; studentId?: string; label: string }

/** datetime-local value for "now + 1 hour", in the browser's time zone. */
function defaultTime() {
  const d = new Date(Date.now() + 3600_000)
  d.setMinutes(0, 0, 0)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function LiveRequestsPanel({ role, requests, targets }: { role: "student" | "teacher"; requests: LiveRequestView[]; targets: LiveTarget[] }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const statusLabel: Record<LiveRequestView["status"], string> = {
    pending: fr ? "En attente" : "Pending",
    accepted: fr ? "Confirmée" : "Confirmed",
    declined: fr ? "Refusée" : "Declined",
    cancelled: fr ? "Annulée" : "Cancelled",
  }

  function submit(form: FormData) {
    setError(null)
    const target = targets.find((x) => x.key === form.get("target"))
    if (!target) return setError(fr ? "Choisissez un cours" : "Choose a course")
    start(async () => {
      const res = await requestLiveAction({
        slug: target.slug,
        studentId: target.studentId,
        topic: form.get("topic"),
        message: form.get("message") || undefined,
        // Sent as an absolute time so the server doesn't guess the browser's zone.
        proposedAt: new Date(String(form.get("proposedAt"))).toISOString(),
        durationMin: form.get("durationMin"),
      })
      if (!res.ok) return setError(res.error)
      setOpen(false)
      router.refresh()
    })
  }

  function act(fn: () => Promise<{ ok: boolean; error?: string; data?: { liveSessionId?: string } }>) {
    setError(null)
    start(async () => {
      const res = await fn()
      if (!res.ok) return setError(res.error ?? "Error")
      router.refresh()
    })
  }

  return (
    <Panel
      id="live-requests"
      title={fr ? "Sessions en direct 1:1" : "1:1 live sessions"}
      icon={Video}
      className="mt-6"
      action={
        targets.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="size-4" /> : <Plus className="size-4" />}
            {role === "student" ? (fr ? "Demander un live" : "Request a live") : fr ? "Inviter un étudiant" : "Invite a student"}
          </Button>
        )
      }
    >
      <p className="text-sm text-muted-foreground">
        {role === "student"
          ? fr
            ? "Demandez à votre formateur une session vidéo en tête-à-tête, directement dans le navigateur (WebRTC, sans installation)."
            : "Ask your teacher for a one-to-one video session, right in the browser (WebRTC, nothing to install)."
          : fr
            ? "Invitez un étudiant à une session vidéo en tête-à-tête, ou répondez à ses demandes."
            : "Invite a student to a one-to-one video session, or answer their requests."}
      </p>

      {open && (
        <form action={submit} className="mt-4 grid gap-4 rounded-xl border border-border p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label={role === "student" ? (fr ? "Cours" : "Course") : fr ? "Étudiant" : "Student"} htmlFor="lr-target">
              <select id="lr-target" name="target" className={selectClass} required>
                {targets.map((x) => (
                  <option key={x.key} value={x.key}>
                    {x.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label={fr ? "Sujet" : "Topic"} htmlFor="lr-topic">
              <Input id="lr-topic" name="topic" required minLength={3} maxLength={200} placeholder={fr ? "ex. Révision du module 3" : "e.g. Review of module 3"} />
            </Field>
          </div>
          <Field label={fr ? "Date et heure" : "Date & time"} htmlFor="lr-at">
            <Input id="lr-at" name="proposedAt" type="datetime-local" required defaultValue={defaultTime()} />
          </Field>
          <Field label={fr ? "Durée" : "Duration"} htmlFor="lr-dur">
            <select id="lr-dur" name="durationMin" className={selectClass} defaultValue="30">
              {[15, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label={fr ? "Message (facultatif)" : "Message (optional)"} htmlFor="lr-msg">
              <Textarea placeholder={fr ? "Ce que vous souhaitez travailler pendant la session…" : "What you want to work on during the session…"} id="lr-msg" name="message" maxLength={1000} className="min-h-16" />
            </Field>
          </div>
          <div className="flex justify-end md:col-span-2">
            <Button type="submit" disabled={pending} className={primaryBtn}>
              {pending ? "…" : fr ? "Envoyer la demande" : "Send request"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-3">
        <FormError message={error} />
      </div>

      {requests.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{fr ? "Aucune demande pour le moment." : "No requests yet."}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {requests.map((r) => {
            const w = liveWindow(r.proposedAt, r.durationMin)
            return (
              <li key={r.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {r.topic}
                    <Badge variant={r.status === "accepted" ? "success" : "secondary"}>{statusLabel[r.status]}</Badge>
                    {r.status === "pending" && (
                      <Badge variant="secondary">{r.incoming ? (fr ? "Reçue" : "Incoming") : fr ? "Envoyée" : "Sent"}</Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.withName}
                    {r.courseTitle ? ` · ${localize(r.courseTitle, locale)}` : ""} · {formatDateTime(r.proposedAt, locale)} · {r.durationMin} min
                  </p>
                  {r.message && <p className="mt-1 text-sm italic text-muted-foreground">“{r.message}”</p>}
                  {r.status === "accepted" && !w.joinable && new Date(r.proposedAt).getTime() > Date.now() && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {fr ? "La salle ouvre 15 minutes avant le début." : "The room opens 15 minutes before the start."}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.status === "pending" && r.incoming && (
                    <>
                      <Button size="sm" className={primaryBtn} disabled={pending} onClick={() => act(() => respondLiveRequestAction({ id: r.id, accept: true }))}>
                        <Check className="size-4" />
                        {fr ? "Accepter" : "Accept"}
                      </Button>
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => act(() => respondLiveRequestAction({ id: r.id, accept: false }))}>
                        {fr ? "Refuser" : "Decline"}
                      </Button>
                    </>
                  )}
                  {r.status === "pending" && !r.incoming && (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => act(() => cancelLiveRequestAction(r.id))}>
                      {fr ? "Annuler" : "Cancel"}
                    </Button>
                  )}
                  {r.status === "accepted" && r.liveSessionId && w.joinable && (
                    <Button size="sm" className={primaryBtn} render={<Link href={`/live/${r.liveSessionId}`} />}>
                      <Video className="size-4" />
                      {fr ? "Rejoindre" : "Join"}
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
