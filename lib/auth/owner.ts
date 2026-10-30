import "server-only"

import type { SessionPayload } from "@/lib/auth/session"

// The platform owner is the only account that can withdraw platform revenue
// (commissions, Linko Academy and AI courses, certificates, events, Certified
// Teacher badges). Other main admins can see the figures but not move money.
// Server-only: the address never reaches the browser.

export const PLATFORM_OWNER_EMAIL = (process.env.PLATFORM_OWNER_EMAIL || "jeancympoy24@gmail.com").trim().toLowerCase()

export function isPlatformOwner(session: SessionPayload | null) {
  return Boolean(session && session.role === "admin" && session.email.toLowerCase() === PLATFORM_OWNER_EMAIL && session.emailVerified !== false)
}
