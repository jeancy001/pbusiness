import { getSession } from "@/lib/auth/session"
import { isDbConfigured } from "@/lib/db/mongodb"
import { payments } from "@/lib/db/models"

// Payments are settled by the Swychr callback; this only reports the stored state.
export async function GET(req: Request) {
  const reference = new URL(req.url).searchParams.get("reference")?.trim()
  if (!reference) return Response.json({ ok: false, error: "Missing payment reference." }, { status: 400 })
  if (!isDbConfigured()) return Response.json({ ok: false, error: "Database not configured." }, { status: 503 })

  const session = await getSession()
  if (!session) return Response.json({ ok: false, error: "Payment not found." }, { status: 404 })
  const payment = await (await payments()).findOne({ reference })
  if (!payment || (payment.userId !== session.userId && session.role !== "admin")) {
    return Response.json({ ok: false, error: "Payment not found." }, { status: 404 })
  }

  return Response.json({
    ok: true,
    reference,
    provider: payment.provider,
    status: payment.status,
    amount: payment.amount,
    amountUsd: payment.amountUsd,
    currency: payment.currency,
    country: payment.country,
  })
}
