import { SWYCHR_DIGITAL_CHARGE_RATE, customerPaysDigitalCharge, usdRate } from "@/lib/payments/fx"
import { paymentMethods, swychrConfigured, swychrCountries } from "@/lib/payments/swychr"

// Without ?country: countries offered at checkout. With it: live methods + currency.
export async function GET(req: Request) {
  if (!swychrConfigured()) return Response.json({ ok: false, error: "Payments are not configured." }, { status: 503 })

  const country = new URL(req.url).searchParams.get("country")?.toUpperCase()
  if (!country) return Response.json({ ok: true, countries: swychrCountries() })
  if (!swychrCountries().includes(country)) return Response.json({ ok: false, error: "Unsupported country." }, { status: 400 })

  let data
  try {
    data = await paymentMethods(country)
  } catch (error) {
    console.error("Swychr payment methods error:", error)
    return Response.json({ ok: false, error: "Payment service unavailable. Please try again later." }, { status: 502 })
  }
  if (!data) return Response.json({ ok: false, error: "No payment method available in this country." }, { status: 404 })

  const fx = await usdRate(data.currency).catch(() => null)
  return Response.json({
    ok: true,
    ...data,
    otpRequired: ["CI", "SN", "BF"].includes(country) ? ["ORANGE"] : [],
    usdRate: fx?.rate ?? null,
    rateUpdatedAt: fx?.updatedAt ?? null,
    digitalChargeRate: customerPaysDigitalCharge() ? SWYCHR_DIGITAL_CHARGE_RATE : 0,
  })
}
