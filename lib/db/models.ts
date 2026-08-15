import type { Collection } from "mongodb"
import { getDb } from "./mongodb"
import type { Formation, LocalizedText } from "@/lib/mock-data"

export type Role = "student" | "client" | "admin"
export type Localized = LocalizedText

export interface UserDoc {
  _id?: string
  name: string
  email: string
  passwordHash: string
  role: Role
  createdAt: Date
}

// Formations are stored using the same shape the UI already consumes.
export type FormationDoc = Formation

export interface EnrollmentDoc {
  _id?: string
  userId: string
  formationSlug: string
  progress: number
  status: "active" | "completed"
  paymentId?: string
  createdAt: Date
}

export interface ProjectDoc {
  _id?: string
  userId: string
  title: Localized
  service: string
  status: "pending" | "in_progress" | "review" | "delivered"
  progress: number
  budgetUsd: number
  deadline: string
  createdAt: Date
}

export interface QuoteDoc {
  _id?: string
  name: string
  email: string
  service: string
  budget: string
  deadline: string
  description: string
  aiDraft?: string
  status: "new" | "reviewed" | "quoted"
  createdAt: Date
}

export type PaymentProvider = "pawapay" | "avadapay"

export interface PaymentDoc {
  _id?: string
  reference: string
  userId?: string
  provider: PaymentProvider
  kind: "formation" | "subscription" | "project"
  targetSlug?: string
  label: Localized
  amountUsd: number
  currency: string
  phone?: string
  status: "pending" | "success" | "failed"
  providerRef?: string
  createdAt: Date
  updatedAt: Date
}

export async function users(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>("users")
}
export async function formations(): Promise<Collection<FormationDoc>> {
  return (await getDb()).collection<FormationDoc>("formations")
}
export async function enrollments(): Promise<Collection<EnrollmentDoc>> {
  return (await getDb()).collection<EnrollmentDoc>("enrollments")
}
export async function projects(): Promise<Collection<ProjectDoc>> {
  return (await getDb()).collection<ProjectDoc>("projects")
}
export async function quotes(): Promise<Collection<QuoteDoc>> {
  return (await getDb()).collection<QuoteDoc>("quotes")
}
export async function payments(): Promise<Collection<PaymentDoc>> {
  return (await getDb()).collection<PaymentDoc>("payments")
}
