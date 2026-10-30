import "server-only"

import { createHmac, randomInt, timingSafeEqual } from "crypto"
import { authCodes, type AuthCodeDoc } from "@/lib/db/lms"
import { mailConfigured, sendMail } from "@/lib/email/mailer"
import { emailLocale, render } from "@/lib/email/template"

// 6-digit codes sent by email to verify an address, reset a forgotten
// password or change a password. Only an HMAC of the code is stored, a code
// expires after 15 minutes, allows 5 attempts and is single-use. A new code
// can be requested once a minute.

const TTL_MS = 15 * 60_000
const RESEND_MS = 60_000
const MAX_ATTEMPTS = 5

export type CodePurpose = AuthCodeDoc["purpose"]

function hash(code: string) {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET is not set.")
  return createHmac("sha256", secret).update(code).digest("hex")
}

let indexed = false
async function codes() {
  const col = await authCodes()
  if (!indexed) {
    indexed = true
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => undefined)
    await col.createIndex({ userId: 1, purpose: 1 }).catch(() => undefined)
  }
  return col
}

const SUBJECT: Record<CodePurpose, { fr: string; en: string }> = {
  verify: { fr: "Votre code de vérification", en: "Your verification code" },
  reset: { fr: "Réinitialisation de votre mot de passe", en: "Reset your password" },
  password: { fr: "Code pour changer votre mot de passe", en: "Code to change your password" },
}

const INTRO: Record<CodePurpose, { fr: string; en: string }> = {
  verify: {
    fr: "Bienvenue ! Saisissez ce code pour vérifier votre adresse e-mail et activer votre compte.",
    en: "Welcome! Enter this code to verify your email address and activate your account.",
  },
  reset: {
    fr: "Vous avez demandé à réinitialiser votre mot de passe. Saisissez ce code pour en choisir un nouveau.",
    en: "You asked to reset your password. Enter this code to choose a new one.",
  },
  password: {
    fr: "Vous avez demandé à changer votre mot de passe depuis votre profil. Saisissez ce code pour confirmer.",
    en: "You asked to change your password from your profile. Enter this code to confirm.",
  },
}

export type IssueResult = { ok: true } | { ok: false; error: string; retryInSec?: number }

/** Creates a new code (replacing any previous one for this purpose) and emails it. */
export async function issueCode(
  user: { id: string; email: string; name: string; locale?: string },
  purpose: CodePurpose,
): Promise<IssueResult> {
  const col = await codes()
  const last = await col.findOne({ userId: user.id, purpose }, { sort: { createdAt: -1 } })
  if (last && Date.now() - last.createdAt.getTime() < RESEND_MS) {
    const retryInSec = Math.ceil((RESEND_MS - (Date.now() - last.createdAt.getTime())) / 1000)
    return { ok: false, error: `Patientez ${retryInSec} s avant de demander un nouveau code. / Wait ${retryInSec}s before asking for a new code.`, retryInSec }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0")
  const now = new Date()
  await col.deleteMany({ userId: user.id, purpose })
  await col.insertOne({ userId: user.id, purpose, codeHash: hash(code), attempts: 0, expiresAt: new Date(now.getTime() + TTL_MS), createdAt: now })

  const l = emailLocale(user.locale)
  const fr = l === "fr"
  // Without SMTP (local development only) the code is printed to the server console.
  if (!mailConfigured() && process.env.NODE_ENV !== "production") console.info(`[email:dev] ${purpose} code for ${user.email}: ${code}`)
  try {
    await sendMail({
      to: user.email,
      ...render({
        locale: l,
        subject: `${code} — ${SUBJECT[purpose][l]}`,
        heading: fr ? `Bonjour ${user.name},` : `Hello ${user.name},`,
        paragraphs: [
          INTRO[purpose][l],
          fr
            ? "Ce code expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre compte reste protégé."
            : "This code expires in 15 minutes. If you didn't ask for it, ignore this email: your account stays safe.",
        ],
        details: [[fr ? "Votre code" : "Your code", code.replace(/(\d{3})(\d{3})/, "$1 $2")]],
      }),
    })
  } catch (error) {
    console.error(`Code email failed: ${String((error as Error)?.message ?? error).slice(0, 200)}`)
    await col.deleteMany({ userId: user.id, purpose })
    return { ok: false, error: "L'e-mail n'a pas pu être envoyé. Réessayez dans un instant. / The email couldn't be sent. Try again shortly." }
  }
  return { ok: true }
}

/** Checks a code; consumes it on success. Wrong codes count towards the attempt limit. */
export async function checkCode(userId: string, purpose: CodePurpose, code: string): Promise<boolean> {
  const clean = code.replace(/\s/g, "")
  if (!/^\d{6}$/.test(clean)) return false
  const col = await codes()
  const doc = await col.findOneAndUpdate(
    { userId, purpose, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" },
  )
  if (!doc) return false
  const a = Buffer.from(doc.codeHash, "hex")
  const b = Buffer.from(hash(clean), "hex")
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false
  await col.deleteOne({ _id: doc._id })
  return true
}
