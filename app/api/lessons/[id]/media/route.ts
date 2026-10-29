import { getSession } from "@/lib/auth/session"
import { lessons, toObjectId } from "@/lib/db/lms"
import { courseAccess } from "@/lib/lms/queries"
import { createReadUrl } from "@/lib/storage/supabase"

// Streams lesson media through a short-lived Supabase signed URL after an access check.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const _id = toObjectId((await params).id)
  const lesson = _id ? await (await lessons()).findOne({ _id }) : null
  if (!lesson?.storagePath) return new Response("Not found", { status: 404 })

  if (!(await courseAccess(await getSession(), lesson.formationSlug))) {
    return new Response("Forbidden", { status: 403 })
  }

  const url = await createReadUrl(lesson.storagePath)
  if (!url) return new Response("Media unavailable", { status: 502 })
  return Response.redirect(url, 302)
}
