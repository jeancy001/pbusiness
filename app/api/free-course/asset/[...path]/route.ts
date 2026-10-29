// Stand-in for the relative files the free course's examples refer to
// (images/profile.jpg, cours.mp4…): previews resolve them here, so example
// images render as a labelled placeholder instead of a broken 404.

const IMAGE = /\.(png|jpe?g|gif|webp|avif|svg)$/i

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const name = (await params).path.join("/").slice(0, 60)
  if (!IMAGE.test(name)) return new Response(null, { status: 204, headers: { "Cache-Control": "public, max-age=86400" } })

  const label = name.replace(/[<>&"']/g, "")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300">
  <rect width="480" height="300" fill="#ECFDF5"/>
  <rect x="1" y="1" width="478" height="298" fill="none" stroke="#A7F3D0" stroke-width="2" stroke-dasharray="8 6"/>
  <g transform="translate(204 92)" fill="none" stroke="#064E3B" stroke-width="5" stroke-linejoin="round">
    <rect x="0" y="0" width="72" height="56" rx="8"/><circle cx="22" cy="20" r="7"/><path d="M4 50l22-20 14 12 10-8 18 16"/>
  </g>
  <text x="240" y="200" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#064E3B">${label}</text>
</svg>`
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } })
}
