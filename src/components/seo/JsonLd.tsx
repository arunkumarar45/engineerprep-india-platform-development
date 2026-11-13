import { siteConfig, absoluteUrl } from "@/lib/site-config";

/**
 * Organization and Educational Organization structured data
 */
export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    logo: absoluteUrl("/images/logo.png"),
    description: siteConfig.description,
    email: siteConfig.contact.email,
    sameAs: siteConfig.organization.sameAs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * WebSite schema with potential site navigation and search action
 */
export function WebSiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en-IN",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BreadcrumbList schema for nested page hierarchies
 */
export function BreadcrumbsJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : absoluteUrl(item.url),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Course or LearningResource schema for DSA Sheets and Study Guides
 */
export function LearningResourceJsonLd({
  name,
  description,
  url,
  educationalLevel = "Undergraduate Engineering",
  learningResourceType = "Problem Set / Study Guide",
}: {
  name: string;
  description: string;
  url: string;
  educationalLevel?: string;
  learningResourceType?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name,
    description,
    url: url.startsWith("http") ? url : absoluteUrl(url),
    learningResourceType,
    educationalLevel,
    isAccessibleForFree: true,
    provider: {
      "@type": "EducationalOrganization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * JobPosting schema for engineering opportunities
 */
export function JobPostingJsonLd({
  title,
  description,
  datePosted,
  validThrough,
  companyName,
  location,
  employmentType = "FULL_TIME",
  url,
}: {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  companyName: string;
  location?: string | null;
  employmentType?: string;
  url: string;
}) {
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description,
    datePosted,
    employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: companyName,
    },
    url: url.startsWith("http") ? url : absoluteUrl(url),
  };

  if (validThrough) {
    schema.validThrough = validThrough;
  }

  if (location && location.toLowerCase().includes("remote")) {
    schema.jobLocationType = "TELECOMMUTE";
  } else if (location) {
    schema.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: location,
        addressCountry: "IN",
      },
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

