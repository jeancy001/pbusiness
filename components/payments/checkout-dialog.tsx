"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import {
CheckCircle2,
Loader2,
Smartphone,
XCircle,
} from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
Dialog,
DialogContent,
DialogDescription,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog"

import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select"

// ============================================================
// TYPES
// ============================================================

type Phase =
| "form"
| "processing"
| "success"
| "failed"

type PaymentCountry = {
code: string
name: string
currency: string
symbol: string
locale: string
callingCode: string
networks: Record<string, string>
}

type PaymentResponse = {
ok: boolean
provider?: "pawapay"
reference?: string
providerRef?: string
status?: "pending" | "success" | "failed"
amountUsd?: number
amount?: number
currency?: string
country?: string
exchangeRate?: number
error?: string
}

// ============================================================
// COUNTRY PAYMENT CONFIGURATION
// ============================================================

const PAYMENT_COUNTRIES: PaymentCountry[] = [
{
code: "CD",
name: "DR Congo",
currency: "CDF",
symbol: "FC",
locale: "fr-CD",
callingCode: "243",
networks: {
VODACOM_COD: "Vodacom M-Pesa",
AIRTEL_COD: "Airtel Money",
ORANGE_COD: "Orange Money",
},
},

{
code: "KE",
name: "Kenya",
currency: "KES",
symbol: "KSh",
locale: "en-KE",
callingCode: "254",
networks: {
MPESA_KEN: "M-Pesa",
AIRTEL_KEN: "Airtel Money",
},
},

{
code: "UG",
name: "Uganda",
currency: "UGX",
symbol: "USh",
locale: "en-UG",
callingCode: "256",
networks: {
MTN_MOMO_UGA: "MTN Mobile Money",
AIRTEL_UGA: "Airtel Money",
},
},

{
code: "TZ",
name: "Tanzania",
currency: "TZS",
symbol: "TSh",
locale: "en-TZ",
callingCode: "255",
networks: {
VODACOM_TZA: "M-Pesa",
AIRTEL_TZA: "Airtel Money",
TIGO_TZA: "Tigo Pesa",
},
},

{
code: "RW",
name: "Rwanda",
currency: "RWF",
symbol: "FRw",
locale: "en-RW",
callingCode: "250",
networks: {
MTN_MOMO_RWA: "MTN MoMo",
AIRTEL_RWA: "Airtel Money",
},
},

{
code: "GH",
name: "Ghana",
currency: "GHS",
symbol: "GH₵",
locale: "en-GH",
callingCode: "233",
networks: {
MTN_MOMO_GHA: "MTN Mobile Money",
VODAFONE_GHA: "Telecel Cash",
AIRTELTIGO_GHA: "AirtelTigo Money",
},
},

{
code: "ZM",
name: "Zambia",
currency: "ZMW",
symbol: "K",
locale: "en-ZM",
callingCode: "260",
networks: {
MTN_MOMO_ZMB: "MTN Mobile Money",
AIRTEL_ZMB: "Airtel Money",
ZAMTEL_ZMB: "Zamtel Money",
},
},

{
code: "CM",
name: "Cameroon",
currency: "XAF",
symbol: "FCFA",
locale: "fr-CM",
callingCode: "237",
networks: {
MTN_MOMO_CMR: "MTN Mobile Money",
ORANGE_CMR: "Orange Money",
},
},

{
code: "CG",
name: "Republic of the Congo",
currency: "XAF",
symbol: "FCFA",
locale: "fr-CG",
callingCode: "242",
networks: {
MTN_MOMO_COG: "MTN Mobile Money",
AIRTEL_COG: "Airtel Money",
},
},

{
code: "SN",
name: "Senegal",
currency: "XOF",
symbol: "FCFA",
locale: "fr-SN",
callingCode: "221",
networks: {
ORANGE_SEN: "Orange Money",
WAVE_SEN: "Wave",
},
},

{
code: "CI",
name: "Côte d'Ivoire",
currency: "XOF",
symbol: "FCFA",
locale: "fr-CI",
callingCode: "225",
networks: {
ORANGE_CIV: "Orange Money",
MTN_MOMO_CIV: "MTN Mobile Money",
MOOV_CIV: "Moov Money",
},
},
]

// ============================================================
// HELPERS
// ============================================================

function getFirstNetwork(
paymentCountry: PaymentCountry,
): string {
return (
Object.keys(paymentCountry.networks)[0] ??
""
)
}

/**

* PawaPay requires digits only.
*
* Removes:
* * -
* * spaces
* * hyphens
* * parentheses
* * dots
*
* Converts local numbers beginning with 0
* into international format using the selected
* country's calling code.
  */
  function normalizePhoneNumber(
  value: string,
  callingCode: string,
  ): string {
  let digits = value.replace(/\D/g, "")

// Convert 00 international prefix.
if (digits.startsWith("00")) {
digits = digits.slice(2)
}

// Already in international format.
if (digits.startsWith(callingCode)) {
return digits
}

// Local number beginning with zero.
if (digits.startsWith("0")) {
digits = digits.slice(1)
}

return `${callingCode}${digits}`
}

/**

* Mobile Money amounts should always
* be displayed as whole numbers.
*
* This includes Kenya KES.
  */
  function formatCurrency(
  amount: number,
  currency: string,
  locale: string,
  ): string {
  try {
  return new Intl.NumberFormat(
  locale,
  {
  style: "currency",
  currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  },
  ).format(Math.round(amount))
  } catch {
  return `${Math.round(
     amount,
   ).toLocaleString()} ${currency}`
  }
  }

// ============================================================
// COMPONENT
// ============================================================

export function CheckoutDialog({
kind,
targetSlug,
amountUsd,
trigger,
}: {
kind: "formation" | "subscription" | "project"
targetSlug?: string
amountUsd: number
trigger: React.ReactNode
}) {
const { t } = useI18n()
const { user } = useAuth()

const [open, setOpen] = useState(false)

const [country, setCountry] =
useState<string>("CD")

const selectedCountry = useMemo(
() =>
PAYMENT_COUNTRIES.find(
(item) => item.code === country,
) ?? PAYMENT_COUNTRIES[0],
[country],
)

const [network, setNetwork] =
useState<string>(() =>
getFirstNetwork(
PAYMENT_COUNTRIES[0],
),
)

const [phone, setPhone] =
useState("")

const [phase, setPhase] =
useState<Phase>("form")

const [error, setError] =
useState<string | null>(null)

const [paymentAmount, setPaymentAmount] =
useState<number | null>(null)

const [
paymentCurrency,
setPaymentCurrency,
] = useState<string | null>(null)

const [
exchangeRate,
setExchangeRate,
] = useState<number | null>(null)

const [reference, setReference] =
useState<string | null>(null)

// ==========================================================
// COUNTRY CHANGE
// ==========================================================

function handleCountryChange(
value: string | null,
) {
if (!value) {
return
}


const nextCountry =
  PAYMENT_COUNTRIES.find(
    (item) => item.code === value,
  )

if (!nextCountry) {
  return
}

setCountry(nextCountry.code)

setNetwork(
  getFirstNetwork(nextCountry),
)

setPhone("")
setPaymentAmount(null)
setPaymentCurrency(null)
setExchangeRate(null)
setError(null)


}

// ==========================================================
// NETWORK CHANGE
// ==========================================================

function handleNetworkChange(
value: string | null,
) {
if (value) {
setNetwork(value)
}
}

// ==========================================================
// POLL PAYMENT STATUS
// ==========================================================

async function pollStatus(
paymentReference: string,
): Promise<"success" | "failed"> {
for (let i = 0; i < 30; i++) {
await new Promise<void>(
(resolve) => {
setTimeout(resolve, 2000)
},
)


  try {
    const response = await fetch(
      `/api/payments/status?reference=${encodeURIComponent(
        paymentReference,
      )}`,
      {
        cache: "no-store",
      },
    )

    const data =
      (await response.json()) as {
        status?: string
      }

    if (data.status === "success") {
      return "success"
    }

    if (data.status === "failed") {
      return "failed"
    }
  } catch {
    // Continue polling.
  }
}

return "failed"


}

// ==========================================================
// INITIATE PAYMENT
// ==========================================================

async function handlePay() {
const normalizedPhone =
normalizePhoneNumber(
phone,
selectedCountry.callingCode,
)


if (normalizedPhone.length < 8) {
  setError(
    "Please enter a valid Mobile Money phone number.",
  )

  return
}

if (!network) {
  setError(
    "Please select a Mobile Money network.",
  )

  return
}

setError(null)
setPhase("processing")

try {
  const response = await fetch(
    "/api/payments/initiate",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        kind,
        targetSlug,

        /**
         * PawaPay-compatible number:
         * digits only, international format.
         */
        phone: normalizedPhone,

        network,

        country:
          selectedCountry.code,
      }),

      cache: "no-store",
    },
  )

  const data =
    (await response.json()) as PaymentResponse

  setReference(
    data.reference ?? null,
  )

  setPaymentAmount(
    typeof data.amount === "number"
      ? data.amount
      : null,
  )

  setPaymentCurrency(
    typeof data.currency === "string"
      ? data.currency
      : selectedCountry.currency,
  )

  setExchangeRate(
    typeof data.exchangeRate === "number"
      ? data.exchangeRate
      : null,
  )

  if (
    !response.ok ||
    !data.ok
  ) {
    throw new Error(
      data.error ??
        "Unable to initiate the payment.",
    )
  }

  if (data.status === "success") {
    setPhase("success")
    return
  }

  if (data.status === "failed") {
    throw new Error(
      data.error ??
        "The payment was rejected.",
    )
  }

  if (!data.reference) {
    throw new Error(
      "Payment reference was not returned.",
    )
  }

  const finalStatus =
    await pollStatus(
      data.reference,
    )

  setPhase(
    finalStatus === "success"
      ? "success"
      : "failed",
  )

  if (finalStatus === "failed") {
    setError(
      "The payment was not completed. Please try again.",
    )
  }
} catch (error) {
  setError(
    error instanceof Error
      ? error.message
      : "Payment failed.",
  )

  setPhase("failed")
}


}

// ==========================================================
// RESET
// ==========================================================

function reset() {
setPhase("form")
setError(null)
setPaymentAmount(null)
setPaymentCurrency(null)
setExchangeRate(null)
setReference(null)
}

// ==========================================================
// DISPLAY AMOUNT
// ==========================================================

const formattedPaidAmount =
paymentAmount !== null &&
paymentCurrency
? formatCurrency(
paymentAmount,
paymentCurrency,
selectedCountry.locale,
)
: null

const phonePlaceholder =
`${selectedCountry.callingCode}...`

// ==========================================================
// RENDER
// ==========================================================

return (
<Dialog
open={open}
onOpenChange={(value) => {
setOpen(value)


    if (!value) {
      reset()
    }
  }}
>
  <DialogTrigger
    render={
      trigger as React.ReactElement
    }
  />

  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Smartphone className="size-5 text-primary" />

        {t("checkout.title")}
      </DialogTitle>

      <DialogDescription>
        Pay securely using PawaPay
        Mobile Money.
      </DialogDescription>
    </DialogHeader>

    {!user &&
      phase === "form" && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t(
            "checkout.loginRequired",
          )}{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline"
          >
            {t("nav.login")}
          </Link>
        </p>
      )}

    {phase === "form" && (
      <div className="flex flex-col gap-4">
        {/* ORIGINAL PRICE */}

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            Original price
          </span>

          <span className="font-heading text-xl font-bold">
            ${amountUsd.toFixed(2)} USD
          </span>
        </div>

        {/* COUNTRY */}

        <div className="grid gap-2">
          <Label>
            Country
          </Label>

          <Select
            value={country}
            onValueChange={
              handleCountryChange
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {PAYMENT_COUNTRIES.map(
                (item) => (
                  <SelectItem
                    key={item.code}
                    value={item.code}
                  >
                    {item.name} —{" "}
                    {item.currency}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        {/* PAYMENT CURRENCY */}

        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="text-xs text-muted-foreground">
            Payment currency
          </div>

          <div className="mt-1 text-lg font-semibold">
            {selectedCountry.symbol}{" "}
            {selectedCountry.currency}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Your USD price will be converted
            to {selectedCountry.currency} on
            the server.
          </p>
        </div>

        {/* PROVIDER */}

        <div className="grid gap-2">
          <Label>
            Payment provider
          </Label>

          <div className="flex items-center gap-3 rounded-md border px-3 py-3">
            <Smartphone className="size-4 text-primary" />

            <div>
              <div className="font-medium">
                PawaPay
              </div>

              <div className="text-xs text-muted-foreground">
                Mobile Money payment
              </div>
            </div>
          </div>
        </div>

        {/* NETWORK */}

        <div className="grid gap-2">
          <Label>
            {t("checkout.network")}
          </Label>

          <Select
            value={network}
            onValueChange={
              handleNetworkChange
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {Object.entries(
                selectedCountry.networks,
              ).map(
                ([code, name]) => (
                  <SelectItem
                    key={code}
                    value={code}
                  >
                    {name}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        {/* PHONE */}

        <div className="grid gap-2">
          <Label htmlFor="phone">
            {t("checkout.phone")}
          </Label>

          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value,
              )
            }
            placeholder={phonePlaceholder}
          />

          <p className="text-xs text-muted-foreground">
            Enter your number with or without
            the country code. Spaces and "+"
            are automatically removed.
          </p>
        </div>

        {/* PAY */}

        <Button
          size="lg"
          onClick={handlePay}
          disabled={
            phone.trim().length < 6 ||
            !network
          }
        >
          {t("checkout.pay")}{" "}
          ${amountUsd.toFixed(2)}
        </Button>
      </div>
    )}

    {/* PROCESSING */}

    {phase === "processing" && (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />

        <p className="text-sm text-muted-foreground">
          {t("checkout.pending")}
        </p>

        {formattedPaidAmount && (
          <div className="rounded-lg bg-muted px-4 py-3 text-sm">
            <div className="text-xs text-muted-foreground">
              Payment amount
            </div>

            <strong className="mt-1 block text-base">
              {formattedPaidAmount}
            </strong>
          </div>
        )}

        {reference && (
          <p className="text-xs text-muted-foreground">
            Reference: {reference}
          </p>
        )}
      </div>
    )}

    {/* SUCCESS */}

    {phase === "success" && (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 className="size-12 text-success" />

        <p className="font-medium">
          {t("checkout.success")}
        </p>

        {formattedPaidAmount && (
          <div className="rounded-lg bg-muted px-4 py-3 text-sm">
            <div className="text-xs text-muted-foreground">
              Paid amount
            </div>

            <strong className="mt-1 block text-base">
              {formattedPaidAmount}
            </strong>
          </div>
        )}

        {exchangeRate !== null && (
          <p className="text-xs text-muted-foreground">
            Exchange rate used: 1 USD ={" "}
            {Math.round(
              exchangeRate,
            ).toLocaleString()}{" "}
            {paymentCurrency ??
              selectedCountry.currency}
          </p>
        )}

        {reference && (
          <p className="text-xs text-muted-foreground">
            Reference: {reference}
          </p>
        )}

        <Button
          asChild
          className="mt-2 w-full"
        >
          <Link href="/dashboard/student">
            {t(
              "checkout.goToDashboard",
            )}
          </Link>
        </Button>
      </div>
    )}

    {/* FAILED */}

    {phase === "failed" && (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <XCircle className="size-12 text-destructive" />

        <p className="font-medium">
          {error ??
            t("checkout.failed")}
        </p>

        {reference && (
          <p className="text-xs text-muted-foreground">
            Reference: {reference}
          </p>
        )}

        <Button
          variant="outline"
          className="mt-2 w-full"
          onClick={reset}
        >
          Try again
        </Button>
      </div>
    )}
  </DialogContent>
</Dialog>


)
}
