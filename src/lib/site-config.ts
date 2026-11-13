/**
 * Centralized Site Configuration for EngineerPrep India.
 * Sourced by metadata generators, sitemaps, robots, JSON-LD schemas, and OpenGraph generators.
 */

export const siteConfig = {
  name: "EngineerPrep India",
  shortName: "EngineerPrep",
  tagline: "Learn. Practice. Prepare. Get Hired.",
  description:
    "Comprehensive engineering preparation platform: VTU notes, syllabus, question papers, curated DSA sheets, developer roadmaps, mock assessments, jobs and internships.",
  // Production URL configured via environment variable, falling back to canonical domain
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://engineerprep.in").replace(/\/$/, ""),
  ogImage: "/images/og-image.png",
  logo: "/images/logo.png",
  themeColor: "#FF5A00",
  contact: {
    email: "support@engineerprep.in",
    supportUrl: "/contact",
  },
  organization: {
    name: "EngineerPrep India",
    url: (process.env.NEXT_PUBLIC_SITE_URL || "https://engineerprep.in").replace(/\/$/, ""),
    logo: "/images/logo.png",
    founder: "EngineerPrep India Educational Foundation",
    foundingYear: 2024,
    sameAs: [
      "https://github.com/arunkumarar45/engineerprep-india-platform-development",
      "https://youtube.com/@engineerprepindia",
      "https://twitter.com/engineerprep_in",
      "https://linkedin.com/company/engineerprep-india",
    ],
  },
  mainNav: [
    { title: "Home", href: "/" },
    { title: "VTU Resources", href: "/vtu" },
    { title: "DSA Sheets", href: "/placements/dsa-sheets" },
    { title: "Roadmaps", href: "/placements/roadmaps" },
    { title: "Playlists", href: "/placements/dsa-playlists" },
    { title: "Mock Tests", href: "/placements/mock-tests" },
    { title: "Jobs & Internships", href: "/jobs" },
  ],
  footerNav: [
    { title: "VTU Notes", href: "/vtu/notes" },
    { title: "Question Papers", href: "/vtu/question-papers" },
    { title: "Syllabus", href: "/vtu/syllabus" },
    { title: "DSA Sheets", href: "/placements/dsa-sheets" },
    { title: "DSA Patterns", href: "/placements/dsa-patterns" },
    { title: "Roadmaps", href: "/placements/roadmaps" },
    { title: "Jobs", href: "/jobs" },
    { title: "About", href: "/about" },
    { title: "Contact", href: "/contact" },
    { title: "Privacy Policy", href: "/privacy-policy" },
    { title: "Terms of Service", href: "/terms" },
  ],
};

/**
 * Returns an absolute canonical URL for a given relative or absolute path.
 */
export function absoluteUrl(path: string = ""): string {
  const base = siteConfig.url;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

