import "server-only"

// One branded layout for every notification. Inline styles only: email
// clients ignore <style> blocks and external CSS.

export type EmailLocale = "fr" | "en"

export const emailLocale = (locale?: string | null): EmailLocale => (locale === "fr" || !locale ? "fr" : "en")

export function appUrl(path = "") {
  return `${(process.env.NEXT_PUBLIC_APP_URL || "https://www.p-bonline.dev").replace(/\/$/, "")}${path}`
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

export type EmailContent = {
  subject: string
  preheader?: string
  heading: string
  /** Plain paragraphs (escaped). */
  paragraphs: string[]
  /** Key/value lines shown in a summary box. */
  details?: [string, string][]
  cta?: { label: string; href: string }
  locale: EmailLocale
}

export function render(c: EmailContent) {
  const footer =
    c.locale === "fr"
      ? "Vous recevez cet e-mail car vous avez un compte sur P Business Online · Linko Academy."
      : "You are receiving this email because you have an account on P Business Online · Linko Academy."

  const html = `<!doctype html><html lang="${c.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.subject)}</title></head>
<body style="margin:0;background:#f4f6f5;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#1f2a27">
<span style="display:none;max-height:0;overflow:hidden">${esc(c.preheader ?? c.heading)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3e8e6">
<tr><td style="background:#064E3B;padding:22px 28px">
  <span style="display:inline-block;width:30px;height:30px;border-radius:8px;background:#ffffff;color:#064E3B;font-weight:800;font-size:15px;line-height:30px;text-align:center;vertical-align:middle">L</span>
  <span style="color:#ffffff;font-weight:700;font-size:16px;vertical-align:middle;margin-left:10px">Linko Academy</span>
  <span style="color:#a7f3d0;font-size:12px;vertical-align:middle;margin-left:6px">· P Business Online</span>
</td></tr>
<tr><td style="padding:30px 28px 8px">
  <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f1f1a">${esc(c.heading)}</h1>
  ${c.paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3b4a45">${esc(p)}</p>`).join("")}
  ${
    c.details?.length
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;background:#f6faf8;border:1px solid #e3ece8;border-radius:12px">${c.details
          .map(
            ([k, v]) =>
              `<tr><td style="padding:9px 14px;font-size:13px;color:#6b7c76">${esc(k)}</td><td style="padding:9px 14px;font-size:13px;color:#0f1f1a;font-weight:600;text-align:right">${esc(v)}</td></tr>`,
          )
          .join("")}</table>`
      : ""
  }
  ${
    c.cta
      ? `<p style="margin:22px 0 26px"><a href="${esc(c.cta.href)}" style="display:inline-block;background:#064E3B;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px">${esc(c.cta.label)}</a></p>`
      : ""
  }
</td></tr>
<tr><td style="padding:16px 28px 26px;border-top:1px solid #eef2f0;font-size:12px;line-height:1.5;color:#8a9893">${esc(footer)}<br>© ${new Date().getFullYear()} P Business Online</td></tr>
</table></td></tr></table></body></html>`

  const text = [
    c.heading,
    "",
    ...c.paragraphs,
    ...(c.details?.length ? ["", ...c.details.map(([k, v]) => `${k}: ${v}`)] : []),
    ...(c.cta ? ["", `${c.cta.label}: ${c.cta.href}`] : []),
    "",
    "— Linko Academy · P Business Online",
  ].join("\n")

  return { subject: c.subject, html, text }
}
