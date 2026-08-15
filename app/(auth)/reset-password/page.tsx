import type { Metadata } from "next"
import { ResetForm } from "@/components/auth/reset-form"

export const metadata: Metadata = { title: "Réinitialiser le mot de passe" }

export default function ResetPage() {
  return <ResetForm />
}
