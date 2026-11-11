import { PageHeader } from "@/components/layout";
import { ResumeBuilder } from "@/components/resume/ResumeBuilder";

export default function ResumePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: "Placement Guides", href: "/placements" },
          { label: "Resume Builder" },
        ]}
        title="Engineering Resume Builder"
        subtitle="Build an ATS-proof engineering resume scored in real-time. Designed specifically for campus drives and tier-1 product recruiters."
      />

      <ResumeBuilder />
    </div>
  );
}

