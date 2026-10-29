import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Course media is uploaded by the browser straight to Supabase Storage
// using a short-lived signed upload URL, so large videos never transit
// through the Next.js server. The bucket should be PRIVATE: students
// receive time-limited signed read URLs only after access checks.

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Private bucket: lesson videos and files, served through signed URLs. */
export const COURSE_BUCKET = process.env.SUPABASE_COURSE_BUCKET || "courses"
/** Public bucket: course covers and AI-generated images. */
export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || "media"

let client: SupabaseClient | null = null

export function isStorageConfigured() {
  return Boolean(url && serviceKey)
}

function admin(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error("Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
  }
  client ??= createClient(url, serviceKey, { auth: { persistSession: false } })
  return client
}

export async function createUploadUrl(path: string, bucket = COURSE_BUCKET) {
  const { data, error } = await admin().storage.from(bucket).createSignedUploadUrl(path)
  if (error || !data) throw new Error(error?.message ?? "Unable to create upload URL")
  return data
}

export async function createReadUrl(path: string, expiresInSec = 60 * 60 * 3) {
  const { data, error } = await admin().storage.from(COURSE_BUCKET).createSignedUrl(path, expiresInSec)
  if (error || !data) return null
  return data.signedUrl
}

export async function removeObject(path: string) {
  await admin().storage.from(COURSE_BUCKET).remove([path])
}

export function publicUrl(path: string) {
  return admin().storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Public URLs we issued ourselves; anything else is rejected as a course image. */
export function isOwnMediaUrl(value: string) {
  if (!url) return false
  return value.startsWith(`${url.replace(/\/$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/`)
}

/** Server-side upload (e.g. AI-generated images). Returns the public URL. */
export async function uploadMedia(path: string, body: Buffer, contentType: string) {
  const { error } = await admin().storage.from(MEDIA_BUCKET).upload(path, body, { contentType, upsert: true, cacheControl: "31536000" })
  if (error) throw new Error(error.message)
  return publicUrl(path)
}
