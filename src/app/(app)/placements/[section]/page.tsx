import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout";
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
