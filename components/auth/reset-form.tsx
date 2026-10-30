"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, MailCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { requestPasswordResetAction, resetPasswordAction } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CodeInput, PasswordInput } from "@/components/ui/password-input"

const roleRoute: Record<string, string> = {
  student: "/dashboard/student",
  client: "/dashboard/client",
  teacher: "/dashboard/teacher",
  admin: "/dashboard/admin",
  staff: "/dashboard/staff",
}

const linkClass =
  "font-medium text-[#064E3B] transition-colors hover:text-[#053D2E] hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"

/** Forgotten password: email → 6-digit code by email → new password. */
export function ResetForm() {
  const { t, locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    const res = await requestPasswordResetAction({ email })
    setLoading(false)
    if (!res.ok) return setError(res.error)
    setStep("code")
    if (e === undefined) setInfo(fr ? "Nouveau code envoyé." : "New code sent.")
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) return setError(fr ? "Les mots de passe ne correspondent pas." : "Passwords don't match.")
    setError(null)
    setLoading(true)
    const res = await resetPasswordAction({ email, code, password })
    setLoading(false)
    if (!res.ok) return setError(res.error)
    router.push(roleRoute[res.role] ?? "/dashboard/student")
    router.refresh()
  }

  const errorBox = error && (
    <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
      {error}
    </p>
  )

  return (
    <div className="w-full">
      {step === "email" ? (
        <>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{t("auth.reset.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fr ? "Saisissez votre e-mail : nous vous enverrons un code à 6 chiffres." : "Enter your email: we'll send you a 6-digit code."}
          </p>
          <form onSubmit={sendCode} className="mt-6 flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={fr ? "vous@exemple.com" : "you@example.com"}
              />
            </div>
            {errorBox}
            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {fr ? "Recevoir le code" : "Send me the code"}
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="flex size-12 items-center justify-center rounded-full bg-[#064E3B]/10 text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-400">
            <MailCheck className="size-6" />
          </div>
          <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight text-foreground">{fr ? "Vérifiez vos e-mails" : "Check your email"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fr
              ? `Si un compte existe pour ${email}, un code à 6 chiffres vient d'y être envoyé. Il expire dans 15 minutes.`
              : `If an account exists for ${email}, a 6-digit code was just sent there. It expires in 15 minutes.`}
          </p>
          <form onSubmit={reset} className="mt-6 flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">{fr ? "Code reçu par e-mail" : "Code from the email"}</Label>
              <CodeInput id="code" required value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{fr ? "Nouveau mot de passe" : "New password"}</Label>
              <PasswordInput
                id="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={fr ? "8 caractères minimum" : "At least 8 characters"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">{fr ? "Confirmer le mot de passe" : "Confirm password"}</Label>
              <PasswordInput
                id="confirm"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={fr ? "Retapez le mot de passe" : "Type the password again"}
              />
            </div>
            {errorBox}
            {info && <p className="text-sm text-success">{info}</p>}
            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {fr ? "Changer le mot de passe" : "Change password"}
            </Button>
            <div className="flex justify-between text-sm">
              <button type="button" className={linkClass} onClick={() => setStep("email")}>
                {fr ? "Changer d'e-mail" : "Use another email"}
              </button>
              <button type="button" className={linkClass} disabled={loading} onClick={() => sendCode()}>
                {fr ? "Renvoyer le code" : "Resend code"}
              </button>
            </div>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className={linkClass}>
          {t("nav.login")}
        </Link>
      </p>
    </div>
  )
}
