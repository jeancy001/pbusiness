"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Award, BadgeCheck, Crown, GraduationCap, KeyRound, Loader2, Mail, Send, ShieldCheck, UserCircle } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize } from "@/lib/mock-data"
import type { ProfileView as Profile } from "@/lib/account/profile"
import { applyTeacherAction, changePasswordAction, sendPasswordCodeAction, updateProfileAction } from "@/lib/account/actions"
import { DashboardShell, type NavItem } from "@/components/dashboard/dashboard-shell"
import { adminNav } from "@/components/dashboard/admin-dashboard"
import { teacherNav } from "@/components/dashboard/teacher-dashboard"
import { studentNav } from "@/components/dashboard/student-dashboard"
import { clientNav } from "@/components/dashboard/client-dashboard"
import { staffNav } from "@/components/dashboard/staff-dashboard"
import { CertifiedBadge } from "@/components/teachers/certified-badge"
import { Field, FormError, Panel, formatDate, selectClass } from "@/components/lms/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CodeInput, PasswordInput } from "@/components/ui/password-input"

const NAV: Record<Profile["role"], NavItem[]> = {
  admin: adminNav,
  staff: staffNav,
  teacher: teacherNav,
  student: studentNav,
  client: clientNav,
}

const ROLE: Record<Profile["role"], { fr: string; en: string }> = {
  admin: { fr: "Administrateur principal", en: "Main administrator" },
  staff: { fr: "Administrateur adjoint", en: "Assistant admin" },
  teacher: { fr: "Formateur", en: "Teacher" },
  student: { fr: "Étudiant", en: "Student" },
  client: { fr: "Client", en: "Client" },
}

const primaryBtn = "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"

function Success({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{children}</p>
}

export function ProfileView({ profile }: { profile: Profile }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const initials = profile.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <DashboardShell nav={NAV[profile.role]} titleKey="nav.profile">
      {/* Identity */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-24 bg-gradient-to-r from-[#064E3B] via-[#0B6B50] to-emerald-500" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <span className="-mt-10 flex size-20 shrink-0 items-center justify-center rounded-2xl bg-[#064E3B] font-heading text-2xl font-bold text-white ring-4 ring-card">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="flex flex-wrap items-center gap-2 font-heading text-xl font-semibold">
              {profile.name}
              {profile.certifiedUntil && <CertifiedBadge label className="rounded-full bg-[#1D9BF0]/10 px-2 py-0.5" />}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              {profile.email}
              <ShieldCheck className="ml-1 size-3.5 text-success" aria-hidden />
              <span className="text-success">{fr ? "vérifié" : "verified"}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.isOwner && (
              <Badge variant="warning">
                <Crown className="size-3" />
                {fr ? "Propriétaire de la plateforme" : "Platform owner"}
              </Badge>
            )}
            <Badge variant="secondary">{localize(ROLE[profile.role], locale)}</Badge>
            <Badge variant="secondary">
              {fr ? "Membre depuis le" : "Member since"} {formatDate(profile.createdAt, locale)}
            </Badge>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <DetailsForm profile={profile} />
        <PasswordForm email={profile.email} />
      </div>

      {profile.role === "student" && <BecomeTeacher profile={profile} />}
      {profile.isOwner && (
        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
          <Crown className="mr-1.5 inline size-4 text-amber-500" />
          {fr
            ? "Les revenus de la plateforme (commissions, Linko Academy, certifications, événements, badges) ne peuvent être retirés que depuis ce compte."
            : "Platform revenue (commissions, Linko Academy, certificates, events, badges) can only be withdrawn from this account."}
        </p>
      )}
    </DashboardShell>
  )
}

function DetailsForm({ profile }: { profile: Profile }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const teacher = profile.role === "teacher"

  function save(form: FormData) {
    setError(null)
    setSaved(false)
    start(async () => {
      const res = await updateProfileAction(Object.fromEntries(form))
      if (!res.ok) return setError(res.error)
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <Panel title={fr ? "Informations personnelles" : "Personal details"} icon={UserCircle}>
      <form action={save} className="space-y-4">
        <Field label={fr ? "Nom complet" : "Full name"} htmlFor="p-name">
          <Input id="p-name" name="name" required minLength={2} maxLength={80} defaultValue={profile.name} placeholder={fr ? "Ex. : Grâce Mbuyi" : "e.g. Grace Mbuyi"} autoComplete="name" />
        </Field>
        <Field label="E-mail" htmlFor="p-email" hint={fr ? "Pour changer d'adresse, contactez l'administration." : "To change your address, contact the administration."}>
          <Input id="p-email" value={profile.email} readOnly disabled placeholder="vous@exemple.com" />
        </Field>
        <Field label={fr ? "Langue des e-mails" : "Email language"} htmlFor="p-locale">
          <select id="p-locale" name="locale" className={selectClass} defaultValue={profile.locale ?? "fr"}>
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="tw">Twi</option>
            <option value="gaa">Gã</option>
            <option value="ee">Eʋegbe</option>
          </select>
        </Field>
        {teacher && (
          <>
            <Field label={fr ? "Spécialité" : "Expertise"} htmlFor="p-exp">
              <Input id="p-exp" name="expertise" maxLength={120} defaultValue={profile.expertise} placeholder="Python, Twi, Marketing…" />
            </Field>
            <Field label={fr ? "Biographie" : "Bio"} htmlFor="p-bio" hint={fr ? "Visible par vos étudiants." : "Visible to your students."}>
              <Textarea
                id="p-bio"
                name="bio"
                rows={4}
                maxLength={1000}
                defaultValue={profile.bio}
                placeholder={fr ? "Votre parcours, ce que vous enseignez, votre méthode…" : "Your background, what you teach, your method…"}
              />
            </Field>
          </>
        )}
        <FormError message={error} />
        {saved && <Success>{fr ? "Profil mis à jour." : "Profile updated."}</Success>}
        <Button type="submit" disabled={pending} className={primaryBtn}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {fr ? "Enregistrer" : "Save"}
        </Button>
      </form>
    </Panel>
  )
}

function PasswordForm({ email }: { email: string }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const [step, setStep] = useState<"start" | "code" | "done">("start")
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  function sendCode() {
    setError(null)
    setInfo(null)
    start(async () => {
      const res = await sendPasswordCodeAction()
      if (!res.ok) return setError(res.error)
      if (step === "code") setInfo(fr ? "Nouveau code envoyé." : "New code sent.")
      setStep("code")
    })
  }

  function change(form: FormData) {
    setError(null)
    start(async () => {
      const res = await changePasswordAction(Object.fromEntries(form))
      if (!res.ok) return setError(res.error)
      setStep("done")
    })
  }

  return (
    <Panel title={fr ? "Mot de passe" : "Password"} icon={KeyRound} className="self-start">
      {step === "start" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {fr
              ? `Pour votre sécurité, un code à 6 chiffres sera envoyé à ${email} pour confirmer le changement.`
              : `For your security, a 6-digit code will be sent to ${email} to confirm the change.`}
          </p>
          <FormError message={error} />
          <Button type="button" onClick={sendCode} disabled={pending} className={primaryBtn}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {fr ? "Recevoir un code par e-mail" : "Email me a code"}
          </Button>
        </div>
      )}
      {step === "code" && (
        <form action={change} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {fr ? `Code envoyé à ${email}. Il expire dans 15 minutes.` : `Code sent to ${email}. It expires in 15 minutes.`}
          </p>
          <Field label={fr ? "Code reçu par e-mail" : "Code from the email"} htmlFor="pw-code">
            <CodeInput id="pw-code" name="code" required />
          </Field>
          <Field label={fr ? "Nouveau mot de passe" : "New password"} htmlFor="pw-new">
            <PasswordInput id="pw-new" name="password" required minLength={8} autoComplete="new-password" placeholder={fr ? "8 caractères minimum" : "At least 8 characters"} />
          </Field>
          <Field label={fr ? "Confirmer le mot de passe" : "Confirm password"} htmlFor="pw-confirm">
            <PasswordInput id="pw-confirm" name="confirm" required minLength={8} autoComplete="new-password" placeholder={fr ? "Retapez le mot de passe" : "Type the password again"} />
          </Field>
          <FormError message={error} />
          {info && <Success>{info}</Success>}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending} className={primaryBtn}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {fr ? "Changer le mot de passe" : "Change password"}
            </Button>
            <button type="button" onClick={sendCode} disabled={pending} className="text-sm font-medium text-[#064E3B] hover:underline disabled:opacity-50 dark:text-emerald-400">
              {fr ? "Renvoyer le code" : "Resend code"}
            </button>
          </div>
        </form>
      )}
      {step === "done" && (
        <Success>
          {fr
            ? "Mot de passe changé. Vos autres appareils ont été déconnectés."
            : "Password changed. Your other devices were signed out."}
        </Success>
      )}
    </Panel>
  )
}

function BecomeTeacher({ profile }: { profile: Profile }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const certified = profile.certificates.length > 0
  const app = profile.application

  function apply(form: FormData) {
    setError(null)
    start(async () => {
      const res = await applyTeacherAction(Object.fromEntries(form))
      if (!res.ok) return setError(res.error)
      router.refresh()
    })
  }

  return (
    <Panel title={fr ? "Devenir formateur" : "Become a teacher"} icon={GraduationCap} className="mt-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          <p className="text-sm text-muted-foreground">
            {fr
              ? "Une fois certifié, vous pouvez enseigner sur Linko Academy : créez vos cours, donnez des cours en direct et gagnez 90 % de chaque vente."
              : "Once certified, you can teach on Linko Academy: create courses, teach live and earn 90% of each sale."}
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{fr ? "Vos certifications" : "Your certificates"}</p>
          {certified ? (
            <ul className="mt-2 space-y-2">
              {profile.certificates.map((c) => (
                <li key={c.code} className="flex items-center gap-2 text-sm">
                  <Award className="size-4 shrink-0 text-amber-500" />
                  <span className="min-w-0 flex-1 truncate">{localize(c.title, locale)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(c.issuedAt, locale)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {fr ? "Aucune pour l'instant. Réussissez l'examen d'un cours (70 % ou plus) pour obtenir votre certification." : "None yet. Pass a course exam (70% or more) to earn your certificate."}
            </p>
          )}
        </div>

        {app?.status === "pending" ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            <p className="font-medium">{fr ? "Candidature envoyée" : "Application sent"}</p>
            <p className="mt-1 text-muted-foreground">
              {fr ? "Envoyée le" : "Sent on"} {formatDate(app.createdAt, locale)}.{" "}
              {fr ? "L'administration vous répondra par e-mail." : "The administration will answer by email."}
            </p>
          </div>
        ) : !certified ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <BadgeCheck className="size-5 shrink-0" />
            {fr ? "La candidature s'ouvre dès votre première certification." : "The application opens with your first certificate."}
          </div>
        ) : (
          <form action={apply} className="space-y-4">
            {app?.status === "rejected" && (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                {fr ? "Votre précédente candidature n'a pas été retenue. Vous pouvez postuler à nouveau." : "Your previous application wasn't accepted. You can apply again."}
                {app.note && <span className="mt-1 block italic">« {app.note} »</span>}
              </p>
            )}
            <Field label={fr ? "Spécialité" : "Expertise"} htmlFor="a-exp">
              <Input id="a-exp" name="expertise" required minLength={2} maxLength={120} placeholder={fr ? "Ex. : Python, développement web" : "e.g. Python, web development"} />
            </Field>
            <Field label={fr ? "Pourquoi voulez-vous enseigner ?" : "Why do you want to teach?"} htmlFor="a-mot">
              <Textarea
                id="a-mot"
                name="motivation"
                required
                minLength={40}
                maxLength={2000}
                rows={4}
                placeholder={fr ? "Ce que vous souhaitez enseigner, à qui, et pourquoi (40 caractères minimum)…" : "What you want to teach, to whom, and why (at least 40 characters)…"}
              />
            </Field>
            <Field label={fr ? "Expérience (facultatif)" : "Experience (optional)"} htmlFor="a-exp2">
              <Textarea
                id="a-exp2"
                name="experience"
                maxLength={2000}
                rows={3}
                placeholder={fr ? "Projets, emplois, cours déjà donnés, liens…" : "Projects, jobs, classes you've taught, links…"}
              />
            </Field>
            <FormError message={error} />
            <Button type="submit" disabled={pending} className={primaryBtn}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {fr ? "Envoyer ma candidature" : "Send my application"}
            </Button>
          </form>
        )}
      </div>
    </Panel>
  )
}
