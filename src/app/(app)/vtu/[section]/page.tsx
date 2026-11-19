import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarClock, Database, Upload } from "lucide-react";

export const dynamic = "force-dynamic";
// Keep force-dynamic only here because URL params (filters) affect data
import { PageHeader } from "@/components/layout";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { UpdateCard } from "@/components/cards";
import { DownloadList, ResourceListing } from "@/components/vtu/ResourceListing";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";
import { getSessionUser } from "@/lib/auth";
import {
  getBranches,
  getBookmarks,
  getDownloads,
  getResourceStats,
  getResources,
  getSchemes,
  getSemesters,
  getSubjects,
  getVtuUpdates,
} from "@/lib/queries";

const SECTIONS: Record<
  string,
  {
    title: string;
    subtitle: string;
    type?: "NOTES" | "QUESTION_PAPER" | "SYLLABUS" | "LAB_MANUAL" | "ASSIGNMENT" | "OTHER";
    emptyTitle: string;
    emptyMessage: string;
  }
> = {
  updates: {
    title: "VTU Updates",
    subtitle: "Circulars, notifications and examination updates published by VTU.",
    emptyTitle: "No VTU updates yet",
    emptyMessage: "New updates will appear here as soon as they are published.",
  },
  notes: {
    title: "Subject Notes",
    subtitle: "Module-wise notes for every VTU subject, branch and semester.",
    type: "NOTES",
    emptyTitle: "No notes available",
    emptyMessage: "Try a different branch, semester or module filter.",
  },
  "question-papers": {
    title: "Question Papers",
    subtitle: "Previous year and model question papers with solutions.",
    type: "QUESTION_PAPER",
    emptyTitle: "No question papers available",
    emptyMessage: "Try a different branch, semester or subject filter.",
  },
  syllabus: {
    title: "Syllabus",
    subtitle: "Official VTU syllabus documents and curriculum copies.",
    type: "SYLLABUS",
    emptyTitle: "No syllabus available",
    emptyMessage: "Try a different branch or semester filter.",
  },
  assignments: {
    title: "Academic Assignments",
    subtitle: "Verified assignments and official coursework materials.",
    type: "ASSIGNMENT",
    emptyTitle: "No assignments available",
    emptyMessage: "Authentic academic assignments will appear here as they are published.",
  },
  "lab-manuals": {
    title: "Lab Manuals",
    subtitle: "Laboratory manuals, observation books and viva guidelines.",
    type: "LAB_MANUAL",
    emptyTitle: "No lab manuals available",
    emptyMessage: "Authentic VTU lab manuals will appear here as they are published.",
  },
  resources: {
    title: "All Resources",
    subtitle: "Every VTU study material — notes, papers, syllabus, manuals and more.",
    emptyTitle: "No resources found",
    emptyMessage: "Adjust your filters or clear the search to see more results.",
  },
  downloads: {
    title: "My Downloads",
    subtitle: "Every VTU resource you have downloaded from your account.",
    emptyTitle: "No downloads yet",
    emptyMessage: "Download a resource and it will be listed here.",
  },
};

const SECTION_METADATA: Record<
  string,
  { title: string; description: string; noindex?: boolean }
> = {
  notes: {
    title: "VTU Notes PDF – Subject & Module-wise Engineering Study Notes",
    description:
      "Download free, verified VTU notes PDF for 2018, 2021 & 2022 schemes across CSE, ISE, ECE, EEE, Mechanical & Civil Engineering. Organized module-by-module.",
  },
  "question-papers": {
    title: "VTU Previous Year Question Papers & Model Papers with Solutions",
    description:
      "Download official VTU previous year question papers and model exam question papers with answer solutions for all semesters and engineering branches.",
  },
  syllabus: {
    title: "VTU Syllabus PDF – Official Curriculum & Teaching Schemes",
    description:
      "Download official VTU syllabus copy and curriculum teaching schemes for 2018, 2021, and 2022 schemes across all engineering branches.",
  },
  assignments: {
    title: "VTU Academic Assignments & Coursework Materials",
    description:
      "Access verified VTU academic assignments, question banks, and coursework guidelines for semester exam preparation.",
  },
  "lab-manuals": {
    title: "VTU Lab Manuals PDF – Practical Experiment Guides & Viva",
    description:
      "Download VTU laboratory manuals, observation notes, practical experiment writeups, and viva questions for engineering lab exams.",
  },
  resources: {
    title: "VTU Academic Resources Library – Notes, Papers, Syllabus & Manuals",
    description:
      "Search the complete EngineerPrep India VTU library: download verified module notes, question papers, syllabus PDFs, and lab manuals.",
  },
  updates: {
    title: "VTU Notifications, Circulars & Examination Updates",
    description:
      "Stay informed with official Visvesvaraya Technological University (VTU) circulars, notifications, timetables, and exam alerts.",
  },
  downloads: {
    title: "My Downloads",
    description: "Manage and view your downloaded VTU study materials.",
    noindex: true,
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

  if (meta.noindex) {
    return {
      title: `${meta.title} | EngineerPrep India`,
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = absoluteUrl(`/vtu/${section}`);
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

export default async function VtuSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const config = SECTIONS[section];
  if (!config) notFound();

  const user = await getSessionUser();

  if (section === "downloads") {
    if (!user) {
      return (
        <EmptyState
          title="Login required"
          message="Sign in to view your downloaded VTU resources."
          action={
            <a
              href="/login?next=/vtu/downloads"
              className="inline-flex h-9 items-center rounded-lg bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
            >
              Login
            </a>
          }
        />
      );
    }
    const downloads = await getDownloads(user.id);
    return (
      <>
        <PageHeader
          breadcrumb={[
            { label: "VTU Notes & Resources", href: "/vtu" },
            { label: config.title },
          ]}
          title={config.title}
          subtitle={config.subtitle}
        />
        <DownloadList downloads={downloads} />
      </>
    );
  }

  if (section === "updates") {
    const updates = await getVtuUpdates();
    return (
      <>
        <PageHeader
          breadcrumb={[
            { label: "VTU Notes & Resources", href: "/vtu" },
            { label: "VTU Updates" },
          ]}
          title="Latest VTU Updates"
          subtitle={config.subtitle}
          actions={
            user?.role === "ADMIN" ? (
              <Button>
                <Upload className="size-4" /> Publish Update
              </Button>
            ) : undefined
          }
        />
        {updates.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="size-6" />}
            title={config.emptyTitle}
            message={config.emptyMessage}
          />
        ) : (
          <div className="space-y-3">
            {updates.map((update) => (
              <UpdateCard key={update.id} update={update} />
            ))}
          </div>
        )}
      </>
    );
  }

  const [resources, branches, semesters, schemes, subjects, stats, bookmarks] =
    await Promise.all([
      getResources(config.type ? { type: config.type, limit: 500 } : { limit: 500 }),
      getBranches(),
      getSemesters(),
      getSchemes(),
      getSubjects(),
      getResourceStats(),
      user ? getBookmarks(user.id) : Promise.resolve([]),
    ]);

  const bookmarkedIds = bookmarks
    .filter((b) => b.kind === "RESOURCE")
    .map((b) => b.refId);

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "VTU Notes & Resources", url: "/vtu" },
          { name: config.title, url: `/vtu/${section}` },
        ]}
      />
      <PageHeader
        breadcrumb={[
          { label: "VTU Notes & Resources", href: "/vtu" },
          { label: config.title },
        ]}
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <Badge tone="brand">
            <Database className="size-3" /> {resources.length} available
          </Badge>
        }
      />

      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-500">
            Quick filters
          </span>
          {[
            { label: "All Resources", href: "/vtu/resources" },
            { label: "Notes", href: "/vtu/notes" },
            { label: "Question Papers", href: "/vtu/question-papers" },
            { label: "Syllabus", href: "/vtu/syllabus" },
            { label: "Assignments", href: "/vtu/assignments" },
            { label: "Lab Manuals", href: "/vtu/lab-manuals" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex h-7 items-center rounded-full border border-line px-2.5 text-[0.7rem] font-bold text-ink-700 hover:border-brand-300 hover:text-brand-600"
            >
              {item.label}
            </a>
          ))}
        </div>
        <p className="mt-2.5 text-[0.7rem] text-ink-500">
          Library totals — Notes {stats.NOTES.toLocaleString()} · Question
          papers {stats.QUESTION_PAPER.toLocaleString()} · Syllabus{" "}
          {stats.SYLLABUS.toLocaleString()} · Lab manuals{" "}
          {(stats.LAB_MANUAL || 0).toLocaleString()}
        </p>
      </Card>

      <ResourceListing
        resources={resources}
        meta={{ branches, semesters, schemes, subjects }}
        bookmarkedIds={bookmarkedIds}
        isLoggedIn={Boolean(user)}
        emptyTitle={config.emptyTitle}
        emptyMessage={config.emptyMessage}
      />
    </>
  );
}
