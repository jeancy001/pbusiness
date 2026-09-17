"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)
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
      router.push(
        res.role === "client"
          ? "/dashboard/client"
          : "/dashboard/student",
      )
      router.refresh()
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="rounded-2xl border border-[#064E3B]/15 bg-card p-8 shadow-sm transition-all duration-200 hover:border-[#064E3B]/25 hover:shadow-md dark:border-emerald-800/40 dark:hover:border-emerald-700/60">
      {/* Header */}
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("auth.register.title")}
      </h1>

      <p className="mt-1 text-sm text-muted-foreground">
        {t("auth.register.subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {/* Account Type */}
        <div className="grid gap-2">
          <Label>{t("auth.accountType")}</Label>

          <div className="grid grid-cols-2 gap-3">
            {(["student", "client"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30",
                  role === r
                    ? [
                        "border-[#064E3B]",
                        "bg-[#064E3B]",
                        "text-white",
                        "shadow-sm",
                        "dark:border-emerald-700",
                        "dark:bg-[#064E3B]",
                        "dark:text-white",
                      ].join(" ")
                    : [
                        "border-border",
                        "bg-background",
                        "text-muted-foreground",
                        "hover:border-[#064E3B]/50",
                        "hover:bg-[#064E3B]/5",
                        "hover:text-[#064E3B]",
                        "dark:hover:border-emerald-700",
                        "dark:hover:bg-emerald-950/40",
                        "dark:hover:text-emerald-400",
                      ].join(" "),
                )}
              >
                {r === "student"
                  ? t("auth.role.student")
                  : t("auth.role.client")}
              </button>
            ))}
          </div>
        </div>

        {/* Full Name */}
        <div className="grid gap-2">
          <Label htmlFor="name">
            {t("auth.fullName")}
          </Label>

          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

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
          <Label htmlFor="password">
            {t("auth.password")}
          </Label>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              className={cn(
                "absolute right-0 top-0 flex h-10 w-10 items-center justify-center",
                "rounded-r-lg text-muted-foreground transition-colors",
                "hover:text-[#064E3B]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30",
                "dark:hover:text-emerald-400",
              )}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Minimum 8 characters
          </p>
        </div>

        {/* Terms */}
        <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className={cn(
              "mt-0.5 size-4 rounded border-input",
              "accent-[#064E3B]",
              "focus:ring-[#064E3B]/30",
            )}
          />

          <span>{t("auth.acceptTerms")}</span>
        </label>

        {/* Error */}
        {error && (
          <p
            className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Register */}
        <Button
          type="submit"
          size="lg"
          disabled={!accepted || loading}
          className="mt-2 w-full"
        >
          {loading ? "…" : t("nav.register")}
        </Button>
      </form>

      {/* Login */}
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