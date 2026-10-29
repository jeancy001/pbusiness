import type { MetadataRoute } from "next"

// Served at /manifest.webmanifest: install name, colors and home-screen icons.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "P Business Online · Linko Academy",
    short_name: "Linko Academy",
    description: "Formations certifiantes, cours en direct et tuteur personnel.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#064E3B",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
