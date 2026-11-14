import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { Badge } from "@/components/ui";
import { JobBoard } from "@/components/jobs/JobBoard";
import { getApplications, getOpportunities, getSavedOpportunityIds } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Fresher Jobs & Internships for Engineering Students in India",
  description:
    "Explore verified software engineering fresher jobs, tech internships, and off-campus recruitment drives across Bangalore, Hyderabad, Pune, and India.",
  alternates: {
    canonical: absoluteUrl("/jobs"),
  },
  openGraph: {
    title: "Fresher Jobs & Internships for Engineers | EngineerPrep India",
    description:
      "Find entry-level developer roles, campus hiring alerts, and paid engineering internships.",
    url: absoluteUrl("/jobs"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fresher Jobs & Internships for Engineers | EngineerPrep India",
    description:
      "Find entry-level developer roles, campus hiring alerts, and paid engineering internships.",
  },
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; view?: string }>;
}) {
  const { type, view } = await searchParams;
  const user = await getSessionUser();

  const [jobs, savedIds, applications] = await Promise.all([
    getOpportunities(),
    user ? getSavedOpportunityIds(user.id) : Promise.resolve(new Set<string>()),
    user ? getApplications(user.id) : Promise.resolve([]),
  ]);

  const initialType =
    type && ["JOB", "INTERNSHIP", "OFF_CAMPUS"].includes(type) ? type : "ALL";

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Jobs & Internships", url: "/jobs" },
        ]}
      />
      <PageHeader
        breadcrumb={[{ label: "Jobs & Internships" }]}
        title="Jobs & Internships"
        subtitle="Discover verified job and internship opportunities for students."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {view === "companies" && <Badge tone="brand">Company pages</Badge>}
            <Badge tone="neutral">{jobs.length} live opportunities</Badge>
          </div>
        }
      />

      {view === "companies" && (
        <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Microsoft", logoText: "MS", tint: "#00A4EF", roles: 12 },
            { name: "Amazon", logoText: "AZ", tint: "#FF9900", roles: 24 },
            { name: "Google", logoText: "GO", tint: "#4285F4", roles: 8 },
            { name: "TCS", logoText: "TC", tint: "#1F3A93", roles: 40 },
            { name: "Infosys", logoText: "IN", tint: "#007CC3", roles: 35 },
            { name: "Wipro", logoText: "WI", tint: "#341E6B", roles: 22 },
            { name: "Zoho", logoText: "ZO", tint: "#E42527", roles: 9 },
          ].map((company) => (
            <div key={company.name} className="epi-card flex items-center gap-3 p-4">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
                style={{ background: company.tint }}
              >
                {company.logoText}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink-900">
                  {company.name}
                </p>
                <p className="text-[0.68rem] text-ink-500">
                  {company.roles} open roles
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <JobBoard
        jobs={jobs as never}
        savedIds={[...savedIds]}
        appliedIds={applications
          .map((a) => a.opportunityId)
          .filter((id): id is string => Boolean(id))}
        isLoggedIn={Boolean(user)}
        isAdmin={user?.role === "ADMIN"}
        initialType={initialType}
      />
    </>
  );
}
