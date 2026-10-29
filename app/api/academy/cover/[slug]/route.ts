import { isDbConfigured } from "@/lib/db/mongodb"
import { findAiTrack } from "@/lib/lms/ai-tracks"
import { ensureCover } from "@/lib/lms/ai-covers"

export const maxDuration = 60

// Public cover image of a Linko Academy course. Generated once (only for
// courses that exist), then served from storage.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const track = isDbConfigured() ? await findAiTrack(slug) : null
  const cover = track ? await ensureCover(track).catch(() => null) : null
  if (!cover) return new Response("No cover", { status: 404, headers: { "Cache-Control": "no-store" } })

  if (cover.url) return new Response(null, { status: 302, headers: { Location: cover.url, "Cache-Control": "public, max-age=3600" } })
  return new Response(new Uint8Array(cover.data!.buffer), {
    headers: { "Content-Type": cover.mimeType, "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  })
}
