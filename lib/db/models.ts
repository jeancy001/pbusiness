
import type { Collection } from "mongodb"
import { getDb } from "./mongodb"
import type {
  Formation,
  LocalizedText,
} from "@/lib/mock-data"

// ============================================================
// COMMON TYPES
// ============================================================

export type Role =
  | "student"
  | "client"
  | "admin"

export type Localized =
  LocalizedText

// ============================================================
// USERS
// ============================================================

export interface UserDoc {
  _id?: string

  name: string

  email: string

  passwordHash: string

  role: Role

  createdAt: Date
}

// ============================================================
// FORMATIONS
// ============================================================

// Formations are stored using the same shape
// the UI already consumes.
export type FormationDoc =
  Formation

// ============================================================
// ENROLLMENTS
// ============================================================

export interface EnrollmentDoc {
  _id?: string

  userId: string

  formationSlug: string

  progress: number

  status:
    | "active"
    | "completed"

  paymentId?: string

  createdAt: Date
}

// ============================================================
// PROJECTS
// ============================================================

export interface ProjectDoc {
  _id?: string

  userId: string

  title: Localized

  service: string

  status:
    | "pending"
    | "in_progress"
    | "review"
    | "delivered"

  progress: number

  budgetUsd: number

  deadline: string

  createdAt: Date
}

// ============================================================
// QUOTES
// ============================================================

export interface QuoteDoc {
  _id?: string

  name: string

  email: string

  service: string

  budget: string

  deadline: string

  description: string

  aiDraft?: string

  status:
    | "new"
    | "reviewed"
    | "quoted"

  createdAt: Date
}

// ============================================================
// PAYMENT PROVIDERS
// ============================================================

export type PaymentProvider =
  | "pawapay"

// ============================================================
// PAYMENTS
// ============================================================

export interface PaymentDoc {
  _id?: string

  /**
   * Internal unique payment reference.
   * Also used as the PawaPay deposit reference.
   */
  reference: string

  /**
   * The authenticated user, when available.
   */
  userId?: string

  /**
   * Payment provider.
   */
  provider: PaymentProvider

  /**
   * What the customer is paying for.
   */
  kind:
    | "formation"
    | "subscription"
    | "project"

  /**
   * Formation slug when applicable.
   */
  targetSlug?: string

  /**
   * Localized payment description.
   */
  label: Localized

  // ==========================================================
  // ORIGINAL PRODUCT PRICE
  // ==========================================================

  /**
   * Original product price in USD.
   *
   * Example:
   * $15 subscription
   */
  amountUsd: number

  // ==========================================================
  // FINAL PAWAPAY PAYMENT
  // ==========================================================

  /**
   * Final amount after USD conversion.
   *
   * This is the actual amount sent to PawaPay.
   *
   * Examples:
   *
   * 42000 CDF
   * 1950 KES
   * 55500 UGX
   */
  amount: number

  /**
   * Currency used for the PawaPay transaction.
   *
   * Examples:
   *
   * CDF
   * KES
   * UGX
   * TZS
   * GHS
   * XAF
   */
  currency: string

  /**
   * ISO 3166-1 alpha-2 customer country code.
   *
   * Examples:
   *
   * CD
   * KE
   * UG
   * TZ
   */
  country: string

  /**
   * USD → local currency exchange rate used
   * when the payment was initiated.
   *
   * Example:
   *
   * 1 USD = 2800 CDF
   */
  exchangeRate?: number

  // ==========================================================
  // MOBILE MONEY CUSTOMER
  // ==========================================================

  /**
   * Customer phone number used for payment.
   */
  phone?: string

  /**
   * Mobile Money provider/network.
   *
   * Examples:
   *
   * AIRTEL
   * ORANGE
   * MPESA
   * MTN
   */
  network?: string

  // ==========================================================
  // PAYMENT STATUS
  // ==========================================================

  status:
    | "pending"
    | "success"
    | "failed"

  /**
   * Reference returned by PawaPay.
   */
  providerRef?: string

  // ==========================================================
  // TIMESTAMPS
  // ==========================================================

  createdAt: Date

  updatedAt: Date
}

// ============================================================
// COLLECTION HELPERS
// ============================================================

export async function users(): Promise<
  Collection<UserDoc>
> {
  return (
    await getDb()
  ).collection<UserDoc>("users")
}

export async function formations(): Promise<
  Collection<FormationDoc>
> {
  return (
    await getDb()
  ).collection<FormationDoc>("formations")
}

export async function enrollments(): Promise<
  Collection<EnrollmentDoc>
> {
  return (
    await getDb()
  ).collection<EnrollmentDoc>("enrollments")
}

export async function projects(): Promise<
  Collection<ProjectDoc>
> {
  return (
    await getDb()
  ).collection<ProjectDoc>("projects")
}

export async function quotes(): Promise<
  Collection<QuoteDoc>
> {
  return (
    await getDb()
  ).collection<QuoteDoc>("quotes")
}

export async function payments(): Promise<
  Collection<PaymentDoc>
> {
  return (
    await getDb()
  ).collection<PaymentDoc>("payments")
}

