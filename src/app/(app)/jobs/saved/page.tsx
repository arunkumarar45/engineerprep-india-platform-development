import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Jobs",
  robots: { index: false, follow: false },
};

export default async function SavedJobsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/jobs/saved");

  const [jobs, savedIds] = await Promise.all([
    getOpportunities(),
    getSavedOpportunityIds(user.id),
  ]);
  const saved = jobs.filter((job) => savedIds.has(job.id));

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Jobs", href: "/jobs" }, { label: "Saved Jobs" }]}
        title="Saved Jobs"
        subtitle="Opportunities you bookmarked for later."
        actions={<span className="text-xs font-bold text-ink-500">{saved.length} saved</span>}
      />

      {saved.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-6" />}
          title="No saved jobs yet"
          message="Tap the bookmark icon on any opportunity to save it here."
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((job) => (
            <OpportunityCard key={job.id} job={job} saved />
          ))}
        </div>
      )}

      <div className="mt-5">
        <Link
          href="/jobs/applications"
          className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-4 text-sm font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
        >
          View my applications
        </Link>
      </div>
    </>
  );
}
