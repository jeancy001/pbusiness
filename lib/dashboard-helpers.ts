import { formations } from "./mock-data"

export {
  enrolledFormations,
  projects,
  projectStatusLabels,
  payments,
  paymentStatusLabels,
  notifications,
  adminStats,
  revenueByMonth,
  pricing,
  localize,
} from "./mock-data"

export type {
  EnrolledFormation,
  Project,
  ProjectStatus,
  Payment,
  PaymentStatus,
} from "./mock-data"

export function getFormationById(id: string) {
  return formations.find((f) => f.id === id)
}
