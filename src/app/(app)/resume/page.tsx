import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { ResumeBuilder } from "@/components/resume/ResumeBuilder";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Free Engineering Resume Builder for Students & Freshers",
  description:
    "Build an ATS-optimized software engineering resume for campus placements and off-campus drives. Real-time scoring, tech templates, and project bullet suggestions.",
  alternates: {
    canonical: absoluteUrl("/resume"),
  },
  openGraph: {
    title: "Free Engineering Resume Builder for Students | EngineerPrep India",
    description:
      "Craft ATS-friendly resumes scored specifically for software engineering and campus placement drives.",
    url: absoluteUrl("/resume"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Engineering Resume Builder for Students | EngineerPrep India",
    description:
      "Craft ATS-friendly resumes scored specifically for software engineering and campus placement drives.",
  },
};

export default function ResumePage() {
  return (
    <div className="space-y-6">
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Placement Guides", url: "/placements" },
          { name: "Resume Builder", url: "/resume" },
        ]}
      />
      <PageHeader
        breadcrumb={[
          { label: "Placement Guides", href: "/placements" },
          { label: "Resume Builder" },
        ]}
        title="Engineering Resume Builder"
        subtitle="Build an ATS-proof engineering resume scored in real-time. Designed specifically for campus drives and tier-1 product recruiters."
      />

      <ResumeBuilder />
    </div>
  );
}

