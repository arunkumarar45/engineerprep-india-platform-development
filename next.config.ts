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
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
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

  // Environment validation at build time
  env: {
    NEXT_PUBLIC_APP_NAME: "EngineerPrep India",
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "1.0.0",
  },
};

export default nextConfig;
