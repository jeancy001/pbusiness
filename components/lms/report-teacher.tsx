"use client"

import { useState, useTransition } from "react"
import { Flag, X } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { reportTeacherAction } from "@/lib/admin/actions"
import { Field, FormError, selectClass } from "@/components/lms/ui"
import { Button } from "@/components/ui/button"

/** Lets an enrolled student report the course's teacher to the main admin. */
export function ReportTeacher({ slug, teacherName }: { slug: string; teacherName: string }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit(form: FormData) {
    setError(null)
    start(async () => {
      const res = await reportTeacherAction({ slug, reason: form.get("reason"), message: form.get("message") })
      if (!res.ok) return setError(res.error)
      setSent(true)
    })
  }

  if (sent) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        {fr ? "Signalement envoyé. L'administration va l'examiner." : "Report sent. The administration will review it."}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
      >
        <Flag className="size-3" />
        {fr ? "Signaler le formateur" : "Report the teacher"}
      </button>
    )
  }

  return (
    <form action={submit} className="mt-3 space-y-3 rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{fr ? `Signaler ${teacherName}` : `Report ${teacherName}`}</p>
        <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label={fr ? "Fermer" : "Close"}>
          <X className="size-4" />
        </button>
      </div>
      <Field label={fr ? "Motif" : "Reason"} htmlFor="report-reason">
        <select id="report-reason" name="reason" className={selectClass} defaultValue="behavior">
          <option value="behavior">{fr ? "Comportement inapproprié" : "Inappropriate behaviour"}</option>
          <option value="content">{fr ? "Contenu du cours" : "Course content"}</option>
          <option value="absent">{fr ? "Absent / ne répond pas" : "Absent / not responding"}</option>
          <option value="fraud">{fr ? "Fraude / arnaque" : "Fraud / scam"}</option>
          <option value="other">{fr ? "Autre" : "Other"}</option>
        </select>
      </Field>
      <Field label={fr ? "Que s'est-il passé ?" : "What happened?"} htmlFor="report-message">
        <textarea placeholder={fr ? "Décrivez ce qui s’est passé (dates, faits)…" : "Describe what happened (dates, facts)…"}
          id="report-message"
          name="message"
          required
          minLength={10}
          maxLength={1500}
          rows={4}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Field>
      <FormError message={error} />
      <Button type="submit" size="sm" variant="destructive" disabled={pending} className="w-full">
        <Flag className="size-4" />
        {fr ? "Envoyer le signalement" : "Send report"}
      </Button>
    </form>
  )
}
