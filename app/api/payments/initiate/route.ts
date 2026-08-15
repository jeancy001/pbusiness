import { randomUUID } from "crypto"
import { z } from "zod"
import { isDbConfigured } from "@/lib/db/mongodb"
import { payments, type PaymentProvider } from "@/lib/db/models"
import { getSession } from "@/lib/auth/session"
import { getFormationBySlug } from "@/lib/data/catalog"
import { initiatePayment, providerConfigured } from "@/lib/payments/providers"

const schema = z.object({
  provider: z.enum(["pawapay", "avadapay"]),
  kind: z.enum(["formation", "subscription", "project"]),
  targetSlug: z.string().min(1).max(120).optional(),
  phone: z.string().min(6).max(20),
  network: z.string().max(40).optional(),
  currency: z.string().min(3).max(5).default("USD"),
})

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid payment request." }, { status: 400 })
  }
  const { provider, kind, targetSlug, phone, network, currency } = parsed.data
  const session = await getSession()

  // Recompute the amount server-side — never trust a client-sent price.
  let amountUsd = 0
  let label = { fr: "Paiement", en: "Payment" }
  if (kind === "formation") {
    if (!targetSlug) return Response.json({ ok: false, error: "Missing course." }, { status: 400 })
    const formation = await getFormationBySlug(targetSlug)
    if (!formation) return Response.json({ ok: false, error: "Course not found." }, { status: 404 })
    amountUsd = formation.priceUsd
    label = { fr: formation.title.fr, en: formation.title.en }
  } else if (kind === "subscription") {
    amountUsd = 15
    label = { fr: "Abonnement étudiant", en: "Student subscription" }
  } else {
    amountUsd = 0
    label = { fr: "Acompte projet", en: "Project deposit" }
  }

  if (amountUsd <= 0) {
    return Response.json({ ok: false, error: "Invalid amount." }, { status: 400 })
  }

  const reference = randomUUID()

  const result = await initiatePayment(provider as PaymentProvider, {
    reference,
    amountUsd,
    currency,
    phone,
    network,
    description: label.en,
  })

  // Persist the payment when the DB is available.
  if (isDbConfigured()) {
    try {
      const col = await payments()
      await col.insertOne({
        reference,
        userId: session?.userId,
        provider: provider as PaymentProvider,
        kind,
        targetSlug,
        label,
        amountUsd,
        currency,
        phone,
        status: result.status,
        providerRef: result.providerRef,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } catch {
      // Non-fatal: still return the reference so the client can poll.
    }
  }

  return Response.json({
    ok: result.ok,
    reference,
    status: result.status,
    simulated: !providerConfigured(provider as PaymentProvider),
    amountUsd,
    error: result.error,
  })
}
