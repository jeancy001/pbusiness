import "server-only"
import type { PaymentProvider } from "@/lib/db/models"

export type InitiateInput = {
  reference: string
  amountUsd: number
  currency: string
  phone: string
  network?: string
  description: string
}

export type InitiateResult = {
  ok: boolean
  status: "pending" | "success" | "failed"
  providerRef?: string
  error?: string
}

// ---- PawaPay (V2 REST) --------------------------------------------------
// Docs: POST {base}/v2/deposits with a UUIDv4 depositId. Final status via
// polling GET /v2/deposits/{id} or webhooks.

function pawapayBase() {
  return process.env.PAWAPAY_BASE_URL || "https://api.sandbox.pawapay.io"
}

export function pawapayConfigured() {
  return Boolean(process.env.PAWAPAY_API_TOKEN)
}

async function initiatePawapay(input: InitiateInput): Promise<InitiateResult> {
  const res = await fetch(`${pawapayBase()}/v2/deposits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAWAPAY_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      depositId: input.reference,
      amount: String(input.amountUsd),
      currency: input.currency,
      payer: {
        type: "MMO",
        accountDetails: {
          phoneNumber: input.phone,
          provider: input.network,
        },
      },
    }),
  })

  const data = (await res.json().catch(() => ({}))) as { status?: string; depositId?: string; message?: string }
  if (!res.ok) {
    return { ok: false, status: "failed", error: data.message || `PawaPay error ${res.status}` }
  }
  // ACCEPTED / SUBMITTED => still processing; COMPLETED => success; others => failed.
  const s = (data.status || "").toUpperCase()
  const status = s === "COMPLETED" ? "success" : s === "FAILED" || s === "REJECTED" ? "failed" : "pending"
  return { ok: true, status, providerRef: data.depositId ?? input.reference }
}

async function checkPawapay(reference: string): Promise<InitiateResult> {
  const res = await fetch(`${pawapayBase()}/v2/deposits/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAWAPAY_API_TOKEN}` },
  })
  const data = (await res.json().catch(() => ({}))) as { status?: string; data?: { status?: string } }
  const s = (data.status || data.data?.status || "").toUpperCase()
  const status = s === "COMPLETED" ? "success" : s === "FAILED" || s === "REJECTED" ? "failed" : "pending"
  return { ok: true, status, providerRef: reference }
}

// ---- AvadaPay (configurable REST adapter) -------------------------------
// AvadaPay has no public API spec; this adapter targets a generic
// deposit/collect endpoint and is driven entirely by env config so the real
// credentials + endpoint can be plugged in without code changes.

function avadapayBase() {
  return process.env.AVADAPAY_BASE_URL || ""
}

export function avadapayConfigured() {
  return Boolean(process.env.AVADAPAY_API_KEY && process.env.AVADAPAY_BASE_URL)
}

async function initiateAvadapay(input: InitiateInput): Promise<InitiateResult> {
  const res = await fetch(`${avadapayBase()}/collect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AVADAPAY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference: input.reference,
      amount: input.amountUsd,
      currency: input.currency,
      phone: input.phone,
      network: input.network,
      description: input.description,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    status?: string
    transactionId?: string
    message?: string
  }
  if (!res.ok) {
    return { ok: false, status: "failed", error: data.message || `AvadaPay error ${res.status}` }
  }
  const s = (data.status || "").toLowerCase()
  const status = s === "success" || s === "completed" ? "success" : s === "failed" ? "failed" : "pending"
  return { ok: true, status, providerRef: data.transactionId ?? input.reference }
}

// ---- Dispatch -----------------------------------------------------------

export function providerConfigured(provider: PaymentProvider) {
  return provider === "pawapay" ? pawapayConfigured() : avadapayConfigured()
}

export async function initiatePayment(
  provider: PaymentProvider,
  input: InitiateInput,
): Promise<InitiateResult> {
  // Simulation fallback: if the provider isn't configured yet, mark the
  // payment as pending so the UX flow works end-to-end in preview.
  if (!providerConfigured(provider)) {
    return { ok: true, status: "pending", providerRef: `SIMULATED-${input.reference}` }
  }
  return provider === "pawapay" ? initiatePayment_pawapay(input) : initiateAvadapay(input)
}

// small indirection so the export name reads clearly above
const initiatePayment_pawapay = initiatePawapay

export async function checkPayment(
  provider: PaymentProvider,
  reference: string,
): Promise<InitiateResult> {
  if (!providerConfigured(provider)) {
    // Simulated: resolve to success so demo enrollments unlock.
    return { ok: true, status: "success", providerRef: `SIMULATED-${reference}` }
  }
  if (provider === "pawapay") return checkPawapay(reference)
  // AvadaPay status check (best-effort, same adapter shape).
  const res = await fetch(`${avadapayBase()}/status/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.AVADAPAY_API_KEY}` },
  })
  const data = (await res.json().catch(() => ({}))) as { status?: string }
  const s = (data.status || "").toLowerCase()
  const status = s === "success" || s === "completed" ? "success" : s === "failed" ? "failed" : "pending"
  return { ok: true, status, providerRef: reference }
}
