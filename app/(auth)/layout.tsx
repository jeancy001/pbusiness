import { Logo } from "@/components/site/logo"
import { LanguageToggle } from "@/components/site/language-toggle"
import { ThemeToggle } from "@/components/site/theme-toggle"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between px-4 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
