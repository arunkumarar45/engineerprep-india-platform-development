"use client";

import { useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageCircle,
  X,
} from "lucide-react";
import { Badge, Button, Card, Select, useToast } from "@/components/ui";

type Props = {
  onClose: () => void;
  isLoggedIn: boolean;
};

export function SubmitJobDialog({ onClose, isLoggedIn }: Props) {
  const { push } = useToast();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("0-1");
  const [opportunityType, setOpportunityType] = useState("JOB");
  const [jobLink, setJobLink] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [source, setSource] = useState("Naukri");
  const [description, setDescription] = useState("");
  const [workMode, setWorkMode] = useState("ONSITE");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!company.trim() || !title.trim() || !location.trim() || !jobLink.trim()) {
      push({ title: "Company, title, location and job link are required", tone: "error" });
      return;
    }

    // Basic URL validation
    try {
      new URL(jobLink);
    } catch {
      push({ title: "Please enter a valid job link URL (e.g. https://...)", tone: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company.trim(),
          title: title.trim(),
          location: location.trim(),
          experienceRange: experience,
          opportunityType,
          workMode,
          applicationUrl: jobLink.trim(),
          whatsappChannelUrl: whatsappLink.trim() || undefined,
          source: source.trim(),
          description: description.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Submission failed");

      setDone(true);
      push({
        title: "Job posted live!",
        description: "Your opportunity is now visible on the jobs board.",
        tone: "success",
      });
    } catch (err) {
      push({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Unknown error",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <Card className="flex flex-col items-center gap-4 p-8 text-center max-w-sm w-full">
          <CheckCircle2 className="size-12 text-success-500" />
          <div>
            <p className="font-bold text-ink-900">Job vacancy published live!</p>
            <p className="mt-1 text-sm text-ink-500">
              Thank you! The job opportunity is now live on the board for all students.
            </p>
          </div>
          <Badge tone="success">Live on Board</Badge>
          <Button
            onClick={() => {
              onClose();
              window.location.href = "/jobs";
            }}
          >
            View on Jobs Board
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-lg overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-4">
          <div>
            <h2 className="font-bold text-ink-900">Share a Job / Drive</h2>
            <p className="text-xs text-ink-500">
              Found a job posting? Share it with fellow students. We'll verify
              and publish it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg hover:bg-surface-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Preview card — shows how it'll look */}
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
            <p className="text-xs font-bold text-brand-700 mb-1.5">Preview</p>
            <div className="flex items-start gap-2.5">
              <div
                className="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
                style={{ background: "#1a56db" }}
              >
                {company ? company.slice(0, 2).toUpperCase() : "CO"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-ink-900 truncate">
                  {title || "Job Title"}
                </p>
                <p className="text-xs text-ink-500 truncate">
                  {company || "Company"} · {location || "Location"}
                </p>
                {jobLink && (
                  <a
                    href={jobLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[0.68rem] text-brand-600 hover:underline"
                  >
                    <ExternalLink className="size-3" /> Apply
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Type tabs */}
          <div className="flex gap-2">
            {[
              { value: "JOB", label: "💼 Job" },
              { value: "INTERNSHIP", label: "🎓 Internship" },
              { value: "OFF_CAMPUS", label: "🏕️ Off-Campus Drive" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOpportunityType(opt.value)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors
                  ${opportunityType === opt.value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-line text-ink-700 hover:border-brand-300"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Company + title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="epi-label">Company Name *</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none"
                placeholder="e.g. Cognizant"
              />
            </div>
            <div>
              <label className="epi-label">Role / Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none"
                placeholder="e.g. PE Fresher Mapping Role"
              />
            </div>
          </div>

          {/* Location + experience */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="epi-label">Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none"
                placeholder="e.g. Hyderabad / Pan India"
              />
            </div>
            <div>
              <label className="epi-label">Experience (years)</label>
              <Select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="mt-1 h-9 w-full py-0 text-xs"
              >
                <option value="0-0">Fresher (0 years)</option>
                <option value="0-1">0–1 years</option>
                <option value="1-2">1–2 years</option>
                <option value="2-3">2–3 years</option>
                <option value="3-5">3–5 years</option>
              </Select>
            </div>
          </div>

          {/* Work mode + source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="epi-label">Work Mode</label>
              <Select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="mt-1 h-9 w-full py-0 text-xs"
              >
                <option value="ONSITE">Onsite</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
              </Select>
            </div>
            <div>
              <label className="epi-label">Found on</label>
              <Select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1 h-9 w-full py-0 text-xs"
              >
                <option value="Naukri">Naukri.com</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Indeed">Indeed</option>
                <option value="Internshala">Internshala</option>
                <option value="Company Website">Company Website</option>
                <option value="WhatsApp">WhatsApp Group</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>

          {/* Job link */}
          <div>
            <label className="epi-label flex items-center gap-1">
              <ExternalLink className="size-3" /> Job Application Link *
            </label>
            <input
              type="url"
              value={jobLink}
              onChange={(e) => setJobLink(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none"
              placeholder="https://www.naukri.com/job-listings-…"
            />
          </div>

          {/* WhatsApp channel (optional) */}
          <div>
            <label className="epi-label flex items-center gap-1">
              <MessageCircle className="size-3 text-green-600" /> WhatsApp Channel Link
              <span className="text-ink-400">(optional)</span>
            </label>
            <input
              type="url"
              value={whatsappLink}
              onChange={(e) => setWhatsappLink(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none"
              placeholder="https://whatsapp.com/channel/…"
            />
          </div>

          {/* Description */}
          <div>
            <label className="epi-label">
              Additional Details <span className="text-ink-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none"
              placeholder="Any extra info — required skills, batch eligibility, referral details…"
            />
          </div>

          {/* Note */}
          <p className="flex items-start gap-1.5 rounded-lg bg-surface-100 px-3 py-2 text-xs text-ink-500">
            <Briefcase className="mt-0.5 size-3.5 shrink-0" />
            Submitted jobs go through a quick review before appearing on the
            board. Usually approved within a few hours.
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Briefcase className="size-4" /> Share Job
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

