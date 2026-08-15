import { streamText } from "ai"
import { AI_MODEL, aiEnabled } from "@/lib/ai/config"

export const maxDuration = 30

export async function POST(req: Request) {
  const { projectType = "", locale = "fr" } = (await req.json()) as {
    projectType?: string
    locale?: "fr" | "en"
  }

  if (!aiEnabled()) {
    const fallback =
      locale === "fr"
        ? `Projet : ${projectType}. Décrivez ici vos objectifs, votre audience cible, les fonctionnalités clés attendues, vos contraintes techniques et votre calendrier. (La rédaction assistée par Gemini sera disponible une fois AI_GATEWAY_API_KEY configurée.)`
        : `Project: ${projectType}. Describe your goals, target audience, key expected features, technical constraints and timeline here. (Gemini-assisted drafting will be available once AI_GATEWAY_API_KEY is configured.)`
    return new Response(fallback, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
  }

  const result = streamText({
    model: AI_MODEL,
    system:
      `You help clients of P Business Online write a clear project brief for a quote request. ` +
      `Write in ${locale === "fr" ? "French" : "English"}. Produce a well-structured first-person draft ` +
      `(2-4 short paragraphs) covering: objective, target users, key features, and any constraints. ` +
      `Keep it realistic and concise. Do not invent a budget or a company name.`,
    prompt: `The client wants a project of type: "${projectType}". Draft the project description for them.`,
  })

  return result.toTextStreamResponse()
}
