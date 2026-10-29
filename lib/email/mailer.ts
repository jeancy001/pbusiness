import "server-only"
import nodemailer, { type Transporter } from "nodemailer"

// SMTP via Nodemailer (SMTP_* in the environment). Without SMTP settings,
// emails are logged instead of sent so development never breaks.

let transporter: Transporter | null = null

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function transport(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: true,
    maxConnections: 3,
  })
  return transporter
}

export type Mail = { to: string; subject: string; html: string; text: string }

export async function sendMail(mail: Mail) {
  if (!mailConfigured()) {
    console.info(`[email:dev] to=${mail.to} subject="${mail.subject}"`)
    return
  }
  await transport().sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  })
}

export async function verifyMailer() {
  if (!mailConfigured()) return false
  return transport().verify()
}
