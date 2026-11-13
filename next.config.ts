import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker builds
  output: "standalone",

  // Packages that should run on the server (not bundled by webpack/turbopack)
  serverExternalPackages: ["@aws-sdk/client-s3", "argon2", "@node-rs/argon2", "bullmq", "ioredis"],

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; frame-src 'self' blob: data: https://drive.google.com https://docs.google.com https://www.youtube.com https://www.youtube-nocookie.com; object-src 'self' blob: data:; connect-src 'self' https:;",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Ensure production browser source maps are not publicly exposed
  productionBrowserSourceMaps: false,

  // Canonical 301 redirects for legacy or alternate URL patterns
  async redirects() {
    return [
      {
        source: "/vtu-notes",
        destination: "/vtu/notes",
        permanent: true,
      },
      {
        source: "/dsa-sheets",
        destination: "/placements/dsa-sheets",
        permanent: true,
      },
      {
        source: "/dsa",
        destination: "/placements/dsa-sheets",
        permanent: true,
      },
      {
        source: "/roadmaps",
        destination: "/placements/roadmaps",
        permanent: true,
      },
      {
        source: "/playlists",
        destination: "/placements/dsa-playlists",
        permanent: true,
      },
      {
        source: "/mock-tests",
        destination: "/placements/mock-tests",
        permanent: true,
      },
      {
        source: "/placements/resume-builder",
        destination: "/resume",
        permanent: true,
      },
    ];
  },

  // Environment validation at build time
  env: {
    NEXT_PUBLIC_APP_NAME: "EngineerPrep India",
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "1.0.0",
  },

  // Image optimization: allow AVIF/WebP and common remote patterns
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
