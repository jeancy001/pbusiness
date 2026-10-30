"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, GraduationCap, LayoutDashboard, Mail, ShieldCheck, UserCircle, UserPlus, Users } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import type { RoleCounts, StaffTeacherView } from "@/lib/admin/team"
import { createTeacherAction } from "@/lib/lms/actions"
import { DashboardShell, StatCard, type NavItem } from "@/components/dashboard/dashboard-shell"
import { EmptyState, Field, FormError, Panel, formatDate } from "@/components/lms/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"

const primaryBtn = "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"

export const staffNav: NavItem[] = [
  { href: "/dashboard/staff", labelKey: "dash.overview", icon: LayoutDashboard },
  { href: "/dashboard/staff#teachers", labelKey: "admin.teachers", icon: GraduationCap },
  { href: "/dashboard/profile", labelKey: "nav.profile", icon: UserCircle },
]

/** Assistant admin: user counts and teachers only — no wallets, revenue or payments. */
export function StaffDashboard({ counts, teachers }: { counts: RoleCounts; teachers: StaffTeacherView[] }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  function create(form: FormData) {
    setError(null)
    setDone(null)
    const email = String(form.get("email"))
    start(async () => {
      const res = await createTeacherAction(Object.fromEntries(form))
      if (!res.ok) return setError(res.error)
      setDone(fr ? `Formateur créé. Identifiants envoyés à ${email}.` : `Teacher created. Sign-in details sent to ${email}.`)
      router.refresh()
    })
  }

  return (
    <DashboardShell nav={staffNav} titleKey="staff.title">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={fr ? "Utilisateurs au total" : "Total users"} value={counts.total.toLocaleString()} icon={Users} />
        <StatCard label={fr ? "Étudiants" : "Students"} value={counts.student.toLocaleString()} icon={GraduationCap} />
        <StatCard label={fr ? "Formateurs" : "Teachers"} value={counts.teacher.toLocaleString()} icon={ShieldCheck} />
        <StatCard label="Clients" value={counts.client.toLocaleString()} icon={Briefcase} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel id="teachers" title={fr ? `Formateurs (${teachers.length})` : `Teachers (${teachers.length})`} icon={GraduationCap}>
          {teachers.length === 0 ? (
            <EmptyState icon={GraduationCap} title={fr ? "Aucun formateur" : "No teachers yet"} />
          ) : (
            <ul className="divide-y divide-border">
              {teachers.map((t) => (
                <li key={t.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {t.name}
                      {t.expertise && <span className="ml-2 text-xs font-normal text-muted-foreground">· {t.expertise}</span>}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3" />
                      {t.email} · {formatDate(t.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {t.addedByMe && <Badge variant="success">{fr ? "Ajouté par vous" : "Added by you"}</Badge>}
                    {t.suspended && <Badge variant="destructive">{fr ? "Suspendu" : "Suspended"}</Badge>}
                    <Badge variant="secondary">
                      {t.courses} {fr ? "cours" : "courses"}
                    </Badge>
                    <Badge>
                      {t.students} {fr ? "étudiants" : "students"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={fr ? "Ajouter un formateur" : "Add a teacher"} icon={UserPlus} className="self-start">
          <form action={create} className="space-y-4">
            <Field label={fr ? "Nom complet" : "Full name"} htmlFor="t-name">
              <Input placeholder={fr ? "Ex. : Kwame Mensah" : "e.g. Kwame Mensah"} id="t-name" name="name" required minLength={2} />
            </Field>
            <Field label="Email" htmlFor="t-email">
              <Input placeholder={fr ? "formateur@exemple.com" : "teacher@example.com"} id="t-email" name="email" type="email" required />
            </Field>
            <Field
              label={fr ? "Mot de passe temporaire" : "Temporary password"}
              htmlFor="t-pass"
              hint={fr ? "8 caractères minimum. Envoyé par e-mail au formateur." : "At least 8 characters. Emailed to the teacher."}
            >
              <PasswordInput placeholder={fr ? "8 caractères minimum" : "At least 8 characters"} id="t-pass" name="password" required minLength={8} autoComplete="off" />
            </Field>
            <Field label={fr ? "Spécialité" : "Expertise"} htmlFor="t-exp">
              <Input id="t-exp" name="expertise" placeholder="Python, Twi, Marketing…" />
            </Field>
            <FormError message={error} />
            {done && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{done}</p>}
            <Button type="submit" disabled={pending} className={`w-full ${primaryBtn}`}>
              <UserPlus className="size-4" />
              {fr ? "Créer le formateur" : "Create teacher"}
            </Button>
          </form>
        </Panel>
      </div>
    </DashboardShell>
  )
}
