/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets test/CI builds use their own folder so they never clash with a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
