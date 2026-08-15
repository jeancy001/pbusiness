"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { useAuth, type UserRole } from "@/lib/auth/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function RegisterForm() {
  const { t } = useI18n()
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("student")
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accepted) return
    setError(null)
    setLoading(true)
    const res = await register(name, email, password, role)
    setLoading(false)
    if (res.ok) {
      router.push(res.role === "client" ? "/dashboard/client" : "/dashboard/student")
      router.refresh()
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h1 className="font-heading text-2xl font-bold">{t("auth.register.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth.register.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid gap-2">
          <Label>{t("auth.accountType")}</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["student", "client"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                  role === r
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40",
                )}
              >
                {r === "student" ? t("auth.role.student") : t("auth.role.client")}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">{t("auth.fullName")}</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 size-4 rounded border-input accent-primary"
          />
          <span>{t("auth.acceptTerms")}</span>
        </label>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={!accepted || loading} className="mt-2 w-full">
          {loading ? "…" : t("nav.register")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("nav.login")}
        </Link>
      </p>
    </div>
  )
}
