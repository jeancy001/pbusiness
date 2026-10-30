"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { cn } from "@/lib/utils"

// Everyone signs up as a student, then verifies their email with a 6-digit code.
export function RegisterForm() {
  const { t, locale } = useI18n()
  const fr = locale === "fr"
  const { register } = useAuth()
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accepted) return
    if (password !== confirm) {
      setError(fr ? "Les mots de passe ne correspondent pas." : "Passwords don't match.")
      return
    }
    setError(null)
    setLoading(true)
    const res = await register(name, email, password, locale)
    setLoading(false)
    if (res.ok) {
      router.push(res.verified ? "/dashboard/student" : "/verify-email")
      router.refresh()
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{t("auth.register.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth.register.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">{t("auth.fullName")}</Label>
          <Input
            id="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={fr ? "Ex. : Grâce Mbuyi" : "e.g. Grace Mbuyi"}
          />
        </div>

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
          <p className="text-xs text-muted-foreground">
            {fr ? "Un code de vérification à 6 chiffres vous sera envoyé." : "A 6-digit verification code will be sent to you."}
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
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

        <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className={cn("mt-0.5 size-4 rounded border-input", "accent-[#064E3B]", "focus:ring-[#064E3B]/30")}
          />
          <span>{t("auth.acceptTerms")}</span>
        </label>

        {error && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={!accepted || loading} className="mt-2 w-full">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t("nav.register")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.haveAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-[#064E3B] transition-colors hover:text-[#053D2E] hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          {t("nav.login")}
        </Link>
      </p>
    </div>
  )
}
