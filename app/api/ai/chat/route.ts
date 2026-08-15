import {
  streamText,
  toTextStream,
  type ModelMessage,
} from "ai"

import {
  getAllFormations,
  getServices,
} from "@/lib/data/catalog"

import {
  AI_MODEL,
  ASSISTANT_SYSTEM,
  buildCatalogContext,
  aiEnabled,
} from "@/lib/ai/config"

export const maxDuration = 30

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      messages?: ChatMessage[]
      locale?: "fr" | "en"
    }

    const messages = Array.isArray(body.messages)
      ? body.messages
      : []

    const locale = body.locale === "en" ? "en" : "fr"

    // AI Gateway configuration check.
    if (!aiEnabled()) {
      const message =
        locale === "fr"
          ? "L'assistant IA Gemini sera actif une fois la clé AI_GATEWAY_API_KEY configurée. En attendant, parcourez nos formations et services."
          : "The Gemini AI assistant will be active once AI_GATEWAY_API_KEY is configured. Meanwhile, browse our courses and services."

      return new Response(message, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      })
    }

    // Load catalog data in parallel.
    const [formations, services] = await Promise.all([
      getAllFormations(),
      Promise.resolve(getServices()),
    ])

    const context = buildCatalogContext(
      formations,
      services,
    )

    // Only user and assistant messages are sent to the model.
    // System instructions are provided separately through `system`.
    const modelMessages: ModelMessage[] = messages
      .filter(
        (message) =>
          (message.role === "user" ||
            message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim().length > 0,
      )
      .map((message) => ({
        role: message.role,
        content: message.content,
      }))

    const system = `${ASSISTANT_SYSTEM}

${context}`

    const result = streamText({
      model: AI_MODEL,
      system,
      messages: modelMessages,
    })

    // ai@7: toTextStreamResponse() is deprecated.
    return new Response(toTextStream(result), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("AI chat error:", error)

    return new Response(
      JSON.stringify({
        error: "AI_CHAT_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Unknown AI chat error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    )
  }
}