import type { Metadata } from "next"
import { FreeCourse } from "@/components/free-course/free-course"

export const metadata: Metadata = {
  title: "Cours gratuit HTML & CSS",
  description: "Apprenez HTML et CSS gratuitement, du débutant à l'avancé, avec un éditeur en direct et un Tuteur.",
}

export default function FreeCoursePage() {
  return <FreeCourse />
}
