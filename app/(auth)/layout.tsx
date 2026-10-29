import { AuthAside } from "@/components/auth/auth-aside"
import { Logo } from "@/components/site/logo"
import { LanguageToggle } from "@/components/site/language-toggle"
import { ThemeToggle } from "@/components/site/theme-toggle"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <AuthAside />
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-5 sm:px-8">
          <Logo />
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-6 sm:px-8">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
    </div>
  )
}
