"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Eye, EyeOff, MapPin, Pencil, Plus, Ticket, Trash2, X } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/mock-data"
import type { EventView } from "@/lib/events/data"
import { deleteEventAction, saveEventAction, setEventPublishedAction } from "@/lib/events/actions"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { adminNav } from "@/components/dashboard/admin-dashboard"
import { EmptyState, Field, FormError, Panel, formatDateTime } from "@/components/lms/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/** ISO → value for <input type="datetime-local"> in the browser's zone. */
function toLocalInput(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function AdminEvents({ events }: { events: EventView[] }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // null = form closed, "new" = creating, otherwise the slug being edited.
  const [editing, setEditing] = useState<string | null>(null)
  const current = events.find((e) => e.slug === editing)

  function save(form: FormData) {
    setError(null)
    const local = String(form.get("startAt") || "")
    start(async () => {
      const res = await saveEventAction({
        ...Object.fromEntries(form),
        slug: current?.slug,
        startAt: local ? new Date(local).toISOString() : undefined,
        published: form.get("published") === "on",
      })
      if (!res.ok) return setError(res.error)
      setEditing(null)
      router.refresh()
    })
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    start(async () => {
      const res = await action()
      if (!res.ok) return setError(res.error ?? "Error")
      router.refresh()
    })
  }

  return (
    <DashboardShell nav={adminNav} titleKey="admin.events">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {fr
            ? "Les événements publiés apparaissent sur la page Formations. Les billets sont payés par Mobile Money et générés automatiquement."
            : "Published events appear on the Courses page. Tickets are paid with Mobile Money and generated automatically."}
        </p>
        <Button onClick={() => setEditing(editing ? null : "new")}>
          {editing ? <X className="size-4" /> : <Plus className="size-4" />}
          {fr ? "Nouvel événement" : "New event"}
        </Button>
      </div>

      {editing && (
        <Panel title={current ? (fr ? "Modifier l'événement" : "Edit event") : fr ? "Publier un événement" : "Post an event"} icon={CalendarDays} className="mt-6">
          {/* key resets the uncontrolled form when switching between events */}
          <form key={editing} action={save} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label={fr ? "Titre" : "Title"} htmlFor="ev-title">
                <Input placeholder={fr ? "Ex. : Hackathon Linko 2026" : "e.g. Linko Hackathon 2026"} id="ev-title" name="title" required minLength={4} maxLength={140} defaultValue={current ? localize(current.title, locale) : ""} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Description" htmlFor="ev-desc">
                <Textarea placeholder={fr ? "Programme, public visé, ce que les participants vont vivre…" : "Programme, audience, what attendees will experience…"} id="ev-desc" name="description" required minLength={10} maxLength={2000} className="min-h-24" defaultValue={current ? localize(current.description, locale) : ""} />
              </Field>
            </div>
            <Field label={fr ? "Lieu" : "Location"} htmlFor="ev-loc">
              <Input placeholder={fr ? "Ex. : Kinshasa — Gombe, ou En ligne" : "e.g. Kinshasa — Gombe, or Online"} id="ev-loc" name="location" required maxLength={140} defaultValue={current?.location} />
            </Field>
            <Field label={fr ? "Public" : "Audience"} htmlFor="ev-aud">
              <Input id="ev-aud" name="audience" maxLength={140} defaultValue={current?.audience} placeholder={fr ? "ex. Étudiants en informatique" : "e.g. Computer science students"} />
            </Field>
            <Field label={fr ? "Date et heure (vide = à annoncer)" : "Date & time (empty = to be announced)"} htmlFor="ev-date">
              <Input id="ev-date" name="startAt" type="datetime-local" defaultValue={toLocalInput(current?.startAt)} />
            </Field>
            <Field label={fr ? "Durée" : "Duration"} htmlFor="ev-dur">
              <Input placeholder={fr ? "Ex. : 1 journée" : "e.g. 1 day"} id="ev-dur" name="duration" required maxLength={60} defaultValue={current?.duration ?? (fr ? "1 journée" : "1 day")} />
            </Field>
            <Field label={fr ? "Prix du billet (USD, 0 = gratuit)" : "Ticket price (USD, 0 = free)"} htmlFor="ev-price">
              <Input placeholder={fr ? "0 = gratuit" : "0 = free"} id="ev-price" name="priceUsd" type="number" min={0} step="0.01" required defaultValue={current?.priceUsd ?? 15} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" name="published" defaultChecked={current?.published ?? true} className="accent-[#064E3B]" />
              {fr ? "Publier maintenant" : "Publish now"}
            </label>
            <div className="md:col-span-2">
              <Field label={fr ? "Points forts (un par ligne)" : "Highlights (one per line)"} htmlFor="ev-hl">
                <Textarea id="ev-hl" name="highlights" className="min-h-28" defaultValue={current?.highlights.join("\n")} placeholder={fr ? "Ateliers pratiques\nConférences\nCertificat de participation" : "Hands-on workshops\nTalks\nCertificate of participation"} />
              </Field>
            </div>
            <div className="flex items-center justify-end gap-3 md:col-span-2">
              <FormError message={error} />
              <Button type="submit" disabled={pending}>
                {pending ? "…" : current ? (fr ? "Enregistrer" : "Save") : fr ? "Publier" : "Post event"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {!editing && <div className="mt-4"><FormError message={error} /></div>}

      {events.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={CalendarDays} title={fr ? "Aucun événement" : "No events yet"} />
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 lg:grid-cols-2">
          {events.map((e) => (
            <li key={e.slug} className={cn("flex flex-col rounded-2xl border border-border bg-card p-5", !e.published && "opacity-60")}>
              <div className="flex flex-wrap gap-1.5">
                {e.published ? <Badge variant="success">{fr ? "Publié" : "Published"}</Badge> : <Badge variant="secondary">{fr ? "Masqué" : "Hidden"}</Badge>}
                <Badge variant="secondary">{e.priceUsd === 0 ? (fr ? "Gratuit" : "Free") : `$${e.priceUsd}`}</Badge>
              </div>
              <h3 className="mt-3 font-heading text-lg font-semibold">{localize(e.title, locale)}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{localize(e.description, locale)}</p>
              <dl className="mt-4 grid gap-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {e.startAt ? formatDateTime(e.startAt, locale) : fr ? "Date à annoncer" : "Date to be announced"}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  {e.location}
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="size-4" />
                  {e.ticketsSold} {fr ? "billets" : "tickets"}
                </div>
              </dl>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(e.slug)}>
                  <Pencil className="size-4" />
                  {fr ? "Modifier" : "Edit"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  aria-label={e.published ? "Hide" : "Publish"}
                  onClick={() => run(() => setEventPublishedAction({ slug: e.slug, published: !e.published }))}
                >
                  {e.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  aria-label={fr ? "Supprimer" : "Delete"}
                  onClick={() => confirm(fr ? "Supprimer cet événement ?" : "Delete this event?") && run(() => deleteEventAction(e.slug))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  )
}
