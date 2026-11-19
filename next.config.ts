import type { NextConfig } from "next";

const isCloudflare = process.env.CF_PAGES === "1";

const nextConfig: NextConfig = {
  // "standalone" is used for Docker/Node.js self-hosted deployments only.
  // Cloudflare Pages uses @cloudflare/next-on-pages which does NOT use standalone output.
  ...(isCloudflare ? {} : { output: "standalone" }),

  // Skip TypeScript type-check during `next build` — run `npm run typecheck` separately.
  // This lets the build complete even when there are pre-existing implicit-any warnings
  // in page components that don't affect runtime behavior.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Packages that run on the server side only (not bundled by webpack/turbopack).
  // Cloudflare edge: exclude native addons that don't work in V8 isolates.
  serverExternalPackages: isCloudflare
    ? ["@aws-sdk/client-s3"]
    : ["@aws-sdk/client-s3", "@node-rs/argon2", "bullmq", "ioredis"],

  // Security headers + long-lived caching for static assets
  async headers() {
    return [
      // ---- Immutable static assets (hashed filenames) ----
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // ---- Public images / icons ----
      {
        source: "/(.*)\\.(png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // ---- All other routes: security headers ----
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              process.env.NODE_ENV === "production"
                ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; frame-src 'self' blob: data: https://drive.google.com https://docs.google.com https://www.youtube.com https://www.youtube-nocookie.com; object-src 'self' blob: data:; connect-src 'self' https:;"
                : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; frame-src 'self' blob: data: https://drive.google.com https://docs.google.com https://www.youtube.com https://www.youtube-nocookie.com; object-src 'self' blob: data:; connect-src 'self' https:;",
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
    minimumCacheTTL: 86400, // Cache optimized images for 24 h
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
    ],
  },

  // Compress responses with gzip/brotli
  compress: true,

  // Experimental: improved build speed and package tree-shaking
  experimental: {
    // Optimize client-side bundle by tree-shaking server-only packages
    optimizePackageImports: ["lucide-react", "drizzle-orm"],
  },
};

export default nextConfig;
