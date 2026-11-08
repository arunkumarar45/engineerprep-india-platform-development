"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, BookmarkCheck, Send } from "lucide-react";
import { Button, useToast } from "@/components/ui";
import { ApplyDialog } from "@/components/jobs/ApplyDialog";
import type { JobRow } from "@/components/jobs/JobBoard";

export function JobApplyButton({
  jobId,
  jobTitle,
  companyName,
  isSaved,
  isLoggedIn,
  applicationUrl,
}: {
  jobId: string;
  jobTitle: string;
  companyName: string;
  isSaved: boolean;
  isLoggedIn: boolean;
  applicationUrl: string | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [applyOpen, setApplyOpen] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [saving, setSaving] = useState(false);

  async function toggleSave() {
    if (!isLoggedIn) {
      router.push(`/login?next=/jobs/${jobId}`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/jobs/save/${jobId}`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setSaved(Boolean(json.data?.saved));
        push({
          title: json.data?.saved ? "Job saved" : "Removed from saved jobs",
          description: jobTitle,
          tone: json.data?.saved ? "success" : "info",
        });
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setApplyOpen(true)}>
        <Send className="size-4" /> Apply Now
      </Button>
      <Button
        variant="outline"
        onClick={toggleSave}
        loading={saving}
        aria-label={saved ? "Remove from saved jobs" : "Save job"}
      >
        {saved ? (
          <BookmarkCheck className="size-4 text-brand-500" />
        ) : (
          <Bookmark className="size-4" />
        )}
        {saved ? "Saved" : "Save Job"}
      </Button>

      {applyOpen && (
        <ApplyDialog
          job={
            {
              id: jobId,
              title: jobTitle,
              description: null,
              opportunityType: "JOB",
              location: "",
              workMode: "ONSITE",
              branchEligibility: [],
              graduationBatch: null,
              requiredSkills: [],
              salaryMin: null,
              salaryMax: null,
              stipend: null,
              duration: null,
              applicationDeadline: null,
              applicationUrl,
              status: "OPEN",
              postedAt: new Date().toISOString(),
              companyName,
              companyLogoText: null,
              companyLogoColor: null,
            } as JobRow
          }
          onClose={() => setApplyOpen(false)}
          onApplied={() => router.refresh()}
        />
      )}
    </>
  );
}
