import "server-only"
import { timingSafeEqual } from "crypto"
import { customerPaysDigitalCharge } from "@/lib/payments/fx"

// Swychr (AccountPe) Direct API — mobile money / digital cash collection.
// Payments settle asynchronously; Swychr calls the per-payment callback
// URLs we pass on creation (see app/api/payments/swychr/callback).

// ACCOUNTPE_* is the primary naming (SWYCHR_* accepted as an alias).
const env = (name: string) => (process.env[`ACCOUNTPE_${name}`] ?? process.env[`SWYCHR_${name}`])?.trim()

// Accept the host with or without the /api suffix.
const API_BASE = (env("BASE_URL") || "https://api.accountpe.com").replace(/\/+$/, "").replace(/\/api$/, "") + "/api"
const API_KEY = env("API_TOKEN") || env("API_KEY")

const DEFAULT_COUNTRIES = "CD,CG,CM,CI,SN,BF,KE,UG,TZ,RW,NG,GH,ZA,BJ,ML,TG,GN,ZM"

export function swychrConfigured() {
  return Boolean(API_KEY)
}

/** Countries offered at checkout; each is checked live against payout_methods. */
export function swychrCountries(): string[] {
  return (env("PAYOUT_COUNTRY_CODES") || env("COUNTRIES") || DEFAULT_COUNTRIES)
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c))
}

type Envelope<T> = { data: T; message?: string; status: number }

async function call<T>(path: string, body: unknown): Promise<Envelope<T>> {
  if (!API_KEY) throw new Error("Swychr is not configured. Set ACCOUNTPE_API_TOKEN.")
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Api-Key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const json = (await res.json().catch(() => null)) as (Envelope<T> & { errors?: unknown }) | null
  if (!json) throw new Error(`Swychr returned an invalid response (${res.status})`)
  const status = res.ok ? json.status ?? 200 : res.status
  if (status >= 400) {
    // Errors come back as { message } or { errors: "..." }.
    const detail = json.message || (typeof json.errors === "string" ? json.errors : JSON.stringify(json.errors ?? ""))
    if (status === 401 || status === 403) throw new Error(`Swychr rejected the API key: ${detail}`)
    throw new SwychrError(detail || `Swychr request failed (${status})`)
  }
  return json
}

/** A request Swychr refused for a reason the customer can act on. */
export class SwychrError extends Error {}

// ============================================================
// PAYMENT METHODS
// ============================================================

export type CountryMethods = {
  country: string
  countryCode: string
  currency: string
  methods: { method: string; mobileFormat: string; mobileLength: number }[]
}

const methodsCache = new Map<string, { at: number; value: CountryMethods | null }>()

export async function paymentMethods(countryCode: string): Promise<CountryMethods | null> {
  const cached = methodsCache.get(countryCode)
  if (cached && Date.now() - cached.at < 30 * 60_000) return cached.value

  let value: CountryMethods | null = null
  try {
    const { data } = await call<{
      country: string
      country_code: string
      currency_code: string
      payment_methods?: { payment_method: string; mobile_format: string; applicable_mobileno_length: string }[]
    }>("/payout/payout_methods", { country_code: countryCode })
    if (data?.payment_methods?.length) {
      value = {
        country: data.country,
        countryCode: data.country_code,
        currency: data.currency_code,
        methods: data.payment_methods.map((m) => ({
          method: m.payment_method,
          mobileFormat: m.mobile_format,
          mobileLength: Number(m.applicable_mobileno_length) || 0,
        })),
      }
    }
  } catch (error) {
    // Auth/network failures propagate and are not cached; an unsupported country is.
    if (!(error instanceof SwychrError)) throw error
  }
  methodsCache.set(countryCode, { at: Date.now(), value })
  return value
}

// ============================================================
// COLLECTION
// ============================================================

export async function createPaymentRequest(input: {
  transactionId: string
  countryCode: string
  amount: number
  name: string
  email?: string
  mobile: string
  paymentMethod: string
  description: string
  omOtp?: string
  callbackUrl: string
  failedCallbackUrl: string
}) {
  const { data } = await call<{ id: number; status: number }>("/payin/create_payment_request", {
    country_code: input.countryCode,
    name: input.name,
    transaction_id: input.transactionId,
    amount: input.amount,
    email: input.email,
    mobile: input.mobile,
    payment_method: input.paymentMethod,
    description: input.description,
    pass_digital_charge: customerPaysDigitalCharge(),
    om_otp: input.omOtp,
    callback_url: input.callbackUrl,
    failed_callback_url: input.failedCallbackUrl,
    source: "P Business Online",
  })
  return { providerRef: data?.id ? String(data.id) : undefined }
}

/** Orange Money needs a customer OTP in these countries. */
export function requiresOrangeOtp(countryCode: string, method: string) {
  return method.toUpperCase() === "ORANGE" && ["CI", "SN", "BF"].includes(countryCode)
}

// ============================================================
// PAYOUTS (Swychr Payout API)
// Amounts are in the destination currency. Swychr debits amount + its fee
// from the fiat wallet in that currency; the beneficiary gets the full amount.
// ============================================================

export async function createPayout(input: {
  transactionId: string
  countryCode: string
  beneficiaryName: string
  mobile: string
  amount: number
  paymentMethod: string
  remarks: string
  payeeEmail?: string
}) {
  const res = await call<{ status?: string; transaction_id?: string }>("/payout/create_transaction", {
    country_code: input.countryCode,
    beneficiary_name: input.beneficiaryName,
    mobile_no: input.mobile,
    amount: input.amount,
    transaction_id: input.transactionId,
    payment_method: input.paymentMethod,
    remarks: input.remarks,
    payee_email: input.payeeEmail,
    sender_name: "P Business Online",
  })
  return { status: res.data?.status ?? "PENDING" }
}

/** PENDING | PROCESSING | SUCCESS | FAILED | REFUNDED, or null if Swychr has no such payout. */
export async function payoutStatus(transactionId: string): Promise<string | null> {
  try {
    const res = await call<{ status?: string }>("/payout/transaction_status", { transaction_id: transactionId })
    return res.data?.status?.toUpperCase() ?? null
  } catch (error) {
    if (error instanceof SwychrError && /not found/i.test(error.message)) return null
    throw error
  }
}

export async function walletBalances(): Promise<{ currency: string; balance: number }[]> {
  if (!API_KEY) return []
  const res = await fetch(`${API_BASE}/payout/current_balance`, { headers: { "Api-Key": API_KEY }, cache: "no-store" })
  const json = (await res.json().catch(() => null)) as { data?: { currency_code: string; current_bal: number }[]; status?: number } | null
  return Array.isArray(json?.data) ? json.data.map((w) => ({ currency: w.currency_code, balance: Number(w.current_bal) })) : []
}

/** Payouts here go to mobile money; bank channels need extra beneficiary details. */
export function isMobilePayoutMethod(method: string) {
  return !/bank/i.test(method)
}

export function webhookHashMatches(received: string | null) {
  const expected = env("WEBHOOK_HASH")
  if (!expected || !received) return false
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
