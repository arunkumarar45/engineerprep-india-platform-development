"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  Sparkles,
  Upload,
} from "lucide-react";
import { Badge, Button, Card, Select, useToast } from "@/components/ui";

export function JobSubmitClient() {
  const router = useRouter();
  const { push } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [opportunityType, setOpportunityType] = useState<"JOB" | "INTERNSHIP" | "OFF_CAMPUS">("JOB");
  const [location, setLocation] = useState("Bengaluru");
  const [workMode, setWorkMode] = useState<"ONSITE" | "REMOTE" | "HYBRID">("ONSITE");
  const [experienceRange, setExperienceRange] = useState("0-1");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [whatsappChannelUrl, setWhatsappChannelUrl] = useState("");
  const [source, setSource] = useState("LinkedIn");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [stipend, setStipend] = useState("");
  const [graduationBatch, setGraduationBatch] = useState("2025");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!companyName.trim() || !title.trim() || !location.trim() || !applicationUrl.trim()) {
      push({
        title: "Required fields missing",
        description: "Please provide Company Name, Job Title, Location, and Application Link.",
        tone: "error",
      });
      return;
    }

    try {
      new URL(applicationUrl);
    } catch {
      push({
        title: "Invalid Application URL",
        description: "Please enter a valid link starting with http:// or https://",
        tone: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const skillsArray = requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/v1/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          title: title.trim(),
          opportunityType,
          location: location.trim(),
          workMode,
          experienceRange,
          applicationUrl: applicationUrl.trim(),
          whatsappChannelUrl: whatsappChannelUrl.trim() || undefined,
          source: source.trim(),
          salaryMin: salaryMin ? parseInt(salaryMin, 10) * 100000 : undefined,
          salaryMax: salaryMax ? parseInt(salaryMax, 10) * 100000 : undefined,
          stipend: stipend ? parseInt(stipend, 10) : undefined,
          graduationBatch: graduationBatch ? parseInt(graduationBatch, 10) : 2025,
          requiredSkills: skillsArray,
          description: description.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message ?? "Job submission failed");
      }

      setDone(true);
      push({
        title: "Opportunity Published Live!",
        description: `"${title}" at ${companyName} is now live on EngineerPrep India.`,
        tone: "success",
      });
    } catch (err) {
      push({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Network error",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card className="flex flex-col items-center gap-4 p-8 text-center shadow-lg border-success-200 bg-success-50/20">
          <CheckCircle2 className="size-16 text-success-600" />
          <h1 className="text-2xl font-bold text-ink-900">Job Opportunity is Live!</h1>
          <p className="max-w-md text-sm text-ink-600">
            Thank you for contributing! Your posted opportunity for <strong>{title}</strong> at{" "}
            <strong>{companyName}</strong> has been published and is immediately visible to thousands of engineering students across India.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button onClick={() => router.push("/jobs")}>
              View on Jobs Board →
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDone(false);
                setTitle("");
                setCompanyName("");
                setApplicationUrl("");
                setDescription("");
              }}
            >
              Post Another Opportunity
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Company Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Cognizant, Infosys, Cisco, Google"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Job / Role Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Associate Software Engineer, SDE Intern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Opportunity Type & Work Mode */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Opportunity Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={opportunityType}
                onChange={(e) => setOpportunityType(e.target.value as any)}
                className="w-full text-sm"
              >
                <option value="JOB">Full-Time Job</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="OFF_CAMPUS">Off-Campus Drive</option>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Work Mode <span className="text-red-500">*</span>
              </label>
              <Select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as any)}
                className="w-full text-sm"
              >
                <option value="ONSITE">On-Site (In-Office)</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote (Work From Home)</option>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Experience Required
              </label>
              <Select
                value={experienceRange}
                onChange={(e) => setExperienceRange(e.target.value)}
                className="w-full text-sm"
              >
                <option value="0-0">Fresher (0 yrs)</option>
                <option value="0-1">0 - 1 years</option>
                <option value="1-2">1 - 2 years</option>
                <option value="2-3">2 - 3 years</option>
              </Select>
            </div>
          </div>

          {/* Location & Batch */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Location / City <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru, Hyderabad, Pune, Pan India"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Eligible Batch (Graduation Year)
              </label>
              <Select
                value={graduationBatch}
                onChange={(e) => setGraduationBatch(e.target.value)}
                className="w-full text-sm"
              >
                <option value="2024">2024 Batch</option>
                <option value="2025">2025 Batch</option>
                <option value="2026">2026 Batch</option>
                <option value="2027">2027 Batch</option>
              </Select>
            </div>
          </div>

          {/* Application URL & Source */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Application Link (Official Portal / Naukri / LinkedIn) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="url"
                  required
                  placeholder="https://naukri.com/... or https://company.com/careers/..."
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Source Platform
              </label>
              <Select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-sm"
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Naukri">Naukri.com</option>
                <option value="Official Portal">Company Career Portal</option>
                <option value="Unstop">Unstop</option>
                <option value="Indeed">Indeed</option>
                <option value="WhatsApp Group">WhatsApp / Telegram Group</option>
                <option value="Alumni Referral">Alumni / Referral</option>
              </Select>
            </div>
          </div>

          {/* Compensation & Skills */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Min Salary (LPA, optional)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 4.5"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Max Salary (LPA, optional)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 8.0"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-800">
                Stipend (₹/month, if internship)
              </label>
              <input
                type="number"
                placeholder="e.g. 25000"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-800">
              Key Skills (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Java, Python, SQL, React, DSA, Problem Solving"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-800">
              Job Description / Additional Notes
            </label>
            <textarea
              rows={4}
              placeholder="Paste key responsibilities, eligibility criteria (e.g. 60% throughout 10th/12th/B.E.), or test format..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Publishing...
                </>
              ) : (
                <>
                  <Upload className="size-4" /> Publish Opportunity Live
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Sidebar Info Card */}
      <div className="space-y-4">
        <Card className="p-5 border-brand-200 bg-brand-50/20">
          <h3 className="flex items-center gap-2 text-sm font-bold text-brand-900">
            <Sparkles className="size-4 text-brand-600" /> Why Share Openings?
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-600">
            Off-campus hiring drives and fresher openings are scattered across multiple portals. By sharing direct links here, you help fellow engineering students discover real opportunities early.
          </p>
          <div className="mt-4 space-y-2 text-xs text-ink-700">
            <div className="flex items-center gap-2">
              <span className="text-success-600 font-bold">✓</span> Real-time instant publishing
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success-600 font-bold">✓</span> Verified application links
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success-600 font-bold">✓</span> Direct redirection to employer portal
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-ink-900">Supported Sources</h3>
          <ul className="mt-3 space-y-2 text-xs text-ink-600">
            <li>• Official Company Portals (TCS, Infosys, Amazon, etc.)</li>
            <li>• LinkedIn Jobs & Postings</li>
            <li>• Naukri.com Openings</li>
            <li>• Unstop Competitions & Hirings</li>
            <li>• Verified WhatsApp / Telegram notifications</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

