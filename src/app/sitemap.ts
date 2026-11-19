import type { MetadataRoute } from "next";
import { siteConfig, absoluteUrl } from "@/lib/site-config";
import {
  getDsaSheets,
  getDsaPatterns,
  getRoadmaps,
  getMockTests,
  getOpportunities,
  getResources,
} from "@/lib/queries";

// Sitemap is generated statically and refreshed every hour.
// Individual resource URLs use the same /vtu/view/[id] pattern.
export const revalidate = 3600; // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    // VTU Hub & Sections
    {
      url: absoluteUrl("/vtu"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/vtu/notes"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/vtu/question-papers"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/vtu/syllabus"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/vtu/resources"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/vtu/updates"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/vtu/lab-manuals"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/vtu/assignments"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/vtu/upload"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    // Placements Hub & Sections
    {
      url: absoluteUrl("/placements"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/placements/dsa-sheets"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/placements/dsa-patterns"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/placements/roadmaps"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/placements/sql"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/placements/technical-subjects"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/placements/aptitude"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/placements/mock-tests"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/placements/company-preparation"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/placements/interview-questions"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/placements/system-design"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/placements/dsa-playlists"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/placements/challenge"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    // Resume Builder Tool
    {
      url: absoluteUrl("/resume"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    // Jobs
    {
      url: absoluteUrl("/jobs"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    // Informational & Legal
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/privacy-policy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // Dynamic routes (sheets, patterns, roadmaps, mock tests, jobs, published resources)
  const [sheets, patterns, roadmaps, mockTests, jobs, resources] = await Promise.all([
    getDsaSheets().catch(() => []),
    getDsaPatterns().catch(() => []),
    getRoadmaps().catch(() => []),
    getMockTests().catch(() => []),
    getOpportunities({}).catch(() => []),
    getResources({ limit: 500 }).catch(() => []),
  ]);

  const dynamicSheets: MetadataRoute.Sitemap = sheets.map((sheet) => ({
    url: absoluteUrl(`/placements/dsa-sheets/${sheet.slug}`),
    lastModified: sheet.updatedAt ? new Date(sheet.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const dynamicPatterns: MetadataRoute.Sitemap = patterns.map((p) => ({
    url: absoluteUrl(`/placements/dsa-patterns/${p.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const dynamicRoadmaps: MetadataRoute.Sitemap = roadmaps.map((r) => ({
    url: absoluteUrl(`/placements/roadmaps/${r.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const dynamicMockTests: MetadataRoute.Sitemap = mockTests.map((t) => ({
    url: absoluteUrl(`/placements/mock-tests/${t.id}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const dynamicJobs: MetadataRoute.Sitemap = jobs.map((j) => ({
    url: absoluteUrl(`/jobs/${j.id}`),
    lastModified: j.postedAt ? new Date(j.postedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const dynamicResources: MetadataRoute.Sitemap = resources.map((r) => ({
    url: absoluteUrl(`/vtu/view/${r.id}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...dynamicSheets,
    ...dynamicPatterns,
    ...dynamicRoadmaps,
    ...dynamicMockTests,
    ...dynamicJobs,
    ...dynamicResources,
  ];
}

