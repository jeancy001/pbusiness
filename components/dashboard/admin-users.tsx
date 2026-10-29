"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Search, ShieldCheck, UserPlus, Users } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize, type Formation } from "@/lib/mock-data"
import type { AdminUserView } from "@/lib/lms/admin"
import { createStudentAction } from "@/lib/lms/actions"
import { DashboardShell, StatCard } from "@/components/dashboard/dashboard-shell"
import { adminNav } from "@/components/dashboard/admin-dashboard"
import { EmptyState, Field, FormError, Panel, formatDate, selectClass } from "@/components/lms/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const ROLES = ["all", "student", "teacher", "client", "admin"] as const

export function AdminUsers({ users, courses }: { users: AdminUserView[]; courses: Formation[] }) {
  const { t, locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [role, setRole] = useState<(typeof ROLES)[number]>("all")
  const [query, setQuery] = useState("")

  const roleLabel = (r: string) =>
    ({
      all: fr ? "Tous" : "All",
      student: fr ? "Étudiants" : "Students",
      teacher: fr ? "Formateurs" : "Teachers",
      client: "Clients",
      admin: fr ? "Admins" : "Admins",
    })[r] ?? r

  const count = (r: string) => users.filter((u) => u.role === r).length
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => (role === "all" || u.role === role) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)))
  }, [users, role, query])

  function create(form: FormData) {
    setError(null)
    setDone(null)
    const email = String(form.get("email"))
    start(async () => {
      const res = await createStudentAction({ ...Object.fromEntries(form), courseSlug: form.get("courseSlug") || undefined })
      if (!res.ok) return setError(res.error)
      setDone(fr ? `Compte créé. Identifiants envoyés à ${email}.` : `Account created. Sign-in details sent to ${email}.`)
      router.refresh()
    })
  }

  return (
    <DashboardShell nav={adminNav} titleKey="admin.users">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={roleLabel("student")} value={String(count("student"))} icon={GraduationCap} />
        <StatCard label={roleLabel("teacher")} value={String(count("teacher"))} icon={Users} />
        <StatCard label="Clients" value={String(count("client"))} icon={Users} />
        <StatCard label={roleLabel("admin")} value={String(count("admin"))} icon={ShieldCheck} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title={`${t("admin.users")} (${filtered.length})`} icon={Users}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    role === r ? "border-[#064E3B] bg-[#064E3B] text-white" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {roleLabel(r)}
                </button>
              ))}
            </div>
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.search")} className="pl-9" aria-label={t("common.search")} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Users} title={t("lms.empty")} />
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-2 font-medium">{fr ? "Nom" : "Name"}</th>
                    <th className="px-3 py-2 font-medium">{fr ? "Rôle" : "Role"}</th>
                    <th className="px-3 py-2 text-right font-medium">{t("nav.formations")}</th>
                    <th className="px-5 py-2 text-right font-medium">{fr ? "Inscrit le" : "Joined"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={u.role === "admin" ? "warning" : u.role === "teacher" ? "default" : "secondary"}>{roleLabel(u.role)}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{u.enrollments}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{formatDate(u.createdAt, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title={fr ? "Ajouter un étudiant" : "Add a student"} icon={UserPlus} className="self-start">
          <form action={create} className="space-y-4">
            <Field label={fr ? "Nom complet" : "Full name"} htmlFor="s-name">
              <Input id="s-name" name="name" required minLength={2} />
            </Field>
            <Field label="Email" htmlFor="s-email">
              <Input id="s-email" name="email" type="email" required />
            </Field>
            <Field
              label={fr ? "Mot de passe temporaire" : "Temporary password"}
              htmlFor="s-pass"
              hint={fr ? "Envoyé par e-mail à l'étudiant." : "Emailed to the student."}
            >
              <Input id="s-pass" name="password" type="text" required minLength={8} autoComplete="off" />
            </Field>
            <Field label={fr ? "Inscrire au cours (facultatif)" : "Enroll in a course (optional)"} htmlFor="s-course">
              <select id="s-course" name="courseSlug" className={selectClass} defaultValue="">
                <option value="">—</option>
                {courses.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {localize(c.title, locale)}
                  </option>
                ))}
              </select>
            </Field>
            <FormError message={error} />
            {done && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{done}</p>}
            <Button type="submit" disabled={pending} className="w-full">
              <UserPlus className="size-4" />
              {pending ? t("common.loading") : fr ? "Créer le compte" : "Create account"}
            </Button>
          </form>
        </Panel>
      </div>
    </DashboardShell>
  )
}
