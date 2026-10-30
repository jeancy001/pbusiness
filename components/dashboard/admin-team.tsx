"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Award, Ban, CheckCircle2, Flag, GraduationCap, ShieldCheck, Trash2, UserPlus, Users, Wallet, XCircle } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/mock-data"
import type { ReportView, TeamOverview } from "@/lib/admin/team"
import { createStaffAction, dismissReportAction, removeStaffAction, setSuspendedAction } from "@/lib/admin/actions"
import { reviewTeacherApplicationAction } from "@/lib/account/actions"
import { DashboardShell, StatCard } from "@/components/dashboard/dashboard-shell"
import { adminNav } from "@/components/dashboard/admin-dashboard"
import { EmptyState, Field, FormError, Panel, formatDate } from "@/components/lms/ui"
import { Badge } from "@/components/ui/badge"
import { CertifiedBadge } from "@/components/teachers/certified-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { cn } from "@/lib/utils"

const primaryBtn = "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const REASONS: Record<ReportView["reason"], { fr: string; en: string }> = {
  behavior: { fr: "Comportement", en: "Behaviour" },
  content: { fr: "Contenu du cours", en: "Course content" },
  absent: { fr: "Absent / ne répond pas", en: "Absent / not responding" },
  fraud: { fr: "Fraude / arnaque", en: "Fraud / scam" },
  other: { fr: "Autre", en: "Other" },
}

export function AdminTeam({ data }: { data: TeamOverview }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const { counts, admins, teachers, reports, applications } = data
  const openReports = reports.filter((r) => r.status === "open")

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null)
    start(async () => {
      const res = await action()
      if (!res.ok) setError(res.error)
      router.refresh()
    })
  }

  function suspend(userId: string, name: string, suspended: boolean) {
    if (!suspended) return run(() => setSuspendedAction({ userId, suspended: false }))
    const reason = window.prompt(fr ? `Suspendre ${name} ? Motif (facultatif) :` : `Suspend ${name}? Reason (optional):`, "")
    if (reason === null) return
    run(() => setSuspendedAction({ userId, suspended: true, reason }))
  }

  function addStaff(form: FormData) {
    setFormError(null)
    setDone(null)
    const email = String(form.get("email"))
    start(async () => {
      const res = await createStaffAction(Object.fromEntries(form))
      if (!res.ok) return setFormError(res.error)
      setDone(fr ? `Administrateur adjoint créé. Identifiants envoyés à ${email}.` : `Assistant admin created. Sign-in details sent to ${email}.`)
      router.refresh()
    })
  }

  const totals = teachers.reduce(
    (acc, t) => ({ gross: acc.gross + t.grossUsd, earned: acc.earned + t.teacherEarnedUsd, platform: acc.platform + t.platformUsd }),
    { gross: 0, earned: 0, platform: 0 },
  )

  return (
    <DashboardShell nav={adminNav} titleKey="admin.team">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={fr ? "Utilisateurs" : "Users"} value={String(counts.total)} icon={Users} />
        <StatCard label={fr ? "Formateurs" : "Teachers"} value={String(counts.teacher)} icon={GraduationCap} />
        <StatCard label={fr ? "Admins (principal + adjoints)" : "Admins (main + assistants)"} value={String(counts.admin + counts.staff)} icon={ShieldCheck} />
        <StatCard label={fr ? "Signalements ouverts" : "Open reports"} value={String(openReports.length)} icon={Flag} />
      </div>

      <FormError message={error} />

      {/* Teacher applications from certified students */}
      {applications.length > 0 && (
        <Panel title={fr ? "Candidatures de formateurs" : "Teacher applications"} icon={Award} className="mt-6">
          <ul className="divide-y divide-border">
            {applications.map((a) => (
              <li key={a.id} className={cn("flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start", a.status !== "pending" && "opacity-60")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{a.name}</p>
                    <Badge variant="secondary">{a.expertise}</Badge>
                    <Badge variant="success">
                      <Award className="size-3" /> {a.certificates} {fr ? "certification(s)" : "certificate(s)"}
                    </Badge>
                    {a.status !== "pending" && (
                      <Badge variant={a.status === "approved" ? "success" : "secondary"}>
                        {a.status === "approved" ? (fr ? "Acceptée" : "Approved") : fr ? "Refusée" : "Rejected"}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm">{a.motivation}</p>
                  {a.experience && <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{a.experience}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.email} · {formatDate(a.createdAt, locale)}
                  </p>
                </div>
                {a.status === "pending" && (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" disabled={pending} className={primaryBtn} onClick={() => run(() => reviewTeacherApplicationAction({ id: a.id, approve: true }))}>
                      <CheckCircle2 className="size-4" />
                      {fr ? "Accepter" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        const note = window.prompt(fr ? "Motif du refus (envoyé à l'étudiant, facultatif) :" : "Reason (sent to the student, optional):", "")
                        if (note !== null) run(() => reviewTeacherApplicationAction({ id: a.id, approve: false, note }))
                      }}
                    >
                      <XCircle className="size-4" />
                      {fr ? "Refuser" : "Reject"}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Reports */}
      <Panel
        title={fr ? "Signalements de formateurs" : "Teacher reports"}
        icon={Flag}
        className={cn("mt-6", openReports.length > 0 && "border-destructive/40")}
      >
        {reports.length === 0 ? (
          <EmptyState icon={CheckCircle2} title={fr ? "Aucun signalement" : "No reports"} />
        ) : (
          <ul className="divide-y divide-border">
            {reports.map((r) => (
              <li key={r.id} className={cn("flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start", r.status !== "open" && "opacity-60")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{r.teacherName}</p>
                    <Badge variant="destructive">{localize(REASONS[r.reason], locale)}</Badge>
                    {r.status === "open" ? (
                      <Badge variant="warning">{fr ? "Ouvert" : "Open"}</Badge>
                    ) : (
                      <Badge variant="secondary">{r.status === "resolved" ? (fr ? "Traité" : "Resolved") : fr ? "Classé" : "Dismissed"}</Badge>
                    )}
                    {r.teacherSuspended && <Badge variant="secondary">{fr ? "Formateur suspendu" : "Teacher suspended"}</Badge>}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm">{r.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fr ? "Par" : "By"} {r.reporterName}
                    {r.courseTitle && ` · ${localize(r.courseTitle, locale)}`} · {formatDate(r.createdAt, locale)}
                  </p>
                </div>
                {r.status === "open" && (
                  <div className="flex shrink-0 gap-2">
                    {!r.teacherSuspended && (
                      <Button size="sm" variant="destructive" disabled={pending} onClick={() => suspend(r.teacherId, r.teacherName, true)}>
                        <Ban className="size-4" />
                        {fr ? "Suspendre" : "Suspend"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => dismissReportAction(r.id))}>
                      {fr ? "Classer" : "Dismiss"}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Teachers with revenue */}
      <Panel title={fr ? `Formateurs et revenus (${teachers.length})` : `Teachers and revenue (${teachers.length})`} icon={Wallet} className="mt-6">
        <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
          {[
            [fr ? "Ventes des cours formateurs" : "Teacher course sales", totals.gross],
            [fr ? "Gagné par les formateurs" : "Earned by teachers", totals.earned],
            [fr ? "Part admin" : "Admin share", totals.platform],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl bg-muted/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-heading text-lg font-semibold tabular-nums">{usd(value as number)}</p>
            </div>
          ))}
        </div>
        {teachers.length === 0 ? (
          <EmptyState icon={GraduationCap} title={fr ? "Aucun formateur" : "No teachers"} />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2 font-medium">{fr ? "Formateur" : "Teacher"}</th>
                  <th className="px-3 py-2 text-right font-medium">{fr ? "Cours" : "Courses"}</th>
                  <th className="px-3 py-2 text-right font-medium">{fr ? "Étudiants" : "Students"}</th>
                  <th className="px-3 py-2 text-right font-medium">{fr ? "Ventes" : "Sales"}</th>
                  <th className="px-3 py-2 text-right font-medium">{fr ? "Gagné" : "Earned"}</th>
                  <th className="px-3 py-2 text-right font-medium">{fr ? "Part admin" : "Admin share"}</th>
                  <th className="px-3 py-2 text-right font-medium">{fr ? "Versé" : "Paid out"}</th>
                  <th className="px-3 py-2 text-right font-medium">{fr ? "Solde" : "Balance"}</th>
                  <th className="px-5 py-2 text-right font-medium">{fr ? "Statut" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {teachers.map((t) => (
                  <tr key={t.id} className={cn("hover:bg-muted/40", t.suspended && "bg-destructive/5")}>
                    <td className="px-5 py-3">
                      <p className="font-medium">
                        {t.name}
                        {t.certifiedUntil && <CertifiedBadge className="ml-1" />}
                        {t.openReports > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            <Flag className="size-3" /> {t.openReports}
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.email}
                        {t.addedBy && ` · ${fr ? "ajouté par" : "added by"} ${t.addedBy}`}
                      </p>
                      {t.certifiedUntil && (
                        <p className="text-xs text-[#1D9BF0]">
                          {fr ? "Certifié jusqu'au" : "Certified until"} {formatDate(t.certifiedUntil, locale)}
                        </p>
                      )}
                      {t.suspended && t.suspendedReason && <p className="text-xs text-destructive">{t.suspendedReason}</p>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{t.courses}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{t.students}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {usd(t.grossUsd)}
                      <span className="block text-xs text-muted-foreground">{t.salesCount}×</span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{usd(t.teacherEarnedUsd)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[#064E3B] dark:text-emerald-400">{usd(t.platformUsd)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{usd(t.paidOutUsd)}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{usd(t.balanceUsd)}</td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant={t.suspended ? "outline" : "ghost"}
                        disabled={pending}
                        className={t.suspended ? "" : "text-destructive hover:bg-destructive/10 hover:text-destructive"}
                        onClick={() => suspend(t.id, t.name, !t.suspended)}
                      >
                        {t.suspended ? <CheckCircle2 className="size-4" /> : <Ban className="size-4" />}
                        {t.suspended ? (fr ? "Réactiver" : "Reactivate") : fr ? "Suspendre" : "Suspend"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Admins */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title={fr ? `Administrateurs (${admins.length})` : `Administrators (${admins.length})`} icon={ShieldCheck}>
          <p className="mb-4 text-sm text-muted-foreground">
            {fr
              ? "Les administrateurs adjoints ajoutent des formateurs et voient le nombre d'utilisateurs. Ils n'ont accès ni aux portefeuilles, ni aux revenus, ni aux paiements."
              : "Assistant admins add teachers and see how many users there are. They have no access to wallets, revenue or payments."}
          </p>
          <ul className="divide-y divide-border">
            {admins.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {a.name}
                    <Badge variant={a.role === "admin" ? "warning" : "secondary"} className="ml-2">
                      {a.role === "admin" ? (fr ? "Principal" : "Main") : fr ? "Adjoint" : "Assistant"}
                    </Badge>
                    {a.suspended && (
                      <Badge variant="destructive" className="ml-1">
                        {fr ? "Suspendu" : "Suspended"}
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.email} · {fr ? "depuis le" : "since"} {formatDate(a.createdAt, locale)}
                  </p>
                </div>
                <Badge variant="secondary">
                  {a.teachersAdded} {fr ? "formateur(s) ajouté(s)" : "teacher(s) added"}
                </Badge>
                {a.role === "staff" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => suspend(a.id, a.name, !a.suspended)}>
                      {a.suspended ? <CheckCircle2 className="size-4" /> : <Ban className="size-4" />}
                      <span className="sr-only">{a.suspended ? "Reactivate" : "Suspend"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={fr ? "Retirer" : "Remove"}
                      onClick={() => {
                        if (window.confirm(fr ? `Retirer ${a.name} des administrateurs ?` : `Remove ${a.name} from admins?`)) run(() => removeStaffAction(a.id))
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={fr ? "Ajouter un administrateur adjoint" : "Add an assistant admin"} icon={UserPlus} className="self-start">
          <form action={addStaff} className="space-y-4">
            <Field label={fr ? "Nom complet" : "Full name"} htmlFor="st-name">
              <Input placeholder={fr ? "Ex. : Sara Ilunga" : "e.g. Sara Ilunga"} id="st-name" name="name" required minLength={2} />
            </Field>
            <Field label="Email" htmlFor="st-email">
              <Input placeholder={fr ? "admin@exemple.com" : "admin@example.com"} id="st-email" name="email" type="email" required />
            </Field>
            <Field
              label={fr ? "Mot de passe temporaire" : "Temporary password"}
              htmlFor="st-pass"
              hint={fr ? "Envoyé par e-mail." : "Sent by email."}
            >
              <PasswordInput placeholder={fr ? "8 caractères minimum" : "At least 8 characters"} id="st-pass" name="password" required minLength={8} autoComplete="off" />
            </Field>
            <FormError message={formError} />
            {done && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{done}</p>}
            <Button type="submit" disabled={pending} className={`w-full ${primaryBtn}`}>
              <UserPlus className="size-4" />
              {fr ? "Créer l'administrateur adjoint" : "Create assistant admin"}
            </Button>
          </form>
        </Panel>
      </div>
    </DashboardShell>
  )
}
