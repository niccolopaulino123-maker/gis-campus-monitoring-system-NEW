import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // firebase-admin uses Node built-ins; keep it server-only.
  serverExternalPackages: ['firebase-admin'],
}

export default nextConfig
