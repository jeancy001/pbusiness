import "server-only"
import { isDbConfigured } from "@/lib/db/mongodb"
import { enrollments, projects as projectsCol, payments as paymentsCol, formations as formationsCol } from "@/lib/db/models"
import {
  formations as mockFormations,
  enrolledFormations as mockEnrolled,
  projects as mockProjects,
  type Formation,
  type EnrolledFormation,
  type Project,
  type ProjectStatus,
  type PaymentStatus,
} from "@/lib/mock-data"

export type EnrolledView = EnrolledFormation & { formation: Formation }

export type PaymentView = {
  id: string
  amountUsd: number
  method: string
  status: PaymentStatus
  date: string
}

// ---- Student ----
export async function getStudentDashboard(userId: string): Promise<EnrolledView[]> {
  if (!isDbConfigured()) {
    return mockEnrolled
      .map((e) => {
        const formation = mockFormations.find((f) => f.id === e.formationId)
        return formation ? { ...e, formation } : null
      })
      .filter(Boolean) as EnrolledView[]
  }

  try {
    const eCol = await enrollments()
    const fCol = await formationsCol()
    const rows = await eCol.find({ userId }).toArray()
    const views: EnrolledView[] = []
    for (const r of rows) {
      const formation = (await fCol.findOne({ slug: r.formationSlug }, { projection: { _id: 0 } })) as Formation | null
      if (!formation) continue
      views.push({
        formationId: formation.id,
        formation,
        progress: r.progress,
        status: r.status === "completed" ? "completed" : "in-progress",
        nextLesson:
          r.status === "completed"
            ? { fr: "Parcours terminé", en: "Path completed" }
            : formation.modules[0]?.title ?? { fr: "Prochaine leçon", en: "Next lesson" },
        certificateAvailable: r.status === "completed",
      })
    }
    return views
  } catch {
    return []
  }
}

// ---- Client ----
export async function getClientDashboard(
  userId: string,
): Promise<{ projects: Project[]; payments: PaymentView[] }> {
  if (!isDbConfigured()) {
    return { projects: mockProjects, payments: mockPaymentsFallback() }
  }
  try {
    const pCol = await projectsCol()
    const payCol = await paymentsCol()
    const projectRows = await pCol.find({ userId }).sort({ createdAt: -1 }).toArray()
    const payRows = await payCol.find({ userId }).sort({ createdAt: -1 }).limit(10).toArray()

    const projects: Project[] = projectRows.map((p) => ({
      id: String(p._id),
      name: p.title,
      type: { fr: p.service, en: p.service },
      status: p.status as unknown as ProjectStatus,
      progress: p.progress,
      budgetUsd: p.budgetUsd,
      updatedAt: p.createdAt.toISOString().slice(0, 10),
    }))

    const payments: PaymentView[] = payRows.map((p) => ({
      id: p.reference,
      amountUsd: p.amountUsd,
      method: p.provider === "pawapay" ? "PawaPay" : "AvadaPay",
      status: p.status as PaymentStatus,
      date: p.createdAt.toISOString().slice(0, 10),
    }))

    return { projects, payments }
  } catch {
    return { projects: [], payments: [] }
  }
}

// ---- Admin ----
export type AdminView = {
  stats: { students: number; formations: number; revenue: number; projects: number }
  revenue: { month: string; usd: number }[]
  popular: Formation[]
  recentPayments: PaymentView[]
}

export async function getAdminDashboard(): Promise<AdminView | null> {
  if (!isDbConfigured()) return null // components fall back to mock when null
  try {
    const eCol = await enrollments()
    const fCol = await formationsCol()
    const pCol = await projectsCol()
    const payCol = await paymentsCol()

    const [studentCount, formationCount, projectCount] = await Promise.all([
      eCol.estimatedDocumentCount(),
      fCol.estimatedDocumentCount(),
      pCol.estimatedDocumentCount(),
    ])

    const successPayments = await payCol.find({ status: "success" }).toArray()
    const revenue = successPayments.reduce((sum, p) => sum + p.amountUsd, 0)

    const popularDocs = (await fCol
      .find({}, { projection: { _id: 0 } })
      .sort({ studentsCount: -1 })
      .limit(5)
      .toArray()) as Formation[]

    const recentDocs = await payCol.find({}).sort({ createdAt: -1 }).limit(6).toArray()
    const recentPayments: PaymentView[] = recentDocs.map((p) => ({
      id: p.reference,
      amountUsd: p.amountUsd,
      method: p.provider === "pawapay" ? "PawaPay" : "AvadaPay",
      status: p.status as PaymentStatus,
      date: p.createdAt.toISOString().slice(0, 10),
    }))

    // Revenue grouped by month from successful payments.
    const byMonth = new Map<string, number>()
    for (const p of successPayments) {
      const m = p.createdAt.toISOString().slice(0, 7)
      byMonth.set(m, (byMonth.get(m) ?? 0) + p.amountUsd)
    }
    const revenueSeries = [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, usd]) => ({ month, usd }))

    return {
      stats: { students: studentCount, formations: formationCount, revenue, projects: projectCount },
      revenue: revenueSeries,
      popular: popularDocs,
      recentPayments,
    }
  } catch {
    return null
  }
}

function mockPaymentsFallback(): PaymentView[] {
  return [
    { id: "PAY-1042", amountUsd: 45, method: "PawaPay", status: "success", date: "2026-08-10" },
    { id: "PAY-1041", amountUsd: 120, method: "AvadaPay", status: "pending", date: "2026-08-06" },
    { id: "PAY-1040", amountUsd: 2, method: "PawaPay", status: "success", date: "2026-08-01" },
  ]
}
