"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MailCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { resendVerificationAction, verifyEmailAction } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CodeInput } from "@/components/ui/password-input"

/** After sign-up: enter the 6-digit code sent to the new address. */
export function VerifyForm({ email, next }: { email: string; next: string }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const { logout } = useAuth()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await verifyEmailAction(code)
    setLoading(false)
    if (!res.ok) return setError(res.error)
    router.push(next)
    router.refresh()
  }

  async function resend() {
    setError(null)
    setInfo(null)
    const res = await resendVerificationAction()
    if (!res.ok) return setError(res.error)
    setInfo(fr ? "Nouveau code envoyé." : "New code sent.")
  }

  return (
    <div className="w-full">
      <div className="flex size-12 items-center justify-center rounded-full bg-[#064E3B]/10 text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-400">
        <MailCheck className="size-6" />
      </div>
      <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight text-foreground">{fr ? "Vérifiez votre e-mail" : "Verify your email"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {fr ? "Nous avons envoyé un code à 6 chiffres à " : "We sent a 6-digit code to "}
        <span className="font-medium text-foreground">{email}</span>.{" "}
        {fr ? "Saisissez-le pour activer votre compte." : "Enter it to activate your account."}
      </p>

      <form onSubmit={verify} className="mt-6 flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="code">{fr ? "Code de vérification" : "Verification code"}</Label>
          <CodeInput id="code" required autoFocus value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        {error && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {info && <p className="text-sm text-success">{info}</p>}
        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {fr ? "Vérifier mon e-mail" : "Verify my email"}
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {fr ? "Pas reçu ? Regardez dans les spams ou " : "Didn't get it? Check spam or "}
          <button type="button" onClick={resend} className="font-medium text-[#064E3B] hover:underline dark:text-emerald-400">
            {fr ? "renvoyez le code" : "resend the code"}
          </button>
        </span>
        <button
          type="button"
          onClick={async () => {
            await logout()
            router.push("/register")
          }}
          className="hover:text-foreground hover:underline"
        >
          {fr ? "Mauvaise adresse ?" : "Wrong address?"}
        </button>
      </div>
    </div>
  )
}
