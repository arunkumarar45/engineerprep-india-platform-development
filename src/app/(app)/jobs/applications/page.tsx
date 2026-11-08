import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Badge, Card, EmptyState } from "@/components/ui";
import { StatCard } from "@/components/cards";
import { getApplications } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { daysUntil, formatDate } from "@/lib/utils";

const STATUS_TONES: Record<string, "brand" | "success" | "warning" | "error" | "neutral" | "info"> =
  {
    APPLIED: "brand",
    UNDER_REVIEW: "info",
    SHORTLISTED: "success",
    INTERVIEW: "warning",
    SELECTED: "success",
    REJECTED: "error",
    WITHDRAWN: "neutral",
  };

export default async function ApplicationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/jobs/applications");

  const applications = await getApplications(user.id);

  const inProgress = applications.filter((a) =>
    ["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW"].includes(a.status),
  ).length;
  const closed = applications.length - inProgress;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Jobs", href: "/jobs" }, { label: "My Applications" }]}
        title="My Applications"
        subtitle="Track every opportunity you have applied to."
        actions={
          <Link
            href="/jobs"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
          >
            <Briefcase className="size-4" /> Find more
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Applications"
          value={applications.length}
          icon={<ClipboardList className="size-5" />}
        />
        <StatCard
          label="In progress"
          value={inProgress}
          icon={<Clock className="size-5" />}
          tone="info"
        />
        <StatCard
          label="Closed"
          value={closed}
          icon={<CheckCircle2 className="size-5" />}
          tone="success"
        />
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-6" />}
          title="No applications yet"
          message="Apply to a job or internship and it will show up here for tracking."
          action={
            <Link
              href="/jobs"
              className="inline-flex h-9 items-center rounded-lg bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
            >
              Browse opportunities
            </Link>
          }
        />
      ) : (
        <Card className="p-0">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-bold text-ink-900">Application tracker</h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Demo data — statuses update through the admin console in a real
              deployment.
            </p>
          </div>
          <div className="divide-y divide-line">
            {applications.map((application) => {
              const left = daysUntil(application.applicationDeadline);
              return (
                <div
                  key={application.id}
                  className="flex flex-wrap items-center gap-4 px-5 py-4"
                >
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
                    style={{
                      background: application.companyLogoColor ?? "#17212B",
                    }}
                  >
                    {application.companyLogoText ?? "CO"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-900">
                      {application.title}
                    </p>
                    <p className="text-[0.7rem] text-ink-500">
                      {application.companyName} · {application.location}
                    </p>
                  </div>
                  <div className="text-[0.7rem] text-ink-500">
                    Applied {formatDate(application.appliedAt)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {application.status === "REJECTED" ? (
                      <XCircle className="size-3.5 text-error-500" />
                    ) : application.status === "SELECTED" ? (
                      <CheckCircle2 className="size-3.5 text-success-500" />
                    ) : (
                      <CalendarClock className="size-3.5 text-ink-500" />
                    )}
                    <Badge tone={STATUS_TONES[application.status] ?? "neutral"}>
                      {application.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="text-[0.7rem] font-semibold text-ink-500">
                    {left === null
                      ? "—"
                      : left <= 0
                        ? "Deadline passed"
                        : `${left}d to deadline`}
                  </div>
                  {application.opportunityId && (
                    <Link
                      href={`/jobs/${application.opportunityId}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
                    >
                      <ExternalLink className="size-3.5" /> View
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
