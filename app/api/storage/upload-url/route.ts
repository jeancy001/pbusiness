import { randomUUID } from "crypto"
import { z } from "zod"

import { getSession } from "@/lib/auth/session"
import { courseAccess } from "@/lib/lms/queries"
import { COURSE_BUCKET, MEDIA_BUCKET, createUploadUrl, isStorageConfigured, publicUrl } from "@/lib/storage/supabase"

const schema = z.object({
  kind: z.enum(["video", "image"]).default("video"),
  slug: z.string().min(1).max(120).optional(),
  fileName: z.string().min(1).max(200),
  contentType: z.string(),
})

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"]

// Returns a one-time signed URL the browser uploads to directly (Supabase Storage).
//   video → private course bucket, course owner/admin only
//   image → public media bucket (course covers), teachers/admins
export async function POST(req: Request) {
  if (!isStorageConfigured()) {
    return Response.json({ ok: false, error: "Supabase Storage is not configured." }, { status: 503 })
  }
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 })
  const { kind, slug, fileName, contentType } = parsed.data
  const session = await getSession()

  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) : "bin"

  if (kind === "image") {
    if (!session || !["teacher", "admin"].includes(session.role)) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 })
    if (!IMAGE_TYPES.includes(contentType)) return Response.json({ ok: false, error: "Use a JPG, PNG, WebP or AVIF image." }, { status: 400 })
    const path = `covers/${randomUUID()}.${ext}`
    const { signedUrl } = await createUploadUrl(path, MEDIA_BUCKET)
    return Response.json({ ok: true, path, signedUrl, publicUrl: publicUrl(path) })
  }

  if (!slug || !/^video\//.test(contentType)) return Response.json({ ok: false, error: "Invalid video upload" }, { status: 400 })
  const access = await courseAccess(session, slug)
  if (access !== "owner" && access !== "admin") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 })
  const path = `${slug}/${randomUUID()}.${ext}`
  const { signedUrl } = await createUploadUrl(path, COURSE_BUCKET)
  return Response.json({ ok: true, path, signedUrl })
}
