import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@updated/kit'],
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
