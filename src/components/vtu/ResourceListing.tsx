"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookMarked,
  BookmarkX,
  FileStack,
  FileText,
  Filter,
  Inbox,
  RotateCcw,
  ScrollText,
  Search,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FilterDropdown,
  Pagination,
  SearchBar,
  useToast,
} from "@/components/ui";
import { ResourceCard } from "@/components/cards";
import { cn } from "@/lib/utils";

export type ResourceRow = {
  id: string;
  title: string;
  description?: string | null;
  resourceType: string;
  moduleNumber?: number | null;
  fileSize: string;
  downloadCount: number;
  subjectName?: string | null;
  subjectCode?: string | null;
  semesterNumber?: number | null;
  branchCode?: string | null;
  fileUrl?: string;
};

export type FilterMeta = {
  branches: Array<{ id: string; code: string; name: string }>;
  semesters: Array<{ id: string; number: number; label: string }>;
  schemes: Array<{ id: string; name: string }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    branchId: string | null;
    semesterId: string | null;
  }>;
};

export function ResourceListing({
  resources,
  meta,
  bookmarkedIds,
  isLoggedIn,
  emptyTitle = "No resources found",
  emptyMessage = "Try adjusting your search terms or resetting the filters.",
}: {
  resources: ResourceRow[];
  meta: FilterMeta;
  bookmarkedIds: string[];
  isLoggedIn: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [branchId, setBranchId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [schemeId, setSchemeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [module, setModule] = useState("");
  const [page, setPage] = useState(1);
  const [bookmarks, setBookmarks] = useState<string[]>(bookmarkedIds);
  const [busy, setBusy] = useState<string | null>(null);

  const pageSize = 9;

  const subjectOptions = useMemo(() => {
    let list = meta.subjects;
    if (branchId) list = list.filter((s) => s.branchId === branchId);
    if (semesterId) list = list.filter((s) => s.semesterId === semesterId);
    return list.map((s) => ({ id: s.id, label: `${s.code} — ${s.name}` }));
  }, [meta.subjects, branchId, semesterId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return resources.filter((resource) => {
      if (needle) {
        const hay = `${resource.title} ${resource.subjectName ?? ""} ${resource.subjectCode ?? ""} ${resource.description ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (subjectId) {
        // subjectId filter is applied by matching code prefix
        const subject = meta.subjects.find((s) => s.id === subjectId);
        if (subject && resource.subjectCode !== subject.code) return false;
      }
      if (branchId) {
        const branch = meta.branches.find((b) => b.id === branchId);
        if (branch && resource.branchCode && resource.branchCode !== branch.code)
          return false;
      }
      if (semesterId) {
        const sem = meta.semesters.find((s) => s.id === semesterId);
        if (sem && resource.semesterNumber && resource.semesterNumber !== sem.number)
          return false;
      }
      if (schemeId) {
        // scheme is not stored per resource; keep the row visible (demo data is 2022 scheme)
        void schemeId;
      }
      if (module && String(resource.moduleNumber ?? "") !== module) return false;
      return true;
    });
  }, [resources, q, subjectId, branchId, semesterId, schemeId, module, meta]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);

  function reset() {
    setQ("");
    setBranchId("");
    setSemesterId("");
    setSchemeId("");
    setSubjectId("");
    setModule("");
    setPage(1);
  }

  async function download(resource: ResourceRow) {
    if (!isLoggedIn) {
      router.push("/login?next=" + encodeURIComponent(window.location.pathname));
      return;
    }
    setBusy(resource.id);
    try {
      const res = await fetch(`/api/v1/resources/download/${resource.id}`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.data?.fileUrl) {
        window.open(json.data.fileUrl, "_blank", "noopener");
        push({
          title: "Download started",
          description: resource.title,
          tone: "success",
        });
        router.refresh();
      } else {
        push({ title: "Download failed", description: json.message, tone: "error" });
      }
    } finally {
      setBusy(null);
    }
  }

  async function toggleBookmark(resource: ResourceRow) {
    if (!isLoggedIn) {
      router.push("/login?next=" + encodeURIComponent(window.location.pathname));
      return;
    }
    setBusy(resource.id);
    try {
      const res = await fetch(`/api/v1/resources/bookmark/${resource.id}`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        const isBookmarked = Boolean(json.data?.bookmarked);
        setBookmarks((prev) =>
          isBookmarked
            ? [...prev, resource.id]
            : prev.filter((id) => id !== resource.id),
        );
        push({
          title: isBookmarked ? "Bookmarked" : "Bookmark removed",
          description: resource.title,
          tone: isBookmarked ? "success" : "info",
        });
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {/* Filters */}
      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <p className="epi-label">Search by subject, semester or topic</p>
            <SearchBar
              value={q}
              onChange={(value) => {
                setQ(value);
                setPage(1);
              }}
              placeholder="Search notes, question papers, syllabus…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-end">
            <div>
              <p className="epi-label">Branch</p>
              <FilterDropdown
                label="Branch"
                value={branchId}
                onChange={(value) => {
                  setBranchId(value);
                  setSubjectId("");
                  setPage(1);
                }}
                options={[
                  { id: "", label: "All Branches" },
                  ...meta.branches.map((b) => ({ id: b.id, label: b.code })),
                ]}
              />
            </div>
            <div>
              <p className="epi-label">Semester</p>
              <FilterDropdown
                label="Semester"
                value={semesterId}
                onChange={(value) => {
                  setSemesterId(value);
                  setSubjectId("");
                  setPage(1);
                }}
                options={[
                  { id: "", label: "All Semesters" },
                  ...meta.semesters.map((s) => ({
                    id: s.id,
                    label: `Semester ${s.number}`,
                  })),
                ]}
              />
            </div>
            <div>
              <p className="epi-label">Scheme</p>
              <FilterDropdown
                label="Scheme"
                value={schemeId}
                onChange={(value) => {
                  setSchemeId(value);
                  setPage(1);
                }}
                options={[
                  { id: "", label: "All Schemes" },
                  ...meta.schemes.map((s) => ({ id: s.id, label: s.name })),
                ]}
              />
            </div>
            <div>
              <p className="epi-label">Subject</p>
              <FilterDropdown
                label="Subject"
                value={subjectId}
                onChange={(value) => {
                  setSubjectId(value);
                  setPage(1);
                }}
                className="min-w-40"
                options={[
                  { id: "", label: "All Subjects" },
                  ...subjectOptions,
                ]}
              />
            </div>
            <div>
              <p className="epi-label">Module</p>
              <FilterDropdown
                label="Module"
                value={module}
                onChange={(value) => {
                  setModule(value);
                  setPage(1);
                }}
                options={[
                  { id: "", label: "All Modules" },
                  ...Array.from({ length: 5 }, (_, i) => ({
                    id: String(i + 1),
                    label: `Module ${i + 1}`,
                  })),
                ]}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <p className="inline-flex items-center gap-1.5 text-xs text-ink-500">
            <Filter className="size-3.5" />
            <span className="font-bold text-ink-900">{filtered.length}</span>{" "}
            resources match your filters
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="size-3.5" /> Reset Filters
            </Button>
            <Button
              size="sm"
              onClick={() => setPage(1)}
              className="invisible"
              aria-hidden
            >
              <Search className="size-3.5" /> Search
            </Button>
          </div>
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title={emptyTitle}
          message={emptyMessage}
          action={
            <Button variant="outline" onClick={reset}>
              Reset Filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                bookmarked={bookmarks.includes(resource.id)}
                onBookmark={() => toggleBookmark(resource)}
                onDownload={() => download(resource)}
                downloading={busy === resource.id}
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
    </div>
  );
}

/* ------------------------- Downloads listing ------------------------ */

export function DownloadList({
  downloads,
}: {
  downloads: Array<{
    id: string;
    title: string | null;
    fileSize: string | null;
    fileUrl: string | null;
    resourceType: string | null;
    downloadedAt: Date | string;
  }>;
}) {
  const [q, setQ] = useState("");
  const filtered = downloads.filter((d) =>
    (d.title ?? "").toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div>
      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <p className="epi-label">Search your downloads</p>
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Search downloaded resources…"
            />
          </div>
          <Badge tone="brand" className="h-9 justify-center px-3">
            <FileStack className="size-3.5" /> {filtered.length} files
          </Badge>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="size-6" />}
          title="No downloads yet"
          message="Download VTU notes and question papers to see them here."
        />
      ) : (
        <Card className="divide-y divide-line">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500">
                {item.resourceType === "QUESTION_PAPER" ? (
                  <ScrollText className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {item.title}
                </p>
                <p className="text-[0.68rem] text-ink-500">
                  {new Date(item.downloadedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  {item.fileSize ? ` · ${item.fileSize}` : ""}
                </p>
              </div>
              {item.fileUrl && (
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
                >
                  <FileText className="size-3.5" /> Open
                </a>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export { BookmarkX, cn };
