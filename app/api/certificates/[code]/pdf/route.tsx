import { getCertificate } from "@/lib/lms/certificates"
import { renderCertificatePdf } from "@/lib/lms/certificate-pdf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const cert = await getCertificate((await params).code)
  if (!cert) return new Response("Certificate not found", { status: 404 })

  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(req.url).origin
  const blob = await renderCertificatePdf(cert, `${origin}/certificates/${cert.code}`)
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Linko-Academy-${cert.code}.pdf"`,
      "Cache-Control": "private, max-age=300",
    },
  })
}
