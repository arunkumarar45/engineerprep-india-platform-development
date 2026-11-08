"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Building2, Inbox, Search, Upload } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FilterDropdown,
  Pagination,
  SearchBar,
  Select,
  Tabs,
  useToast,
} from "@/components/ui";
import { OpportunityCard } from "@/components/cards";
import { ApplyDialog } from "./ApplyDialog";
import { SubmitJobDialog } from "./SubmitJobDialog";
import { cn } from "@/lib/utils";

export type JobRow = {
  id: string;
  title: string;
  description: string | null;
  opportunityType: string;
  location: string;
  workMode: string;
  branchEligibility: unknown;
  graduationBatch: number | null;
  requiredSkills: unknown;
  salaryMin: number | null;
  salaryMax: number | null;
  stipend: number | null;
  duration: string | null;
  applicationDeadline: Date | string | null;
  applicationUrl: string | null;
  status: string;
  postedAt: Date | string;
  companyName: string | null;
  companyLogoText: string | null;
  companyLogoColor: string | null;
};

const TABS = [
  { id: "ALL", label: "All" },
  { id: "JOB", label: "Jobs" },
  { id: "INTERNSHIP", label: "Internships" },
  { id: "OFF_CAMPUS", label: "Off-Campus" },
];

const MODES = ["ALL", "ONSITE", "REMOTE", "HYBRID"];
const BATCHES = ["", "2025", "2026", "2027"];

export function JobBoard({
  jobs,
  savedIds,
  appliedIds,
  isLoggedIn,
  isAdmin,
  initialType = "ALL",
}: {
  jobs: JobRow[];
  savedIds: string[];
  appliedIds: string[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  initialType?: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [type, setType] = useState(initialType);
  const [branch, setBranch] = useState("");
  const [batch, setBatch] = useState("");
  const [location, setLocation] = useState("");
  const [mode, setMode] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<string[]>(savedIds);
  const [applyFor, setApplyFor] = useState<JobRow | null>(null);
  const [showSubmitJob, setShowSubmitJob] = useState(false);

  const pageSize = 6;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = jobs.filter((job) => {
      if (type !== "ALL" && job.opportunityType !== type) return false;
      if (mode !== "ALL" && job.workMode !== mode) return false;
      if (batch && String(job.graduationBatch ?? "") !== batch) return false;
      if (
        location &&
        !job.location.toLowerCase().includes(location.toLowerCase())
      )
        return false;
      if (branch) {
        const list = Array.isArray(job.branchEligibility)
          ? (job.branchEligibility as string[])
          : [];
        if (
          list.length &&
          !list.some((b) => b.toLowerCase().includes(branch.toLowerCase()))
        )
          return false;
      }
      if (needle) {
        const skills = Array.isArray(job.requiredSkills)
          ? (job.requiredSkills as string[]).join(" ")
          : "";
        const hay = `${job.title} ${job.companyName ?? ""} ${skills} ${job.location}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    if (sort === "oldest")
      return [...rows].sort(
        (a, b) =>
          new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime(),
      );
    if (sort === "deadline")
      return [...rows].sort((a, b) => {
        const left = a.applicationDeadline
          ? new Date(a.applicationDeadline).getTime()
          : Infinity;
        const right = b.applicationDeadline
          ? new Date(b.applicationDeadline).getTime()
          : Infinity;
        return left - right;
      });
    return [...rows].sort(
      (a, b) =>
        new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
    );
  }, [jobs, q, type, mode, batch, location, branch, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);

  async function toggleSave(job: JobRow) {
    if (!isLoggedIn) {
      router.push(`/login?next=/jobs`);
      return;
    }
    const res = await fetch(`/api/v1/jobs/save/${job.id}`, { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      const isSaved = Boolean(json.data?.saved);
      setSaved((prev) =>
        isSaved ? [...prev, job.id] : prev.filter((id) => id !== job.id),
      );
      push({
        title: isSaved ? "Job saved" : "Removed from saved jobs",
        description: job.title,
        tone: isSaved ? "success" : "info",
      });
      router.refresh();
    }
  }

  function reset() {
    setQ("");
    setType("ALL");
    setBranch("");
    setBatch("");
    setLocation("");
    setMode("ALL");
    setSort("newest");
    setPage(1);
  }

  return (
    <>
      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <p className="epi-label">Search by role, company, skills or location</p>
            <SearchBar
              value={q}
              onChange={(value) => {
                setQ(value);
                setPage(1);
              }}
              placeholder="Search jobs and internships…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-end">
            <div>
              <p className="epi-label">Opportunity type</p>
              <FilterDropdown
                label="Opportunity type"
                value={type}
                onChange={(value) => {
                  setType(value);
                  setPage(1);
                }}
                options={[
                  { id: "ALL", label: "All types" },
                  { id: "JOB", label: "Jobs" },
                  { id: "INTERNSHIP", label: "Internships" },
                  { id: "OFF_CAMPUS", label: "Off-campus" },
                ]}
              />
            </div>
            <div>
              <p className="epi-label">Branch</p>
              <FilterDropdown
                label="Branch"
                value={branch}
                onChange={(value) => {
                  setBranch(value);
                  setPage(1);
                }}
                options={[
                  { id: "", label: "All branches" },
                  ...["CSE", "ISE", "ECE", "EEE", "ME", "CIV"].map((code) => ({
                    id: code,
                    label: code,
                  })),
                ]}
              />
            </div>
            <div>
              <p className="epi-label">Batch</p>
              <FilterDropdown
                label="Graduation batch"
                value={batch}
                onChange={(value) => {
                  setBatch(value);
                  setPage(1);
                }}
                options={[
                  { id: "", label: "All batches" },
                  ...BATCHES.filter(Boolean).map((year) => ({
                    id: year,
                    label: year,
                  })),
                ]}
              />
            </div>
            <div>
              <p className="epi-label">Location</p>
              <Select
                aria-label="Location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setPage(1);
                }}
                className="h-9 min-w-28 py-0 text-xs"
              >
                <option value="">All locations</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Pune">Pune</option>
                <option value="Remote">Remote</option>
                <option value="Pan India">Pan India</option>
              </Select>
            </div>
            <div>
              <p className="epi-label">Work mode</p>
              <FilterDropdown
                label="Work mode"
                value={mode}
                onChange={(value) => {
                  setMode(value);
                  setPage(1);
                }}
                options={MODES.map((m) => ({
                  id: m,
                  label: m === "ALL" ? "All modes" : m,
                }))}
              />
            </div>
            <div>
              <p className="epi-label">Sort</p>
              <FilterDropdown
                label="Sort"
                value={sort}
                onChange={setSort}
                options={[
                  { id: "newest", label: "Newest first" },
                  { id: "oldest", label: "Oldest first" },
                  { id: "deadline", label: "Deadline" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <Tabs
            tabs={TABS}
            active={type}
            onChange={(next) => {
              setType(next);
              setPage(1);
            }}
          />
          <div className="flex items-center gap-2">
            <Badge tone="brand">{filtered.length} results</Badge>
            <Button variant="outline" size="sm" onClick={reset}>
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="No opportunities found"
          message="Try a different keyword, branch, batch or work mode."
          action={
            <Button variant="outline" onClick={reset}>
              Reset Filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((job) => (
              <OpportunityCard
                key={job.id}
                job={job}
                saved={saved.includes(job.id)}
                onToggleSave={() => toggleSave(job)}
              />
            ))}
          </div>
          <div className="mt-5">
            <Pagination
              page={current}
              pages={pages}
              total={filtered.length}
              onChange={setPage}
            />
          </div>
        </>
      )}

      <Card className="mt-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <Building2 className="size-4 text-brand-500" /> Know a job opening?
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              {isAdmin
                ? "You can publish and manage opportunities from the admin console."
                : "Found a job on Naukri, LinkedIn or a WhatsApp group? Share it — help your fellow students!"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/jobs")}
              >
                <Upload className="size-4" /> Manage opportunities
              </Button>
            )}
            <Button
              variant={isLoggedIn ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                if (!isLoggedIn) {
                  router.push("/login?next=/jobs");
                  return;
                }
                setShowSubmitJob(true);
              }}
            >
              <Upload className="size-4" />
              {isLoggedIn ? "Share a Job / Drive" : "Login to Share"}
            </Button>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { icon: "🔗", label: "Paste any job link", desc: "Naukri, LinkedIn, Indeed, company sites" },
            { icon: "✅", label: "Quick review", desc: "Our team verifies within a few hours" },
            { icon: "📢", label: "Helps 1000s of students", desc: "Your tip reaches the entire community" },
          ].map((step) => (
            <div key={step.label} className="flex items-start gap-2 rounded-lg bg-surface-100 p-2.5">
              <span className="text-base">{step.icon}</span>
              <div>
                <p className="text-xs font-bold text-ink-900">{step.label}</p>
                <p className="text-[0.68rem] text-ink-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showSubmitJob && (
        <SubmitJobDialog
          isLoggedIn={isLoggedIn}
          onClose={() => setShowSubmitJob(false)}
        />
      )}

      {applyFor && (
        <ApplyDialog
          job={applyFor}
          onClose={() => setApplyFor(null)}
          onApplied={() => {
            setApplyFor(null);
            router.refresh();
          }}
        />
      )}

      {appliedIds.length > 0 && (
        <p className="mt-3 text-xs text-ink-500">
          You have applied to {appliedIds.length} opportunities — track them in{" "}
          <button
            onClick={() => router.push("/jobs/applications")}
            className="font-bold text-brand-600 hover:underline"
          >
            My Applications
          </button>
          .
        </p>
      )}
    </>
  );
}

export { Search };
