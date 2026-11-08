import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Share2,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Badge, Button, Card } from "@/components/ui";
import { JobApplyButton } from "./JobApplyButton";
import { getOpportunity, getSavedOpportunityIds } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { daysUntil, formatDate, formatSalary, jsonArray } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "responsibilities", label: "Responsibilities" },
  { id: "eligibility", label: "Eligibility" },
  { id: "process", label: "Hiring Process" },
  { id: "company", label: "About Company" },
];

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await getOpportunity(jobId);
  if (!job) notFound();

  const user = await getSessionUser();
  const saved = user ? await getSavedOpportunityIds(user.id) : new Set<string>();
  const isSaved = saved.has(job.id);
  const left = daysUntil(job.applicationDeadline);

  const responsibilities = jsonArray<string>(job.responsibilities);
  const eligibility = jsonArray<string>(job.eligibility);
  const hiringProcess = jsonArray<string>(job.hiringProcess);
  const skills = jsonArray<string>(job.requiredSkills);
  const branches = jsonArray<string>(job.branchEligibility);

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Jobs", href: "/jobs" },
          { label: job.title },
        ]}
        title={job.title}
        subtitle={`${job.companyName} · ${job.location}`}
        actions={
          <JobApplyButton
            jobId={job.id}
            jobTitle={job.title}
            companyName={job.companyName ?? ""}
            isSaved={isSaved}
            isLoggedIn={Boolean(user)}
            applicationUrl={job.applicationUrl}
          />
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          {/* Header card */}
          <Card className="p-5">
            <div className="flex flex-wrap items-start gap-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-2xl text-lg font-extrabold text-white"
                style={{ background: job.companyLogoColor ?? "#17212B" }}
              >
                {job.companyLogoText ?? "CO"}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold text-ink-900">
                  {job.title}
                </h2>
                <p className="text-sm font-semibold text-ink-500">
                  {job.companyName}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone="dark">
                    {job.opportunityType === "OFF_CAMPUS"
                      ? "Off-Campus"
                      : job.opportunityType === "JOB"
                        ? "Job"
                        : "Internship"}
                  </Badge>
                  <Badge tone="neutral">{job.workMode}</Badge>
                  <Badge tone="neutral">
                    <MapPin className="size-3" /> {job.location}
                  </Badge>
                  {job.graduationBatch && (
                    <Badge tone="neutral">
                      <GraduationCap className="size-3" /> {job.graduationBatch} batch
                    </Badge>
                  )}
                  {left !== null && (
                    <Badge tone={left <= 3 ? "error" : "brand"}>
                      <CalendarClock className="size-3" />
                      {left <= 0
                        ? "Applications closed"
                        : `${left} day${left === 1 ? "" : "s"} left`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
              <Button variant="outline" size="sm">
                <Share2 className="size-3.5" /> Share Job
              </Button>
              <Link
                href="/jobs"
                className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
              >
                <Briefcase className="size-3.5" /> Browse more
              </Link>
            </div>
          </Card>

          {/* Tabs */}
          <div className="epi-scroll-x flex gap-1 border-b border-line">
            {TABS.map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className="-mb-px shrink-0 border-b-2 border-transparent px-3.5 py-2.5 text-sm font-semibold text-ink-500 hover:text-ink-900"
              >
                {tab.label}
              </a>
            ))}
          </div>

          <section id="overview" className="epi-card p-5">
            <h3 className="text-sm font-bold text-ink-900">Role overview</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              {job.description}
            </p>
          </section>

          {responsibilities.length > 0 && (
            <section id="responsibilities" className="epi-card p-5">
              <h3 className="text-sm font-bold text-ink-900">
                Key responsibilities
              </h3>
              <ul className="mt-2.5 space-y-2">
                {responsibilities.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-ink-700"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {eligibility.length > 0 && (
            <section id="eligibility" className="epi-card p-5">
              <h3 className="text-sm font-bold text-ink-900">Eligibility</h3>
              <ul className="mt-2.5 space-y-2">
                {eligibility.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-ink-700"
                  >
                    <GraduationCap className="mt-0.5 size-4 shrink-0 text-success-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hiringProcess.length > 0 && (
            <section id="process" className="epi-card p-5">
              <h3 className="text-sm font-bold text-ink-900">Hiring process</h3>
              <ol className="mt-2.5 space-y-2">
                {hiringProcess.map((item, index) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-ink-700"
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[0.65rem] font-bold text-brand-600">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section id="company" className="epi-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <Building2 className="size-4 text-brand-500" /> About {job.companyName}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              {job.companyAbout ??
                "Company details will be added by our team soon."}
            </p>
            {job.companyWebsite && (
              <a
                href={job.companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-bold text-brand-600 hover:underline"
              >
                Visit website →
              </a>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-ink-900">Application details</h3>
            <dl className="mt-3.5 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-ink-500">
                  <Wallet className="size-3.5" />
                  {job.opportunityType === "JOB" ? "Salary" : "Stipend"}
                </dt>
                <dd className="text-right font-bold text-ink-900">
                  {formatSalary(job.salaryMin, job.salaryMax, job.stipend)}
                </dd>
              </div>
              {job.duration && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-ink-500">Duration</dt>
                  <dd className="text-right font-bold text-ink-900">
                    {job.duration}
                  </dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-500">Application deadline</dt>
                <dd className="text-right font-bold text-ink-900">
                  {formatDate(job.applicationDeadline)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-500">Work mode</dt>
                <dd className="text-right font-bold text-ink-900">
                  {job.workMode}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-500">Batch</dt>
                <dd className="text-right font-bold text-ink-900">
                  {job.graduationBatch ?? "Any"}
                </dd>
              </div>
            </dl>
          </Card>

          {branches.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-bold text-ink-900">
                Eligible branches
              </h3>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {branches.map((branch) => (
                  <span
                    key={branch}
                    className="rounded-md bg-navy-900/5 px-2 py-0.5 text-[0.68rem] font-semibold text-ink-700"
                  >
                    {branch}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {skills.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-bold text-ink-900">Required skills</h3>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <Badge key={skill} tone="brand">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="text-sm font-bold text-ink-900">Save this role</h3>
            <p className="mt-1.5 text-xs text-ink-500">
              Bookmark to revisit later from Saved Jobs.
            </p>
            <div className="mt-3">
              {isSaved ? (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 text-xs font-bold text-brand-600">
                  <BookmarkCheck className="size-3.5" /> Saved
                </span>
              ) : (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-bold text-ink-700">
                  <Bookmark className="size-3.5" /> Not saved
                </span>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}

