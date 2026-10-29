"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

/**
 * Uploads a file straight from the browser to Supabase Storage through a
 * one-time signed URL from /api/storage/upload-url (with progress).
 */
export async function uploadToSupabase(
  file: File,
  target: { kind: "video"; slug: string } | { kind: "image" },
  onProgress?: (pct: number) => void,
): Promise<{ path: string; publicUrl?: string }> {
  const res = await fetch("/api/storage/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...target, fileName: file.name, contentType: file.type || (target.kind === "video" ? "video/mp4" : "image/jpeg") }),
  })
  const json = (await res.json()) as { ok: boolean; path?: string; signedUrl?: string; publicUrl?: string; error?: string }
  if (!json.ok || !json.signedUrl || !json.path) throw new Error(json.error ?? "Upload failed")

  const body = new FormData()
  body.append("cacheControl", "3600")
  body.append("", file)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", json.signedUrl!)
    xhr.setRequestHeader("x-upsert", "false")
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
    xhr.onerror = () => reject(new Error("Network error during upload"))
    xhr.send(body)
  })
  return { path: json.path, publicUrl: json.publicUrl }
}

/** Course cover picker: uploads on selection and reports the public URL. */
export function ImageUpload({ value, onChange, name = "image" }: { value?: string; onChange?: (url: string) => void; name?: string }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const [url, setUrl] = useState(value ?? "")
  const [pct, setPct] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  async function pick(file: File | undefined) {
    if (!file) return
    setError(null)
    setPct(0)
    try {
      const { publicUrl } = await uploadToSupabase(file, { kind: "image" }, setPct)
      setUrl(publicUrl ?? "")
      onChange?.(publicUrl ?? "")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPct(null)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div
        className={cn(
          "relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40",
          !url && "cursor-pointer hover:border-[#064E3B]/40",
        )}
        onClick={() => !url && input.current?.click()}
      >
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              aria-label={fr ? "Retirer l'image" : "Remove image"}
              onClick={(e) => {
                e.stopPropagation()
                setUrl("")
                onChange?.("")
              }}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <X className="size-4" />
            </button>
          </>
        ) : pct !== null ? (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            {pct}%
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <ImagePlus className="size-6 text-[#064E3B] dark:text-emerald-400" />
            {fr ? "Ajouter une image de couverture" : "Add a cover image"}
            <span className="text-xs">JPG, PNG, WebP · Supabase Storage</span>
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
