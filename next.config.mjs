/** @type {import('next').NextConfig} */

// GitHub Pages serves project sites from /<repo-name>. The deploy workflow sets
// NEXT_PUBLIC_BASE_PATH automatically; leave it empty for a user site
// (<username>.github.io), a custom domain, or local development.
const rawBase = process.env.NEXT_PUBLIC_BASE_PATH || "";
const basePath = rawBase.startsWith("/") ? rawBase.replace(/\/$/, "") : "";

const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
