import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";
import {
  AptitudeSection,
  ChallengeSection,
  CompanyPreparationSection,
  InterviewQuestionsSection,
  PlaylistsSection,
  SqlSection,
  SystemDesignSection,
  TechnicalSubjectsSection,
} from "@/components/placements/sections";

const SECTION_METADATA: Record<
  string,
  { title: string; description: string }
> = {
  sql: {
    title: "SQL Interview Questions & Query Practice Sheet",
    description:
      "Practice the most frequently asked SQL interview questions: Joins, Subqueries, Aggregate Functions, Window Functions, and Query Optimization for placement interviews.",
  },
  aptitude: {
    title: "Quantitative Aptitude & Logical Reasoning for Campus Placements",
    description:
      "Comprehensive aptitude and reasoning preparation for engineering placements: Time & Work, Speed & Distance, Probability, Syllogisms, and Data Interpretation.",
  },
  "technical-subjects": {
    title: "Core CS Technical Subjects – DBMS, OS, CN & OOPs",
    description:
      "Master computer science fundamentals required for tech interviews: Database Management Systems, Operating Systems, Computer Networks, and Object-Oriented Programming.",
  },
  "company-preparation": {
    title: "Company-wise Placement Preparation – Google, Amazon, Microsoft, TCS",
    description:
      "Targeted interview preparation guides and syllabus breakdowns for top technology firms, product companies, and campus recruiters.",
  },
  "interview-questions": {
    title: "Technical & HR Interview Questions with Sample Answers",
    description:
      "Explore curated technical, behavioral, and HR interview questions with structured answer frameworks and tips for engineering freshers.",
  },
  "system-design": {
    title: "System Design for SDE Interviews – HLD & LLD Fundamentals",
    description:
      "Learn High-Level Design (HLD) and Low-Level Design (LLD): Scalability, Caching, Load Balancing, Microservices, and database partitioning with real-world case studies.",
  },
  "dsa-playlists": {
    title: "Curated DSA Video Playlists & Concept Tutorials",
    description:
      "Watch curated Data Structures and Algorithms video playlists and lecture series from top educators to build strong foundational problem-solving skills.",
  },
  challenge: {
    title: "30-Day Placement Preparation Challenge",
    description:
      "Join our structured 30-day placement preparation challenge covering daily DSA problems, aptitude tests, and CS core subject revision.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const meta = SECTION_METADATA[section];
  if (!meta) return {};

  const canonicalUrl = absoluteUrl(`/placements/${section}`);
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${meta.title} | EngineerPrep India`,
      description: meta.description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} | EngineerPrep India`,
      description: meta.description,
    },
  };
}

const SECTIONS: Record<
  string,
  {
    title: string;
    subtitle: string;
    render: () => React.ReactNode;
  }
> = {
  "dsa-playlists": {
    title: "DSA Playlists",
    subtitle: "Curated video playlists from India's best DSA educators.",
    render: () => <PlaylistsSection />,
  },
  "system-design": {
    title: "System Design",
    subtitle: "High level and low level design concepts with case studies.",
    render: () => <SystemDesignSection />,
  },
  sql: {
    title: "SQL Sheet",
    subtitle: "The SQL questions asked most often in placement interviews.",
    render: () => <SqlSection />,
  },
  aptitude: {
    title: "Aptitude & Reasoning",
    subtitle: "Quantitative aptitude, logical reasoning and data interpretation.",
    render: () => <AptitudeSection />,
  },
  "technical-subjects": {
    title: "Technical Subjects",
    subtitle: "Core CS subjects that every placement interview tests.",
    render: () => <TechnicalSubjectsSection />,
  },
  "company-preparation": {
    title: "Company Preparation",
    subtitle: "Company-wise preparation plans for top recruiters.",
    render: () => <CompanyPreparationSection />,
  },
  "interview-questions": {
    title: "Interview Questions",
    subtitle: "Technical, HR and project-based questions with sample answers.",
    render: () => <InterviewQuestionsSection />,
  },
  challenge: {
    title: "30-Day Placement Challenge",
    subtitle: "A structured 30-day plan covering DSA, aptitude and technical skills.",
    render: () => <ChallengeSection />,
  },
};

export default async function PlacementSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section === "resume-builder" || section === "resume") {
    redirect("/resume");
  }
  const config = SECTIONS[section];
  if (!config) notFound();

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Placement Guides", url: "/placements" },
          { name: config.title, url: `/placements/${section}` },
        ]}
      />
      <PageHeader
        breadcrumb={[
          { label: "Placement Guides", href: "/placements" },
          { label: config.title },
        ]}
        title={config.title}
        subtitle={config.subtitle}
      />
      {config.render()}
    </>
  );
}
