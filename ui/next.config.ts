import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // `npm run dev:test` builds into .next-test so it never shares a cache with `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
};

export default nextConfig;
