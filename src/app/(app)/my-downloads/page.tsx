import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Downloads",
  robots: { index: false, follow: false },
};
import { DownloadList } from "@/components/vtu/ResourceListing";
import { PageHeader } from "@/components/layout";
import { getDownloads } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";

export default async function MyDownloadsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/my-downloads");

  const downloads = await getDownloads(user.id);

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Student Dashboard", href: "/dashboard" },
          { label: "My Downloads" },
        ]}
        title="My Downloads"
        subtitle="Every VTU resource you have downloaded from your account."
      />
      <DownloadList
        downloads={downloads.map((d) => ({
          id: d.id,
          title: d.title,
          fileSize: d.fileSize,
          fileUrl: d.fileUrl,
          resourceType: d.resourceType,
          downloadedAt: d.downloadedAt,
        }))}
      />
    </>
  );
}
