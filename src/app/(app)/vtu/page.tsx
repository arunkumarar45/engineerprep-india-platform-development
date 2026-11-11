import { PageHeader } from "@/components/layout";
import { VtuOverviewClient } from "@/components/vtu/VtuOverviewClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
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
      getResources({ type: "NOTES" }),
      getBranches(),
      getSemesters(),
      getSchemes(),
      getSubjects(),
    ]);

  return (
    <>
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
