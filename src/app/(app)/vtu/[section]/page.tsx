import { notFound } from "next/navigation";
import { CalendarClock, Database, Upload } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { PageHeader } from "@/components/layout";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { UpdateCard } from "@/components/cards";
import { DownloadList, ResourceListing } from "@/components/vtu/ResourceListing";
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
      getResources(config.type ? { type: config.type } : {}),
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
