
import { streamText } from "ai"
import { google } from "@ai-sdk/google"

import {
  AI_MODEL,
  aiEnabled,
} from "@/lib/ai/config"

export const maxDuration = 30

type RequestBody = {
  projectType?: string
  locale?: "fr" | "en"
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody

    const safeProjectType =
      typeof body.projectType === "string"
        ? body.projectType.trim().slice(0, 500)
        : ""

    const safeLocale =
      body.locale === "en" ? "en" : "fr"

    // ============================================================
    // GEMINI CONFIGURATION CHECK
    // ============================================================

    if (!aiEnabled()) {
      const fallback =
        safeLocale === "fr"
          ? `Projet : ${safeProjectType || "à définir"}.

Décrivez votre projet en précisant :

- Votre objectif principal
- Vos utilisateurs ou clients cibles
- Les fonctionnalités ou besoins principaux
- Vos contraintes techniques ou particulières
- Votre calendrier souhaité`
          : `Project: ${safeProjectType || "to be defined"}.

Describe your project by including:

- Your main objective
- Your target users or customers
- Your key features or requirements
- Your technical or specific constraints
- Your desired timeline`

      return new Response(fallback, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      })
    }

    // ============================================================
    // GEMINI AI GENERATION
    // ============================================================

    console.log("🤖 Gemini quote model:", AI_MODEL)

    const result = streamText({
      model: google(AI_MODEL),

      system: `You are a professional project consultant for P Business Online.

Your task is to help clients write a clear, realistic, and professional project brief for a quote request.

Write in ${safeLocale === "fr" ? "French" : "English"}.

Rules:
- Write from the client's perspective.
- Produce 2 to 4 short, well-structured paragraphs.
- Clearly describe the project objective.
- Identify the target users or audience.
- Include realistic key features or requirements appropriate for the project type.
- Mention technical or operational constraints only when relevant.
- Keep the content concise and professional.
- Do not invent a budget.
- Do not invent a company name.
- Do not claim that features already exist.
- Do not include greetings, titles, or unnecessary explanations.
- Return only the project brief.`,

      prompt: `The client wants to request a quote for the following type of project:

"${safeProjectType || "General digital project"}"

Generate a professional project description that the client can use directly in their quote request.`,

      temperature: 0.7,

      onError({ error }) {
        console.error("Gemini quote generation error:", error)
      },
    })

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Gemini project brief request error:", error)

    return Response.json(
      {
        error: "PROJECT_BRIEF_AI_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Unable to generate the project brief.",
      },
      {
        status: 500,
      },
    )
  }
}

