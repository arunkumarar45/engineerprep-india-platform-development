import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/vtu",
          "/vtu/*",
          "/placements",
          "/placements/*",
          "/jobs",
          "/jobs/*",
          "/about",
          "/contact",
          "/privacy-policy",
          "/terms",
          "/llms.txt",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/dashboard",
          "/dashboard/*",
          "/my-bookmarks",
          "/my-downloads",
          "/my-progress",
          "/my-tests",
          "/settings",
          "/settings/*",
          "/profile",
          "/profile/*",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
      // Special rule for AI crawlers (GPTBot, ClaudeBot, etc.) pointing to llms.txt
      {
        userAgent: ["GPTBot", "ChatGPT-User", "ClaudeBot", "Anthropic-ai", "Google-Extended", "PerplexityBot"],
        allow: ["/", "/vtu", "/placements", "/jobs", "/llms.txt", "/llms-full.txt"],
        disallow: ["/admin/*", "/api/*", "/dashboard/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

