"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { useAuth, type UserRole } from "@/lib/auth/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const roleRoute: Record<UserRole, string> = {
  student: "/dashboard/student",
  client: "/dashboard/client",
  admin: "/dashboard/admin",
}

export function LoginForm() {
  const { t } = useI18n()
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await login(email, password)
    setLoading(false)
    if (res.ok) {
      router.push(roleRoute[res.role as UserRole] ?? "/dashboard/student")
      router.refresh()
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h1 className="font-heading text-2xl font-bold">{t("auth.login.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth.login.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Link href="/reset-password" className="text-xs text-primary hover:underline">
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
          {loading ? "…" : t("nav.login")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t("nav.register")}
        </Link>
      </p>
    </div>
  )
}
