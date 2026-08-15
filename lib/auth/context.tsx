"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { loginAction, registerAction, logoutAction, type AuthResult } from "@/lib/auth/actions"

export type UserRole = "student" | "client" | "admin"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

type AuthContextValue = {
  user: SessionUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  register: (name: string, email: string, password: string, role: UserRole) => Promise<AuthResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode
  initialUser?: SessionUser | null
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser)

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const res = await loginAction({ email, password })
    if (res.ok) {
      const name = email.split("@")[0].replace(/[._-]/g, " ")
      setUser({ id: "session", name, email, role: res.role as UserRole })
    }
    return res
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole): Promise<AuthResult> => {
      const res = await registerAction({ name, email, password, role })
      if (res.ok) setUser({ id: "session", name, email, role: res.role as UserRole })
      return res
    },
    [],
  )

  const logout = useCallback(async () => {
    await logoutAction()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
