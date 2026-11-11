"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  MapPin,
  ArrowRight,
  Users,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar, difficultyTone } from "@/components/ui";
import { cn, daysUntil, formatDate, formatSalary, initials } from "@/lib/utils";

/* ------------------------------ StatCard ----------------------------- */

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  hint?: ReactNode;
  icon?: React.ReactNode;
  tone?: "brand" | "dark" | "success" | "info";
  onClick?: () => void;
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-500",
    dark: "bg-navy-900 text-white",
    success: "bg-success-500/10 text-success-500",
    info: "bg-[#eef4ff] text-[#2b6cb0]",
  };
  const Tag = onClick ? "button" : "div";
  return (
    <Card
      className={cn("p-4 text-left", onClick && "epi-card-hover w-full")}
    >
      <Tag onClick={onClick} className="flex w-full items-start gap-3 text-left">
        {icon && (
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl",
              tones[tone],
            )}
          >
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[0.7rem] font-bold uppercase tracking-wider text-ink-500">
            {label}
          </span>
          <span className="mt-0.5 block text-xl font-extrabold leading-tight text-ink-900">
            {value}
          </span>
          {hint && (
            <span className="mt-1 block text-[0.7rem] text-ink-500">{hint}</span>
          )}
        </span>
      </Tag>
    </Card>
  );
}

/* ---------------------------- ResourceCard --------------------------- */

export function ResourceCard({
  resource,
  bookmarked = false,
  onBookmark,
  onDownload,
  downloading = false,
}: {
  resource: {
    id: string;
    title: string;
    description?: string | null;
    resourceType: string;
    moduleNumber?: number | null;
    fileSize: string;
    downloadCount: number;
    subjectName?: string | null;
    subjectCode?: string | null;
    semesterNumber?: number | null;
    branchCode?: string | null;
  };
  bookmarked?: boolean;
  onBookmark?: () => void;
  onDownload?: () => void;
  downloading?: boolean;
}) {
  const typeLabel: Record<string, string> = {
    NOTES: "Notes",
    QUESTION_PAPER: "Question Paper",
    SYLLABUS: "Syllabus",
    LAB_MANUAL: "Lab Manual",
    ASSIGNMENT: "Assignment",
    OTHER: "Resource",
  };
  return (
    <Card hover className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-500">
          <FileText className="size-5" />
        </span>
        <div className="flex items-center gap-1.5">
          <Badge tone="brand">{typeLabel[resource.resourceType] ?? "Resource"}</Badge>
          {onBookmark && (
            <button
              onClick={onBookmark}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark resource"}
              className={cn(
                "grid size-7 place-items-center rounded-lg border transition-colors",
                bookmarked
                  ? "border-brand-200 bg-brand-50 text-brand-500"
                  : "border-line text-ink-500 hover:text-brand-500",
              )}
            >
              {bookmarked ? (
                <BookmarkCheck className="size-3.5" />
              ) : (
                <Bookmark className="size-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-ink-900">
        <Link
          href={`/vtu/view/${resource.id}`}
          target="_blank"
          className="transition-colors hover:text-brand-600 hover:underline"
        >
          {resource.title}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
        {resource.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] font-semibold text-ink-500">
        {resource.subjectName && (
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="size-3" /> {resource.subjectCode} ·{" "}
            {resource.subjectName}
          </span>
        )}
        {resource.semesterNumber && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3" /> Sem {resource.semesterNumber}
          </span>
        )}
        {resource.moduleNumber && (
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3" /> Module {resource.moduleNumber}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="text-[0.68rem] text-ink-500">
          {resource.fileSize} · {resource.downloadCount.toLocaleString()} downloads
        </span>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/vtu/view/${resource.id}`}
            target="_blank"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-600"
          >
            <Eye className="size-3.5" /> View
          </Link>
          <Button size="sm" onClick={onDownload} loading={downloading}>
            <Download className="size-3.5" /> Download
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ----------------------------- UpdateCard ---------------------------- */

export function UpdateCard({
  update,
  onDownload,
}: {
  update: {
    id: string;
    title: string;
    category: string;
    summary?: string | null;
    publishedAt: Date | string;
    fileSize?: string | null;
    fileUrl?: string | null;
  };
  onDownload?: () => void;
}) {
  return (
    <Card hover className="flex flex-col p-4 sm:flex-row sm:items-center">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-500">
        <CalendarClock className="size-5" />
      </span>
      <div className="mt-3 min-w-0 flex-1 sm:mt-0 sm:ml-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-ink-900">{update.title}</h3>
          <Badge tone="info">{update.category}</Badge>
        </div>
        {update.summary && (
          <p className="mt-1 line-clamp-2 text-xs text-ink-500">{update.summary}</p>
        )}
        <p className="mt-1.5 text-[0.68rem] text-ink-500">
          Published {formatDate(update.publishedAt)}
          {update.fileSize ? ` · ${update.fileSize}` : ""}
        </p>
      </div>
      {update.fileUrl ? (
        <a
          href={update.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600 sm:mt-0 sm:ml-4"
        >
          <Download className="size-3.5" /> Download PDF
        </a>
      ) : (
        <Button size="sm" variant="outline" className="mt-3 sm:mt-0 sm:ml-4" onClick={onDownload}>
          <Download className="size-3.5" /> Official Notice
        </Button>
      )}
    </Card>
  );
}

/* ---------------------------- DSASheetCard --------------------------- */

const SHEET_TINTS = [
  "linear-gradient(135deg,#FF5A00,#FF7A1A)",
  "linear-gradient(135deg,#1D4ED8,#3B82F6)",
  "linear-gradient(135deg,#0F766E,#22A06B)",
  "linear-gradient(135deg,#6D28D9,#8B5CF6)",
  "linear-gradient(135deg,#B45309,#F5A623)",
  "linear-gradient(135deg,#0369A1,#0EA5E9)",
];

export function DSASheetCard({
  sheet,
  index,
  solved = 0,
  href,
}: {
  sheet: {
    id: string;
    title: string;
    author?: string | null;
    difficulty: string;
    totalProblems: number;
    coverTint?: string | null;
    coverImageUrl?: string | null;
    thumbnailUrl?: string | null;
    thumbnailAlt?: string | null;
    slug?: string;
  };
  index: number;
  solved?: number;
  href: string;
}) {
  const percent = sheet.totalProblems
    ? Math.round((solved / sheet.totalProblems) * 100)
    : 0;

  const thumbnailSrc =
    sheet.thumbnailUrl ||
    sheet.coverImageUrl ||
    (sheet.slug ? `/thumbnails/dsa-sheets/${sheet.slug}.jpg` : null);

  return (
    <Card hover className="group flex h-full flex-col overflow-hidden p-0 border border-line bg-surface transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink-950">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={sheet.thumbnailAlt || sheet.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
        ) : null}

        {/* Graceful Fallback if image missing or error */}
        <div
          className={cn(
            "absolute inset-0 flex-col justify-end p-4 text-white",
            thumbnailSrc ? "hidden" : "flex",
          )}
          style={{ background: sheet.coverTint ?? SHEET_TINTS[index % SHEET_TINTS.length] }}
        >
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-white/80">
            {sheet.author ?? "Educator Sheet"}
          </p>
          <p className="text-base font-extrabold leading-tight text-white">
            {sheet.totalProblems} problems
          </p>
        </div>

        {/* Top Badges Overlay */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 pointer-events-none">
          <Badge tone="brand" className="backdrop-blur-md bg-white/95 font-bold text-[0.68rem] text-brand-700 shadow-xs">
            {sheet.author || "Curated DSA"}
          </Badge>
          <Badge tone="dark" className="backdrop-blur-md bg-ink-900/85 text-[0.68rem] font-semibold text-white shadow-xs">
            {sheet.difficulty}
          </Badge>
        </div>

        {/* Bottom Problems Pill */}
        <div className="absolute bottom-2.5 left-3 pointer-events-none">
          <span className="inline-flex items-center rounded-md bg-ink-950/85 px-2.5 py-1 text-[0.7rem] font-bold text-white shadow-xs backdrop-blur-xs">
            {sheet.totalProblems} Problems
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink-900 group-hover:text-brand-600 transition-colors">
          {sheet.title}
        </h3>
        <p className="mt-1 text-xs text-ink-500">
          Curated by <span className="font-semibold text-ink-700">{sheet.author ?? "Top Educator"}</span>
        </p>

        <div className="mt-3.5 pt-3 border-t border-line/60">
          <div className="mb-1.5 flex items-center justify-between text-[0.68rem] font-semibold text-ink-500">
            <span>Completion</span>
            <span className="tabular-nums font-bold text-ink-900">
              {solved} / {sheet.totalProblems} ({percent}%)
            </span>
          </div>
          <ProgressBar value={percent} showLabel={false} />
        </div>

        <Link
          href={href}
          className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 text-xs font-bold text-white transition-all hover:bg-brand-600 hover:shadow-xs active:scale-[0.99]"
        >
          <span>View Sheet</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Card>
  );
}

/* ---------------------------- RoadmapCard ---------------------------- */

export function RoadmapCard({
  roadmap,
  progress,
  href,
}: {
  roadmap: {
    id: string;
    title: string;
    description?: string | null;
    category: string;
    difficulty: string;
    stepCount: number;
    estimatedDuration?: string | null;
    coverTint?: string | null;
  };
  progress: number;
  href: string;
}) {
  return (
    <Card hover className="flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl text-white"
          style={{ background: roadmap.coverTint ?? "#FF5A00" }}
        >
          <GraduationCap className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <Badge tone="brand">{roadmap.category}</Badge>
          <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-ink-900">
            {roadmap.title}
          </h3>
        </div>
      </div>
      <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
        {roadmap.description}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] font-semibold text-ink-500">
        <span className="inline-flex items-center gap-1">
          <Users className="size-3" /> {roadmap.stepCount} steps
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" /> {roadmap.estimatedDuration ?? "Self paced"}
        </span>
        <Badge tone={difficultyTone(roadmap.difficulty)}>
          {roadmap.difficulty}
        </Badge>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[0.68rem] font-semibold text-ink-500">
          <span>Progress</span>
          <span className="tabular-nums text-ink-900">{progress}%</span>
        </div>
        <ProgressBar value={progress} showLabel={false} />
      </div>
      <Link
        href={href}
        className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white transition-colors hover:bg-brand-600"
      >
        {progress > 0 ? "Resume Roadmap" : "Start Roadmap"}
      </Link>
    </Card>
  );
}

/* ---------------------------- Opportunity ---------------------------- */

export function OpportunityCard({
  job,
  saved,
  onToggleSave,
}: {
  job: {
    id: string;
    title: string;
    companyName?: string | null;
    companyLogoText?: string | null;
    companyLogoColor?: string | null;
    location: string;
    opportunityType: string;
    workMode: string;
    graduationBatch?: number | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    stipend?: number | null;
    duration?: string | null;
    applicationDeadline?: Date | string | null;
    requiredSkills?: unknown;
  };
  saved: boolean;
  onToggleSave?: () => void;
}) {
  const skills = Array.isArray(job.requiredSkills)
    ? (job.requiredSkills as string[])
    : [];
  const left = daysUntil(job.applicationDeadline);
  return (
    <Card hover className="flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
          style={{ background: job.companyLogoColor ?? "#17212B" }}
        >
          {job.companyLogoText ?? initials(job.companyName ?? "C")}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-bold text-ink-900">
            {job.title}
          </h3>
          <p className="text-xs font-semibold text-ink-500">{job.companyName}</p>
        </div>
        {onToggleSave && (
          <button
            onClick={onToggleSave}
            aria-label={saved ? "Remove from saved jobs" : "Save job"}
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors",
              saved
                ? "border-brand-200 bg-brand-50 text-brand-500"
                : "border-line text-ink-500 hover:text-brand-500",
            )}
          >
            {saved ? (
              <BookmarkCheck className="size-4" />
            ) : (
              <Bookmark className="size-4" />
            )}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge tone={job.opportunityType === "JOB" ? "dark" : "brand"}>
          {job.opportunityType === "OFF_CAMPUS" ? "Off-Campus" : job.opportunityType === "JOB" ? "Job" : "Internship"}
        </Badge>
        <Badge tone="neutral">{job.workMode}</Badge>
        {job.graduationBatch && <Badge tone="neutral">{job.graduationBatch} Batch</Badge>}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-[0.7rem]">
        <div>
          <dt className="text-ink-500">Location</dt>
          <dd className="font-semibold text-ink-900">{job.location}</dd>
        </div>
        <div>
          <dt className="text-ink-500">
            {job.opportunityType === "JOB" ? "Salary" : "Stipend"}
          </dt>
          <dd className="font-semibold text-ink-900">
            {formatSalary(job.salaryMin, job.salaryMax, job.stipend)}
          </dd>
        </div>
        {job.duration && (
          <div>
            <dt className="text-ink-500">Duration</dt>
            <dd className="font-semibold text-ink-900">{job.duration}</dd>
          </div>
        )}
        <div>
          <dt className="text-ink-500">Deadline</dt>
          <dd
            className={cn(
              "font-semibold",
              left !== null && left <= 3 ? "text-error-500" : "text-ink-900",
            )}
          >
            {left === null
              ? "—"
              : left <= 0
                ? "Closed"
                : `${left} day${left === 1 ? "" : "s"} left`}
          </dd>
        </div>
      </dl>

      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-navy-900/5 px-1.5 py-0.5 text-[0.65rem] font-semibold text-ink-700"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <Link
        href={`/jobs/${job.id}`}
        className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-500 text-xs font-bold text-white transition-colors hover:bg-brand-600"
      >
        View Details <ExternalLink className="size-3.5" />
      </Link>
    </Card>
  );
}

/* ----------------------------- Problem row --------------------------- */

export function ProblemRow({
  problem,
  index,
  solved,
  onToggle,
  href,
}: {
  problem: { id: string; title: string; difficulty: string; slug: string };
  index: number;
  solved: boolean;
  onToggle?: () => void;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
      <span className="w-6 shrink-0 text-xs font-bold tabular-nums text-ink-500">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        {href ? (
          <Link
            href={href}
            className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-600"
          >
            {problem.title}
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold text-ink-900">
            {problem.title}
          </p>
        )}
      </div>
      <Badge tone={difficultyTone(problem.difficulty)}>{problem.difficulty}</Badge>
      <button
        onClick={onToggle}
        aria-label={solved ? "Mark as not solved" : "Mark as solved"}
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-lg border transition-colors",
          solved
            ? "border-success-500/25 bg-success-500/10 text-success-500"
            : "border-line text-ink-500 hover:text-success-500",
        )}
      >
        {solved ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <Circle className="size-4" />
        )}
      </button>
    </div>
  );
}

export { MapPin };
