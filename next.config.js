/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'

function buildCsp() {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // Images can be from self, data URIs, https CDNs, and blobs (e.g., canvas exports)
    "img-src 'self' data: https: blob:",
    // Allow inline styles (needed by Next/font) and external styles from https
    "style-src 'self' 'unsafe-inline' https:",
    // Fonts from self and https; allow data for inline font sources
    "font-src 'self' https: data:",
    // Allow minimal inline scripts required by Next.js runtime in production
    // Avoid 'unsafe-eval' in production
    `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https: blob:`,
    // Allow API/WebSocket connections to local dev servers and https in prod
    "connect-src 'self' https: http: ws: wss:",
    // Workers often load via blob URLs in dev
    "worker-src 'self' blob:",
    // Frames from self and https (Stripe, etc.)
    "frame-src 'self' https:"
  ]
    .filter(Boolean)
    .join('; ')

  return directives
}

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Disable vendor chunk optimization to avoid missing vendor-chunks like '@supabase.js'
    optimizePackageImports: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: buildCsp() },
        ],
      },
    ]
  },
}

module.exports = nextConfig