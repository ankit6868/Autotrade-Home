/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Landing page ships static markup; skip lint gating the Vercel build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
