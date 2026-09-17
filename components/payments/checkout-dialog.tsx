"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import {
  CheckCircle2,
  Download,
  Loader2,
  Smartphone,
  Ticket,
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
// PB-PAY BRAND
// ============================================================

const PB_PAY_GREEN = "#064E3B"
const PB_PAY_GREEN_HOVER = "#053D2E"

// ============================================================
// TYPES
// ============================================================

export type PaymentKind =
  | "formation"
  | "subscription"
  | "project"
  | "ticket"
  | "event"

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

  /**
   * Trusted USD amount calculated by the server.
   */
  amountUsd?: number

  /**
   * Final amount in the selected local currency.
   */
  amount?: number

  currency?: string
  country?: string
  exchangeRate?: number

  /**
   * Ticket code generated for event/ticket payments.
   */
  ticketCode?: string

  error?: string
}

// ============================================================
// PROPS
// ============================================================

type CheckoutDialogProps = {
  kind: PaymentKind

  /**
   * Formation slug, project slug, ticket slug,
   * or event slug.
   */
  targetSlug?: string

  /**
   * Display-only fallback amount.
   *
   * The backend is ALWAYS the source of truth
   * for the actual amount charged.
   */
  amountUsd?: number

  trigger: React.ReactNode
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
      VODACOM_TZA: "Vodacom M-Pesa",
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
      ORANGE_COD: "Orange Money",
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
    Object.keys(paymentCountry.networks)[0] ?? ""
  )
}

function normalizePhoneNumber(
  value: string,
  callingCode: string,
): string {
  let digits = value.replace(/\D/g, "")

  if (digits.startsWith("00")) {
    digits = digits.slice(2)
  }

  if (digits.startsWith(callingCode)) {
    return digits
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1)
  }

  return `${callingCode}${digits}`
}

function formatCurrency(
  amount: number,
  currency: string,
  locale: string,
): string {
  const noDecimalCurrencies = [
    "CDF",
    "KES",
    "UGX",
    "TZS",
    "RWF",
    "XAF",
    "XOF",
  ]

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits:
        noDecimalCurrencies.includes(currency)
          ? 0
          : 2,
      maximumFractionDigits:
        noDecimalCurrencies.includes(currency)
          ? 0
          : 2,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString()} ${currency}`
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
}: CheckoutDialogProps) {
  const { t, locale } = useI18n()
  const { user } = useAuth()

  const [open, setOpen] = useState(false)

  const [country, setCountry] = useState("CD")

  const selectedCountry = useMemo(
    () =>
      PAYMENT_COUNTRIES.find(
        (item) => item.code === country,
      ) ?? PAYMENT_COUNTRIES[0],
    [country],
  )

  const [network, setNetwork] = useState(() =>
    getFirstNetwork(PAYMENT_COUNTRIES[0]),
  )

  const [phone, setPhone] = useState("")

  const [phase, setPhase] =
    useState<Phase>("form")

  const [error, setError] =
    useState<string | null>(null)

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState<number | null>(null)

  const [
    paymentCurrency,
    setPaymentCurrency,
  ] = useState<string | null>(null)

  const [
    serverAmountUsd,
    setServerAmountUsd,
  ] = useState<number | null>(null)

  const [
    exchangeRate,
    setExchangeRate,
  ] = useState<number | null>(null)

  const [reference, setReference] =
    useState<string | null>(null)

  const [
    ticketCode,
    setTicketCode,
  ] = useState<string | null>(null)

  // ==========================================================
  // DERIVED VALUES
  // ==========================================================

  const isTicketPayment =
    kind === "ticket" ||
    kind === "event"

  const isEventPayment =
    kind === "event"

  const displayAmountUsd =
    serverAmountUsd ??
    amountUsd ??
    null

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
    `+${selectedCountry.callingCode}...`

  // ==========================================================
  // COUNTRY CHANGE
  // ==========================================================

  function handleCountryChange(
    value: string | null,
  ) {
    if (!value) return

    const nextCountry =
      PAYMENT_COUNTRIES.find(
        (item) => item.code === value,
      )

    if (!nextCountry) return

    setCountry(nextCountry.code)

    setNetwork(
      getFirstNetwork(nextCountry),
    )

    setPhone("")
    setPaymentAmount(null)
    setPaymentCurrency(null)
    setServerAmountUsd(null)
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
  ): Promise<PaymentResponse> {
    for (let i = 0; i < 30; i++) {
      await new Promise<void>(
        (resolve) =>
          setTimeout(resolve, 2000),
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
          (await response.json()) as PaymentResponse

        if (
          data.status === "success" ||
          data.status === "failed"
        ) {
          return data
        }
      } catch {
        // Continue polling.
      }
    }

    return {
      ok: false,
      status: "failed",
      error:
        locale === "fr"
          ? "La confirmation du paiement a expiré. Veuillez vérifier votre historique de paiement."
          : "Payment confirmation timed out. Please check your payment history.",
    }
  }

  // ==========================================================
  // INITIATE PAYMENT
  // ==========================================================

  async function handlePay() {
    if (!user) {
      setError(
        locale === "fr"
          ? "Veuillez vous connecter avant d'effectuer un paiement."
          : "Please log in before making a payment.",
      )

      return
    }

    const normalizedPhone =
      normalizePhoneNumber(
        phone,
        selectedCountry.callingCode,
      )

    if (normalizedPhone.length < 8) {
      setError(
        locale === "fr"
          ? "Veuillez entrer un numéro Mobile Money valide."
          : "Please enter a valid Mobile Money phone number.",
      )

      return
    }

    if (!network) {
      setError(
        locale === "fr"
          ? "Veuillez sélectionner un réseau Mobile Money."
          : "Please select a Mobile Money network.",
      )

      return
    }

    setError(null)
    setTicketCode(null)
    setReference(null)
    setPaymentAmount(null)
    setPaymentCurrency(null)
    setServerAmountUsd(null)
    setExchangeRate(null)
    setPhase("processing")

    try {
      /**
       * SECURITY:
       *
       * The frontend NEVER sends amountUsd.
       *
       * The backend determines the trusted price
       * using kind + targetSlug.
       */
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
            targetSlug:
              targetSlug || undefined,
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

      setServerAmountUsd(
        typeof data.amountUsd === "number"
          ? data.amountUsd
          : null,
      )

      setPaymentAmount(
        typeof data.amount === "number"
          ? data.amount
          : null,
      )

      setPaymentCurrency(
        typeof data.currency === "string"
          ? data.currency
          : null,
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
            (locale === "fr"
              ? "Impossible d'initialiser le paiement."
              : "Unable to initiate the payment."),
        )
      }

      // ======================================================
      // IMMEDIATE SUCCESS
      // ======================================================

      if (data.status === "success") {
        setTicketCode(
          data.ticketCode ?? null,
        )

        setPhase("success")

        return
      }

      // ======================================================
      // IMMEDIATE FAILURE
      // ======================================================

      if (data.status === "failed") {
        throw new Error(
          data.error ??
            (locale === "fr"
              ? "Le paiement a été refusé."
              : "The payment was rejected."),
        )
      }

      if (!data.reference) {
        throw new Error(
          locale === "fr"
            ? "La référence du paiement n'a pas été retournée."
            : "Payment reference was not returned.",
        )
      }

      // ======================================================
      // WAIT FOR CONFIRMATION
      // ======================================================

      const finalPayment =
        await pollStatus(
          data.reference,
        )

      if (
        typeof finalPayment.amount ===
        "number"
      ) {
        setPaymentAmount(
          finalPayment.amount,
        )
      }

      if (
        typeof finalPayment.currency ===
        "string"
      ) {
        setPaymentCurrency(
          finalPayment.currency,
        )
      }

      if (
        typeof finalPayment.amountUsd ===
        "number"
      ) {
        setServerAmountUsd(
          finalPayment.amountUsd,
        )
      }

      if (
        typeof finalPayment.exchangeRate ===
        "number"
      ) {
        setExchangeRate(
          finalPayment.exchangeRate,
        )
      }

      if (
        finalPayment.status ===
        "success"
      ) {
        setTicketCode(
          finalPayment.ticketCode ??
            null,
        )

        setPhase("success")

        return
      }

      setError(
        finalPayment.error ??
          (locale === "fr"
            ? "Le paiement n'a pas été effectué."
            : "The payment was not completed."),
      )

      setPhase("failed")
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : locale === "fr"
            ? "Le paiement a échoué."
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
    setServerAmountUsd(null)
    setExchangeRate(null)
    setReference(null)
    setTicketCode(null)
  }

  // ==========================================================
  // TEXT HELPERS
  // ==========================================================

  const paymentTitle =
    isEventPayment
      ? locale === "fr"
        ? "Paiement de l'événement"
        : "Event payment"
      : kind === "ticket"
        ? locale === "fr"
          ? "Paiement du billet"
          : "Ticket payment"
        : t("checkout.title")

  const paymentDescription =
    isEventPayment
      ? locale === "fr"
        ? "Payez votre participation à l'événement en toute sécurité avec Mobile Money."
        : "Pay for your event participation securely using Mobile Money."
      : isTicketPayment
        ? locale === "fr"
          ? "Payez votre billet en toute sécurité avec Mobile Money."
          : "Pay for your ticket securely using Mobile Money."
        : locale === "fr"
          ? "Payez en toute sécurité avec Mobile Money."
          : "Pay securely using Mobile Money."

  const priceLabel =
    isEventPayment
      ? locale === "fr"
        ? "Prix de participation"
        : "Participation price"
      : kind === "ticket"
        ? locale === "fr"
          ? "Prix du billet"
          : "Ticket price"
        : locale === "fr"
          ? "Prix"
          : "Price"

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

        {/* ===================================================
            HEADER
        ==================================================== */}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isTicketPayment ? (
              <Ticket
                className="
                  size-5
                  text-[#064E3B]
                  dark:text-emerald-400
                "
              />
            ) : (
              <Smartphone
                className="
                  size-5
                  text-[#064E3B]
                  dark:text-emerald-400
                "
              />
            )}

            {paymentTitle}
          </DialogTitle>

          <DialogDescription>
            {paymentDescription}
          </DialogDescription>
        </DialogHeader>

        {/* ===================================================
            LOGIN REQUIRED
        ==================================================== */}

        {!user &&
          phase === "form" && (
            <p
              className="
                rounded-md
                border
                border-[#064E3B]/20
                bg-[#064E3B]/5
                px-3
                py-2
                text-sm
                text-muted-foreground
              "
            >
              {t(
                "checkout.loginRequired",
              )}{" "}

              <Link
                href="/login"
                className="
                  font-medium
                  text-[#064E3B]
                  underline
                  underline-offset-2
                  hover:text-[#053D2E]
                  dark:text-emerald-400
                  dark:hover:text-emerald-300
                "
              >
                {t("nav.login")}
              </Link>
            </p>
          )}

        {/* ===================================================
            PAYMENT FORM
        ==================================================== */}

        {phase === "form" && (
          <div className="flex flex-col gap-4">

            {/* Amount */}
            {displayAmountUsd !== null && (
              <div
                className="
                  flex
                  items-center
                  justify-between
                  rounded-lg
                  border
                  border-[#064E3B]/20
                  bg-[#064E3B]/5
                  px-4
                  py-3
                "
              >
                <span className="text-sm text-muted-foreground">
                  {priceLabel}
                </span>

                <span
                  className="
                    font-heading
                    text-xl
                    font-bold
                    text-[#064E3B]
                    dark:text-emerald-400
                  "
                >
                  ${displayAmountUsd.toFixed(2)} USD
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {locale === "fr"
                ? "Le montant final dans votre devise locale sera calculé et validé de manière sécurisée par le serveur."
                : "The final amount in your local currency will be securely calculated and validated by the server."}
            </p>

            {/* COUNTRY */}

            <div className="grid gap-2">
              <Label>
                {locale === "fr"
                  ? "Pays"
                  : "Country"}
              </Label>

              <Select
                value={country}
                onValueChange={
                  handleCountryChange
                }
              >
                <SelectTrigger
                  className="
                    focus:border-[#064E3B]
                    focus:ring-[#064E3B]/20
                  "
                >
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

            {/* CURRENCY */}

            <div
              className="
                rounded-lg
                border
                border-[#064E3B]/20
                bg-[#064E3B]/5
                px-4
                py-3
              "
            >
              <div className="text-xs text-muted-foreground">
                {locale === "fr"
                  ? "Devise de paiement"
                  : "Payment currency"}
              </div>

              <div
                className="
                  mt-1
                  text-lg
                  font-semibold
                  text-[#064E3B]
                  dark:text-emerald-400
                "
              >
                {selectedCountry.symbol}{" "}
                {selectedCountry.currency}
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {locale === "fr"
                  ? "Le montant exact sera confirmé avant la demande de paiement."
                  : "The exact amount will be confirmed before the payment request."}
              </p>
            </div>

            {/* PROVIDER */}

            <div className="grid gap-2">
              <Label>
                {locale === "fr"
                  ? "Fournisseur de paiement"
                  : "Payment provider"}
              </Label>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-md
                  border
                  border-[#064E3B]/20
                  bg-[#064E3B]/5
                  px-3
                  py-3
                "
              >
                <div
                  className="
                    flex
                    size-9
                    items-center
                    justify-center
                    rounded-lg
                    bg-[#064E3B]
                    text-white
                  "
                >
                  <Smartphone className="size-4" />
                </div>

                <div>
                  <div className="font-medium">
                    PawaPay
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Mobile Money
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
                <SelectTrigger
                  className="
                    focus:border-[#064E3B]
                    focus:ring-[#064E3B]/20
                  "
                >
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
                placeholder={
                  phonePlaceholder
                }
                className="
                  focus:border-[#064E3B]
                  focus:ring-[#064E3B]/20
                "
              />

              <p className="text-xs text-muted-foreground">
                {locale === "fr"
                  ? "Entrez votre numéro avec ou sans indicatif du pays."
                  : "Enter your number with or without the country code."}
              </p>
            </div>

            {/* PAY */}

            <Button
              size="lg"
              onClick={handlePay}
              disabled={
                !user ||
                phone.trim().length < 6 ||
                !network
              }
              className="
                w-full
                gap-2
                bg-[#064E3B]
                text-white
                shadow-sm
                hover:bg-[#053D2E]
                disabled:bg-[#064E3B]/50
                disabled:text-white/80
              "
            >
              {isEventPayment
                ? locale === "fr"
                  ? "Payer ma participation"
                  : "Pay for my participation"
                : kind === "ticket"
                  ? locale === "fr"
                    ? "Acheter mon billet"
                    : "Buy my ticket"
                  : t("checkout.pay")}
            </Button>
          </div>
        )}

        {/* ===================================================
            PROCESSING
        ==================================================== */}

        {phase === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">

            <div
              className="
                flex
                size-16
                items-center
                justify-center
                rounded-full
                bg-[#064E3B]/10
              "
            >
              <Loader2
                className="
                  size-10
                  animate-spin
                  text-[#064E3B]
                  dark:text-emerald-400
                "
              />
            </div>

            <p className="text-sm text-muted-foreground">
              {t("checkout.pending")}
            </p>

            {formattedPaidAmount && (
              <div
                className="
                  rounded-lg
                  border
                  border-[#064E3B]/20
                  bg-[#064E3B]/5
                  px-4
                  py-3
                  text-sm
                "
              >
                <div className="text-xs text-muted-foreground">
                  {locale === "fr"
                    ? "Montant à payer"
                    : "Payment amount"}
                </div>

                <strong
                  className="
                    mt-1
                    block
                    text-base
                    text-[#064E3B]
                    dark:text-emerald-400
                  "
                >
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

        {/* ===================================================
            SUCCESS
        ==================================================== */}

        {phase === "success" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">

            <div
              className="
                flex
                size-16
                items-center
                justify-center
                rounded-full
                bg-[#064E3B]/10
              "
            >
              <CheckCircle2
                className="
                  size-12
                  text-[#064E3B]
                  dark:text-emerald-400
                "
              />
            </div>

            <p className="font-medium">
              {isEventPayment
                ? locale === "fr"
                  ? "Paiement confirmé ! Votre participation à l'événement est enregistrée."
                  : "Payment confirmed! Your event participation is registered."
                : kind === "ticket"
                  ? locale === "fr"
                    ? "Paiement confirmé ! Votre billet est disponible."
                    : "Payment confirmed! Your ticket is available."
                  : t("checkout.success")}
            </p>

            {formattedPaidAmount && (
              <div
                className="
                  rounded-lg
                  border
                  border-[#064E3B]/20
                  bg-[#064E3B]/5
                  px-4
                  py-3
                  text-sm
                "
              >
                <div className="text-xs text-muted-foreground">
                  {locale === "fr"
                    ? "Montant payé"
                    : "Paid amount"}
                </div>

                <strong
                  className="
                    mt-1
                    block
                    text-base
                    text-[#064E3B]
                    dark:text-emerald-400
                  "
                >
                  {formattedPaidAmount}
                </strong>
              </div>
            )}

            {exchangeRate !== null &&
              paymentCurrency && (
                <p className="text-xs text-muted-foreground">
                  1 USD ={" "}
                  {exchangeRate.toLocaleString()}{" "}
                  {paymentCurrency}
                </p>
              )}

            {reference && (
              <p className="text-xs text-muted-foreground">
                Reference: {reference}
              </p>
            )}

            {/* EVENT OR TICKET DOWNLOAD */}

            {isTicketPayment &&
              ticketCode && (
                <Button
                  asChild
                  className="
                    mt-2
                    w-full
                    gap-2
                    bg-[#064E3B]
                    text-white
                    hover:bg-[#053D2E]
                  "
                >
                  <a
                    href={`/api/tickets/${encodeURIComponent(
                      ticketCode,
                    )}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="size-4" />

                    {locale === "fr"
                      ? "Télécharger mon billet PDF"
                      : "Download my ticket PDF"}
                  </a>
                </Button>
              )}

            {!isTicketPayment && (
              <Button
                asChild
                className="
                  mt-2
                  w-full
                  bg-[#064E3B]
                  text-white
                  hover:bg-[#053D2E]
                "
              >
                <Link href="/dashboard/student">
                  {t(
                    "checkout.goToDashboard",
                  )}
                </Link>
              </Button>
            )}

            {isTicketPayment &&
              !ticketCode && (
                <Button
                  asChild
                  variant="outline"
                  className="
                    mt-2
                    w-full
                    border-[#064E3B]/30
                    text-[#064E3B]
                    hover:border-[#064E3B]
                    hover:bg-[#064E3B]
                    hover:text-white
                    dark:border-emerald-800
                    dark:text-emerald-400
                    dark:hover:bg-[#064E3B]
                    dark:hover:text-white
                  "
                >
                  <Link href="/dashboard/student">
                    {locale === "fr"
                      ? "Voir mon tableau de bord"
                      : "View my dashboard"}
                  </Link>
                </Button>
              )}
          </div>
        )}

        {/* ===================================================
            FAILED
        ==================================================== */}

        {phase === "failed" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">

            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-12 text-destructive" />
            </div>

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
              className="
                mt-2
                w-full
                border-[#064E3B]/30
                text-[#064E3B]
                hover:border-[#064E3B]
                hover:bg-[#064E3B]
                hover:text-white
                dark:border-emerald-800
                dark:text-emerald-400
                dark:hover:bg-[#064E3B]
                dark:hover:text-white
              "
              onClick={reset}
            >
              {locale === "fr"
                ? "Réessayer"
                : "Try again"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}