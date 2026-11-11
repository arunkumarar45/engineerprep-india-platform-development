"use client";

import { useState, useEffect } from "react";
import {
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  Layers,
  Database,
  Eye,
  BookOpen,
  Filter,
} from "lucide-react";

interface CollectorStats {
  liveResources: { category: string; count: number }[];
  discovered: {
    byCategory: { category: string; count: number }[];
    byApproval: { approvalStatus: string; count: number }[];
    byDownloadStatus: { downloadStatus: string; count: number }[];
  };
  recentJobs: any[];
}

interface DiscoveredItem {
  id: string;
  category: string;
  title: string;
  subjectCode: string | null;
  schemeName: string | null;
  semesterNumber: number | null;
  branchCode: string | null;
  sourceWebsite: string;
  sourcePageUrl: string | null;
  originalFileUrl: string;
  storedFilePath: string | null;
  fileSize: string | null;
  fileHash: string | null;
  downloadStatus: string;
  validationStatus: string;
  validationNotes: string | null;
  approvalStatus: string;
  isUploaded: boolean;
  createdAt: string;
}

export function VtuCollectorConsole() {
  const [stats, setStats] = useState<CollectorStats | null>(null);
  const [discoveredItems, setDiscoveredItems] = useState<DiscoveredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "jobs" | "discovery">("queue");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedApproval, setSelectedApproval] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Discovery form
  const [discCategory, setDiscCategory] = useState<string>("QUESTION_PAPER");
  const [discSource, setDiscSource] = useState<string>("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, discRes] = await Promise.all([
        fetch("/api/v1/admin/vtu-collector/stats").then((r) => r.json()),
        fetch(`/api/v1/admin/vtu-collector/discovered?limit=100`).then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (discRes.success) setDiscoveredItems(discRes.data.items || []);
    } catch (err) {
      console.error("Failed to load collector data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerJob = async (jobType: "DISCOVERY" | "DOWNLOAD" | "UPLOAD") => {
    try {
      setActionLoading(jobType);
      const res = await fetch("/api/v1/admin/vtu-collector/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobType,
          category: discCategory === "ALL" ? undefined : discCategory,
          sourceWebsite: discSource,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", message: `Job ${jobType} initiated successfully.` });
        setTimeout(loadData, 2000);
      } else {
        setNotification({ type: "error", message: data.message || "Failed to start job." });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err?.message || "Failed to start job." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/v1/admin/vtu-collector/discovered/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        setDiscoveredItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, approvalStatus: "APPROVED" } : item)),
        );
        setNotification({ type: "success", message: "Resource approved for upload." });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err?.message || "Approval failed." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/v1/admin/vtu-collector/discovered/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Rejected by admin audit" }),
      });
      if (res.ok) {
        setDiscoveredItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, approvalStatus: "REJECTED" } : item)),
        );
        setNotification({ type: "success", message: "Resource marked as rejected." });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err?.message || "Rejection failed." });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredItems = discoveredItems.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    if (selectedApproval !== "ALL" && item.approvalStatus !== selectedApproval) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alert banner for Notes preservation */}
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Notes Isolation Active:</strong> Existing VTU Notes database records, counts, and files are 100%
            preserved and will never be overwritten or disturbed by the collector.
          </span>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-xs font-medium hover:bg-emerald-600/20"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Stats
        </button>
      </div>

      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
            notification.type === "success"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Category Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Question Papers",
            live: stats?.liveResources.find((r) => r.category === "QUESTION_PAPER")?.count || 0,
            discovered: stats?.discovered.byCategory.find((c) => c.category === "QUESTION_PAPER")?.count || 0,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20",
          },
          {
            label: "Syllabus (Official)",
            live: stats?.liveResources.find((r) => r.category === "SYLLABUS")?.count || 0,
            discovered: stats?.discovered.byCategory.find((c) => c.category === "SYLLABUS")?.count || 0,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-500/10 border-purple-500/20",
          },
          {
            label: "Lab Manuals",
            live: stats?.liveResources.find((r) => r.category === "LAB_MANUAL")?.count || 0,
            discovered: stats?.discovered.byCategory.find((c) => c.category === "LAB_MANUAL")?.count || 0,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
          },
          {
            label: "Important Questions",
            live: stats?.liveResources.find((r) => r.category === "ASSIGNMENT")?.count || 0,
            discovered: stats?.discovered.byCategory.find((c) => c.category === "ASSIGNMENT")?.count || 0,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
          },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.bg}`}>
            <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className={`text-2xl font-bold ${card.color}`}>{card.live}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">Live Published</span>
              </div>
              <span className="rounded-md bg-background/80 px-2 py-0.5 text-xs font-semibold">
                +{card.discovered} in queue
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Control Panel */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Autonomous Academic Collection Engine
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Discover genuine VTU PDFs, validate magic bytes and integrity, filter out HTML error pages, and safely upload
          to respective categories.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Target Category</label>
            <select
              value={discCategory}
              onChange={(e) => setDiscCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="QUESTION_PAPER">Question Papers</option>
              <option value="SYLLABUS">Syllabus</option>
              <option value="LAB_MANUAL">Lab Manuals</option>
              <option value="ASSIGNMENT">Important Questions</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Source Provider</label>
            <select
              value={discSource}
              onChange={(e) => setDiscSource(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Sources (vtu.ac.in + vtucircle.com)</option>
              <option value="vtu.ac.in">VTU Official (vtu.ac.in)</option>
              <option value="vtucircle.com">VTU Circle (vtucircle.com)</option>
            </select>
          </div>

          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              onClick={() => triggerJob("DISCOVERY")}
              disabled={actionLoading !== null}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              1. Discover
            </button>
            <button
              onClick={() => triggerJob("DOWNLOAD")}
              disabled={actionLoading !== null}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              2. Download & Validate
            </button>
            <button
              onClick={() => triggerJob("UPLOAD")}
              disabled={actionLoading !== null}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              3. Publish Approved
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("queue")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
            activeTab === "queue"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          Review & Approval Queue ({discoveredItems.length})
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
            activeTab === "jobs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Play className="h-4 w-4" />
          Collection Jobs ({stats?.recentJobs?.length || 0})
        </button>
      </div>

      {activeTab === "queue" && (
        <div className="space-y-4">
          {/* Queue Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filter by:
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Categories</option>
              <option value="QUESTION_PAPER">Question Papers</option>
              <option value="SYLLABUS">Syllabus</option>
              <option value="LAB_MANUAL">Lab Manuals</option>
              <option value="ASSIGNMENT">Important Questions</option>
            </select>
            <select
              value={selectedApproval}
              onChange={(e) => setSelectedApproval(e.target.value)}
              className="rounded-lg border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Approval Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Resource Title & Code</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Source & Link</th>
                    <th className="px-3 py-3">Validation & Size</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                        No discovered resources found matching selected filters. Click "Discover" above to begin.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground line-clamp-1">{item.title}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            {item.subjectCode && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                                {item.subjectCode}
                              </span>
                            )}
                            {item.schemeName && <span>{item.schemeName}</span>}
                            {item.semesterNumber && <span>Sem {item.semesterNumber}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                            {item.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <p className="font-medium text-foreground">{item.sourceWebsite}</p>
                          <a
                            href={item.originalFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            Source File <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            {item.validationStatus === "VALID" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : item.validationStatus === "FLAGGED" ? (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium">{item.validationStatus}</span>
                          </div>
                          <p className="mt-0.5 text-muted-foreground">{item.fileSize || "—"}</p>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <span
                            className={`rounded-full px-2 py-0.5 font-semibold ${
                              item.approvalStatus === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : item.approvalStatus === "REJECTED"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {item.approvalStatus.replace(/_/g, " ")}
                          </span>
                          {item.isUploaded && (
                            <span className="mt-1 block text-[10px] font-semibold text-emerald-600">
                              ✓ Uploaded to Live
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.storedFilePath && (
                              <a
                                href={item.storedFilePath}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="Preview Downloaded PDF"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            )}
                            {item.approvalStatus !== "APPROVED" && (
                              <button
                                onClick={() => handleApprove(item.id)}
                                disabled={actionLoading === item.id}
                                className="rounded bg-emerald-600/10 px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-600/20"
                              >
                                Approve
                              </button>
                            )}
                            {item.approvalStatus !== "REJECTED" && (
                              <button
                                onClick={() => handleReject(item.id)}
                                disabled={actionLoading === item.id}
                                className="rounded bg-red-600/10 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-600/20"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "jobs" && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Job ID & Type</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Progress</th>
                <th className="px-3 py-3">Processed</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {(stats?.recentJobs || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No recent collection jobs. Trigger a discovery or download job to see execution logs.
                  </td>
                </tr>
              ) : (
                stats?.recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{job.jobType}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{job.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-3 py-3">{job.category || "ALL"}</td>
                    <td className="px-3 py-3">{job.sourceWebsite || "ALL"}</td>
                    <td className="px-3 py-3">
                      <div className="w-28">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{job.progress}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${Math.min(100, Math.max(5, job.progress))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-medium">{job.processedItems}</span>
                      <span className="text-muted-foreground"> / {job.totalItems}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          job.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : job.status === "FAILED"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-blue-500/10 text-blue-600"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

