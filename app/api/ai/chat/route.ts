
import {
  streamText,
  type ModelMessage,
} from "ai"

import { google } from "@ai-sdk/google"

import {
  getAllFormations,
  getServices,
} from "@/lib/data/catalog"

import {
  ASSISTANT_SYSTEM,
  buildCatalogContext,
} from "@/lib/ai/config"

export const maxDuration = 30

// ============================================================
// GEMINI MODEL
// ============================================================

// Explicitly set the model to avoid old environment or
// configuration values overriding it.
const GEMINI_MODEL = "gemini-3.6-flash"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type RequestBody = {
  messages?: ChatMessage[]
  locale?: "fr" | "en"
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody

    const messages = Array.isArray(body.messages)
      ? body.messages
      : []

    const locale =
      body.locale === "en" ? "en" : "fr"

    // ============================================================
    // GEMINI API KEY CHECK
    // ============================================================

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) {
      return Response.json(
        {
          error: "GEMINI_API_KEY_MISSING",
          message:
            locale === "fr"
              ? "L'assistant IA Gemini n'est pas encore configuré."
              : "The Gemini AI assistant is not configured yet.",
        },
        {
          status: 503,
        },
      )
    }

    // ============================================================
    // VALIDATE CONVERSATION
    // ============================================================

    const modelMessages: ModelMessage[] =
      messages
        .filter(
          (message) =>
            (message.role === "user" ||
              message.role === "assistant") &&
            typeof message.content === "string" &&
            message.content.trim().length > 0,
        )
        .slice(-20)
        .map((message) => ({
          role: message.role,
          content: message.content.trim(),
        }))

    if (modelMessages.length === 0) {
      return Response.json(
        {
          error: "EMPTY_MESSAGES",
          message:
            locale === "fr"
              ? "Veuillez envoyer un message."
              : "Please send a message.",
        },
        {
          status: 400,
        },
      )
    }

    // ============================================================
    // LOAD CATALOG
    // ============================================================

    const [formations, services] =
      await Promise.all([
        getAllFormations(),
        Promise.resolve(getServices()),
      ])

    const context =
      buildCatalogContext(
        formations,
        services,
      )

    const system = `${ASSISTANT_SYSTEM}

${context}`

    // ============================================================
    // GEMINI AI
    // ============================================================

    console.log(
      "🤖 Using Gemini model:",
      GEMINI_MODEL,
    )

    const result = streamText({
      model: google(GEMINI_MODEL),
      system,
      messages: modelMessages,
      temperature: 0.7,

      onError({ error }) {
        console.error(
          "❌ Gemini streaming error:",
          error,
        )
      },
    })

    // ============================================================
    // STREAM RESPONSE
    // ============================================================

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control":
          "no-cache, no-transform",

        "Connection":
          "keep-alive",

        "X-Accel-Buffering":
          "no",
      },
    })
  } catch (error) {
    console.error(
      "❌ Gemini AI chat error:",
      error,
    )

    return Response.json(
      {
        error: "AI_CHAT_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Unknown AI chat error",
      },
      {
        status: 500,
      },
    )
  }
}

