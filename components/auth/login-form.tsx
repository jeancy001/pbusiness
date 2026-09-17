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
    <div className="rounded-2xl border border-[#064E3B]/15 bg-card p-8 shadow-sm transition-all duration-200 hover:border-[#064E3B]/25 hover:shadow-md dark:border-emerald-800/40 dark:hover:border-emerald-700/60">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground transition-colors duration-150">
          {t("auth.login.title")}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {t("auth.login.subtitle")}
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {/* Email */}
        <div className="grid gap-2">
          <Label htmlFor="email">
            {t("auth.email")}
          </Label>

          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
          />
        </div>

        {/* Password */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">
              {t("auth.password")}
            </Label>

            <Link
              href="/reset-password"
              className="text-xs font-medium text-[#064E3B] transition-colors hover:text-[#053D2E] hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
            >
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

        {/* Error */}
        {error && (
          <p
            className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="mt-2 w-full"
        >
          {loading ? "…" : t("nav.login")}
        </Button>
      </form>

      {/* Register */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}

        <Link
          href="/register"
          className="font-medium text-[#064E3B] transition-colors hover:text-[#053D2E] hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          {t("nav.register")}
        </Link>
      </p>
    </div>
  )
}