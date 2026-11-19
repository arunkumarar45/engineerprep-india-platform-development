import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { VtuOverviewClient } from "@/components/vtu/VtuOverviewClient";
import { absoluteUrl } from "@/lib/site-config";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "VTU Notes & Academic Resources | EngineerPrep India",
  description:
    "Comprehensive VTU study library: verified module-wise notes, previous year question papers, and official syllabus schemes across CSE, ISE, ECE, EEE, ME, and Civil.",
  alternates: {
    canonical: absoluteUrl("/vtu"),
  },
  openGraph: {
    title: "VTU Notes & Academic Resources | EngineerPrep India",
    description:
      "All VTU updates, module-wise study notes, question papers, and syllabus schemes in one unified repository.",
    url: absoluteUrl("/vtu"),
  },
};

// No `force-dynamic` — the cached queries let Next.js reuse the response.
// User-specific props (isAdmin, isLoggedIn) are passed from a cookie-verified call
// that happens on every request anyway, so ISR is the right trade-off.
export const revalidate = 60; // Regenerate at most once per minute
import { getSessionUser } from "@/lib/auth";
import {
  getBranches,
  getResourceStats,
  getResources,
  getSchemes,
  getSemesters,
  getSubjects,
  getVtuUpdates,
} from "@/lib/queries";

export default async function VtuOverviewPage() {
  const user = await getSessionUser();
  const [updates, stats, resources, branches, semesters, schemes, subjects] =
    await Promise.all([
      getVtuUpdates(),
      getResourceStats(),
      getResources({ type: "NOTES", limit: 50 }), // show first 50 notes as preview only
      getBranches(),
      getSemesters(),
      getSchemes(),
      getSubjects(),
    ]);

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "VTU Notes & Resources", url: "/vtu" },
        ]}
      />
      <PageHeader
        breadcrumb={[{ label: "VTU Notes & Resources" }]}
        title="VTU Notes & Resources"
        subtitle="All VTU updates, study materials and exam resources in one place."
      />

      <VtuOverviewClient
        updates={updates}
        stats={stats}
        resources={resources}
        meta={{ branches, semesters, schemes, subjects }}
        isAdmin={user?.role === "ADMIN"}
        isLoggedIn={!!user}
      />
    </>
  );
}
