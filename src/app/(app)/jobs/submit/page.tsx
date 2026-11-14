import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { JobSubmitClient } from "./JobSubmitClient";

export const metadata: Metadata = {
  title: "Post an Opportunity",
  robots: { index: false, follow: false },
};

export default function SubmitJobPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: "Jobs & Internships", href: "/jobs" },
          { label: "Post Opportunity" },
        ]}
        title="Post a Job or Internship Opportunity"
        subtitle="Found an opening on LinkedIn, Naukri, an off-campus drive, or company portal? Share it here with fellow students."
      />

      <JobSubmitClient />
    </div>
  );
}
