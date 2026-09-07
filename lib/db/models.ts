
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

/**
 * Formations use the same structure consumed
 * by the application UI.
 */
export type FormationDoc = Formation

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

export type QuoteStatus =
  | "new"
  | "reviewed"
  | "approved"
  | "rejected"

export interface QuoteDoc {
  _id?: string

  /**
   * User associated with the project request,
   * when the user is authenticated.
   */
  userId?: string

  /**
   * Project associated with this quote.
   */
  projectId?: string

  name: string

  email: string

  service: string

  /**
   * Original budget text supplied by the client.
   */
  budget: string

  /**
   * Final approved project amount in USD.
   *
   * Project payments must never use an amount
   * supplied directly by the frontend.
   */
  amountUsd?: number

  deadline: string

  description: string

  aiDraft?: string

  status: QuoteStatus

  /**
   * Date when the quote was approved.
   */
  approvedAt?: Date

  createdAt: Date

  updatedAt?: Date
}

// ============================================================
// PAYMENT PROVIDERS
// ============================================================

export type PaymentProvider =
  | "pawapay"

// ============================================================
// PAYMENT KINDS
// ============================================================

export type PaymentKind =
  | "formation"
  | "subscription"
  | "project"
  | "event"

// ============================================================
// PAYMENT STATUS
// ============================================================

export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"

// ============================================================
// PAYMENTS
// ============================================================

export interface PaymentDoc {
  _id?: string

  /**
   * Internal unique payment reference.
   *
   * Also used as the PawaPay deposit ID.
   */
  reference: string

  /**
   * Authenticated user when available.
   */
  userId?: string

  /**
   * Payment provider.
   */
  provider: PaymentProvider

  /**
   * What the customer is paying for.
   */
  kind: PaymentKind

  /**
   * Formation slug or event slug.
   *
   * For project payments, this can be the project ID.
   */
  targetSlug?: string

  /**
   * Quote associated with a project payment.
   *
   * Required when kind is "project".
   */
  quoteId?: string

  /**
   * Localized payment description.
   */
  label: Localized

  // ==========================================================
  // ORIGINAL PRICE
  // ==========================================================

  /**
   * Original product price in USD.
   */
  amountUsd: number

  // ==========================================================
  // FINAL PAYMENT AMOUNT
  // ==========================================================

  /**
   * Final converted amount sent to PawaPay.
   */
  amount: number

  /**
   * Currency used for the transaction.
   */
  currency: string

  /**
   * ISO 3166-1 alpha-2 country code.
   */
  country: string

  /**
   * USD → local currency exchange rate.
   */
  exchangeRate?: number

  // ==========================================================
  // MOBILE MONEY DETAILS
  // ==========================================================

  /**
   * Customer phone number.
   */
  phone?: string

  /**
   * Mobile Money network.
   */
  network?: string

  // ==========================================================
  // PAYMENT STATUS
  // ==========================================================

  status: PaymentStatus

  /**
   * Provider payment reference.
   */
  providerRef?: string

  // ==========================================================
  // TIMESTAMPS
  // ==========================================================

  createdAt: Date

  updatedAt: Date
}

// ============================================================
// EVENT TICKETS
// ============================================================

export type TicketStatus =
  | "active"
  | "used"
  | "cancelled"

export interface TicketDoc {
  _id?: string

  /**
   * Public unique ticket code.
   *
   * Example:
   *
   * UNIKIN-2026-A8F92K
   */
  ticketCode: string

  /**
   * Event identifier.
   */
  eventSlug: string

  /**
   * Event name.
   */
  eventName: Localized

  // ==========================================================
  // STUDENT INFORMATION
  // ==========================================================

  /**
   * Authenticated user ID when available.
   */
  userId?: string

  /**
   * Full name printed on the ticket.
   */
  studentName: string

  /**
   * Student email.
   */
  studentEmail?: string

  /**
   * University or institution.
   */
  institution?: string

  // ==========================================================
  // EVENT INFORMATION
  // ==========================================================

  /**
   * Event date.
   */
  eventDate: Date

  /**
   * Optional event end date.
   */
  eventEndDate?: Date

  /**
   * Event duration.
   */
  formationDuration: string

  /**
   * Event location.
   */
  location: string

  // ==========================================================
  // PAYMENT
  // ==========================================================

  /**
   * Payment reference associated with
   * this ticket.
   */
  paymentReference: string

  /**
   * Original ticket price in USD.
   */
  amountUsd: number

  /**
   * Final amount paid in local currency.
   */
  amount: number

  /**
   * Payment currency.
   */
  currency: string

  // ==========================================================
  // TICKET STATUS
  // ==========================================================

  status: TicketStatus

  /**
   * Date when the ticket was generated.
   */
  issuedAt: Date

  /**
   * Date when the ticket was used.
   */
  usedAt?: Date

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
  ).collection<FormationDoc>(
    "formations",
  )
}

export async function enrollments(): Promise<
  Collection<EnrollmentDoc>
> {
  return (
    await getDb()
  ).collection<EnrollmentDoc>(
    "enrollments",
  )
}

export async function projects(): Promise<
  Collection<ProjectDoc>
> {
  return (
    await getDb()
  ).collection<ProjectDoc>(
    "projects",
  )
}

export async function quotes(): Promise<
  Collection<QuoteDoc>
> {
  return (
    await getDb()
  ).collection<QuoteDoc>(
    "quotes",
  )
}

export async function payments(): Promise<
  Collection<PaymentDoc>
> {
  return (
    await getDb()
  ).collection<PaymentDoc>(
    "payments",
  )
}

// ============================================================
// TICKETS COLLECTION
// ============================================================

export async function tickets(): Promise<
  Collection<TicketDoc>
> {
  return (
    await getDb()
  ).collection<TicketDoc>(
    "tickets",
  )
}

