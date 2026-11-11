"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Play,
  RefreshCw,
  Route,
  Settings2,
  Trash2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import playlistsData from "@/data/playlists.json";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  FileUpload,
  ProgressBar,
  Tabs,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";

/* --------------------------- shared bits ---------------------------- */

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-ink-900">{title}</h2>
        <p className="mt-0.5 text-xs text-ink-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function DataTable({
  head,
  rows,
}: {
  head: string[];
  rows: React.ReactNode[][];
}) {
  if (rows.length === 0)
    return (
      <p className="px-5 py-10 text-center text-sm text-ink-500">
        No records found.
      </p>
    );
  return (
    <div className="epi-scroll-x">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-[0.68rem] font-bold uppercase tracking-wider text-ink-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------- content management ----------------------- */

export function ContentManagement({
  content,
}: {
  content: {
    resources: Array<{ id: string; title: string; status: string; resourceType: string; downloadCount: number }>;
    sheets: Array<{ id: string; title: string; totalProblems: number }>;
    roadmaps: Array<{ id: string; title: string; stepCount: number }>;
    tests: Array<{ id: string; title: string; subject: string }>;
    opportunities: Array<{ id: string; title: string; status: string }>;
    updates: Array<{ id: string; title: string; category: string }>;
  };
}) {
  const [tab, setTab] = useState("resources");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(
    null,
  );
  const router = useRouter();
  const { push } = useToast();

  async function remove() {
    if (!pendingDelete) return;
    const endpoints: Record<string, string> = {
      resources: `/api/v1/resources/${pendingDelete.id}`,
      sheets: `/api/v1/dsa/sheets/${pendingDelete.id}`,
      roadmaps: `/api/v1/roadmaps/${pendingDelete.id}`,
      tests: `/api/v1/tests/${pendingDelete.id}`,
      opportunities: `/api/v1/jobs/${pendingDelete.id}`,
      updates: `/api/v1/vtu/updates/${pendingDelete.id}`,
    };
    const res = await fetch(endpoints[tab], { method: "DELETE" });
    const json = await res.json();
    push({
      title: res.ok ? "Deleted" : "Delete failed",
      description: json.message,
      tone: res.ok ? "success" : "error",
    });
    setPendingDelete(null);
    router.refresh();
  }

  const tables: Record<string, { head: string[]; rows: React.ReactNode[][] }> = {
    resources: {
      head: ["Title", "Type", "Status", "Downloads"],
      rows: content.resources.map((r) => [
        <span key="t" className="font-semibold text-ink-900">
          {r.title}
        </span>,
        <Badge key="ty" tone="neutral">
          {r.resourceType.replace("_", " ")}
        </Badge>,
        <Badge key="s" tone={r.status === "PUBLISHED" ? "success" : "warning"}>
          {r.status}
        </Badge>,
        <span key="d" className="tabular-nums text-ink-700">
          {r.downloadCount}
        </span>,
      ]),
    },
    sheets: {
      head: ["Sheet", "Problems"],
      rows: content.sheets.map((s) => [
        <span key="t" className="font-semibold text-ink-900">
          {s.title}
        </span>,
        <span key="p" className="tabular-nums text-ink-700">
          {s.totalProblems}
        </span>,
      ]),
    },
    roadmaps: {
      head: ["Roadmap", "Steps"],
      rows: content.roadmaps.map((r) => [
        <span key="t" className="font-semibold text-ink-900">
          {r.title}
        </span>,
        <span key="s" className="tabular-nums text-ink-700">
          {r.stepCount}
        </span>,
      ]),
    },
    tests: {
      head: ["Test", "Subject"],
      rows: content.tests.map((t) => [
        <span key="t" className="font-semibold text-ink-900">
          {t.title}
        </span>,
        <Badge key="s" tone="neutral">
          {t.subject}
        </Badge>,
      ]),
    },
    opportunities: {
      head: ["Opportunity", "Status"],
      rows: content.opportunities.map((o) => [
        <span key="t" className="font-semibold text-ink-900">
          {o.title}
        </span>,
        <Badge key="s" tone={o.status === "OPEN" ? "success" : "warning"}>
          {o.status}
        </Badge>,
      ]),
    },
    updates: {
      head: ["Update", "Category"],
      rows: content.updates.map((u) => [
        <span key="t" className="font-semibold text-ink-900">
          {u.title}
        </span>,
        <Badge key="c" tone="info">
          {u.category}
        </Badge>,
      ]),
    },
  };

  const active = tables[tab] ?? tables.resources;

  return (
    <div>
      <SectionHeader
        title="Content Management"
        description="Create, edit, publish and delete platform content."
        action={
          <Button size="sm" onClick={() => router.push("/admin/bulk-import")}>
            <Upload className="size-3.5" /> Bulk import
          </Button>
        }
      />
      <Tabs
        tabs={[
          { id: "resources", label: "Resources", count: content.resources.length },
          { id: "sheets", label: "DSA Sheets", count: content.sheets.length },
          { id: "roadmaps", label: "Roadmaps", count: content.roadmaps.length },
          { id: "tests", label: "Mock Tests", count: content.tests.length },
          { id: "opportunities", label: "Opportunities", count: content.opportunities.length },
          { id: "updates", label: "VTU Updates", count: content.updates.length },
        ]}
        active={tab}
        onChange={setTab}
      />
      <Card className="mt-4 p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-xs text-ink-500">
            Showing the most recent records. Destructive actions ask for
            confirmation.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const first = active.rows[0];
              void first;
              push({
                title: "Demo mode",
                description:
                  "Editing opens the same form used to create content. Connect the persistence layer to commit changes.",
                tone: "info",
              });
            }}
          >
            Edit selected
          </Button>
        </div>
        <DataTable head={active.head} rows={active.rows} />
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        title="Delete this record?"
        message={
          <>
            <span className="font-semibold">{pendingDelete?.label}</span> will be
            permanently removed. This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
      />
    </div>
  );
}

/* ---------------------------- bulk import --------------------------- */

const IMPORT_TABS = [
  { id: "DSA Problems", label: "DSA Problems" },
  { id: "Roadmaps", label: "Roadmaps" },
  { id: "Playlists", label: "Playlists" },
  { id: "Jobs/Internships", label: "Jobs/Internships" },
  { id: "Aptitude", label: "Aptitude" },
  { id: "Technical", label: "Technical" },
  { id: "SQL", label: "SQL" },
];

const STEPS = [
  { label: "Download template", icon: Download },
  { label: "Fill your data", icon: FileSpreadsheet },
  { label: "Upload file", icon: Upload },
  { label: "Validate & preview", icon: CheckCircle2 },
  { label: "Import to database", icon: Database },
];

export function BulkImport({
  history,
}: {
  history: Array<{
    id: string;
    category: string;
    fileName: string;
    status: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    createdAt: Date | string;
  }>;
}) {
  const { push } = useToast();
  const router = useRouter();
  const [category, setCategory] = useState("DSA Problems");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    importId: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    preview: Array<Record<string, unknown>>;
    errors: Array<{ row: number; field: string; message: string }>;
    demoMode: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function validate() {
    if (!file) {
      push({ title: "Select a file first", tone: "warning" });
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      const res = await fetch("/api/v1/admin/bulk-import", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (res.ok) {
        setResult(json.data);
        push({
          title: "File validated",
          description: `${json.data.validRows} valid rows, ${json.data.invalidRows} invalid`,
          tone: "success",
        });
      } else {
        push({ title: "Validation failed", description: json.message, tone: "error" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!result?.importId) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("importId", result.importId);
      form.append("action", "confirm");
      const res = await fetch("/api/v1/admin/bulk-import", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      push({
        title: res.ok ? "Import completed" : "Import failed",
        description: json.message,
        tone: res.ok ? "success" : "error",
      });
      if (res.ok) {
        setResult(null);
        setFile(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Bulk Content Import"
        description="Upload and import DSA, questions, roadmaps, jobs and more using templates."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-5">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const done = result ? index < 4 : index < 2;
          return (
            <div
              key={step.label}
              className={cn(
                "rounded-xl border p-3",
                done ? "border-success-500/25 bg-success-500/8" : "border-line bg-white",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-lg text-xs font-bold",
                    done
                      ? "bg-success-500/15 text-success-500"
                      : "bg-navy-900/5 text-ink-500",
                  )}
                >
                  {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-3.5" />}
                </span>
                <p className="text-[0.7rem] font-bold text-ink-900">{step.label}</p>
              </div>
              <p className="mt-1 text-[0.62rem] text-ink-500">Step {index + 1}</p>
            </div>
          );
        })}
      </div>

      <Tabs tabs={IMPORT_TABS} active={category} onChange={setCategory} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <FileUpload
            onFile={setFile}
            accept=".csv,.xlsx,.json,.pdf,.png,.jpg,.jpeg,.docx"
            maxSizeMb={50}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={validate} loading={busy}>
              <CheckCircle2 className="size-4" /> Validate &amp; Preview
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                push({
                  title: "Template downloaded (demo)",
                  description: `${category} template generated with required columns.`,
                  tone: "info",
                })
              }
            >
              <Download className="size-4" /> Download template
            </Button>
            <Button variant="ghost" onClick={() => { setResult(null); setFile(null); }}>
              <RefreshCw className="size-4" /> Reset
            </Button>
          </div>

          {result && (
            <Card className="mt-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-ink-900">Validation result</h3>
                <Badge tone={result.invalidRows === 0 ? "success" : "warning"}>
                  {result.totalRows} rows parsed
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-success-500/8 px-2 py-2.5">
                  <p className="text-lg font-extrabold text-success-500">
                    {result.validRows}
                  </p>
                  <p className="text-[0.62rem] uppercase tracking-wider text-ink-500">
                    Valid
                  </p>
                </div>
                <div className="rounded-lg bg-error-500/8 px-2 py-2.5">
                  <p className="text-lg font-extrabold text-error-500">
                    {result.invalidRows}
                  </p>
                  <p className="text-[0.62rem] uppercase tracking-wider text-ink-500">
                    Invalid
                  </p>
                </div>
                <div className="rounded-lg bg-navy-900/5 px-2 py-2.5">
                  <p className="text-lg font-extrabold text-ink-900">
                    {result.preview.length}
                  </p>
                  <p className="text-[0.62rem] uppercase tracking-wider text-ink-500">
                    Previewed
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-error-500">
                    <XCircle className="size-3.5" /> Row errors
                  </h4>
                  <ul className="mt-2 space-y-1">
                    {result.errors.map((error, index) => (
                      <li
                        key={index}
                        className="rounded-lg bg-error-500/8 px-3 py-1.5 text-[0.7rem] text-ink-700"
                      >
                        Row {error.row} · <span className="font-bold">{error.field}</span>{" "}
                        — {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.preview.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-ink-900">Preview</h4>
                  <div className="mt-2 space-y-1.5">
                    {result.preview.map((row, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-line px-3 py-2 font-mono text-[0.65rem] text-ink-700"
                      >
                        {Object.entries(row)
                          .map(([key, value]) => `${key}: ${String(value)}`)
                          .join(" · ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <p className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-warning-500">
                  <AlertTriangle className="size-3.5" /> Demo mode — import is
                  validated and previewed, not committed to the live database.
                </p>
                <Button onClick={confirmImport} loading={busy} disabled={result.validRows === 0}>
                  <Database className="size-4" /> Import to database
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-ink-900">Required columns</h3>
            <p className="mt-1 text-xs text-ink-500">
              Your file must include these headers for the{" "}
              <span className="font-bold text-ink-900">{category}</span> category.
            </p>
            <ul className="mt-3 space-y-1.5">
              {(CATEGORY_COLUMNS[category] ?? []).map((column) => (
                <li
                  key={column}
                  className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-[0.7rem] font-semibold text-ink-700"
                >
                  <FileText className="size-3 text-brand-500" /> {column}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold text-ink-900">Upload history</h3>
            {history.length === 0 ? (
              <p className="mt-3 text-xs text-ink-500">No imports yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-line">
                {history.map((job) => (
                  <div key={job.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[0.75rem] font-semibold text-ink-900">
                        {job.fileName}
                      </p>
                      <Badge
                        tone={
                          job.status === "COMPLETED"
                            ? "success"
                            : job.status === "FAILED"
                              ? "error"
                              : "warning"
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[0.65rem] text-ink-500">
                      {job.category} · {job.totalRows} rows · {job.validRows} valid ·{" "}
                      {job.invalidRows} invalid
                    </p>
                    <ProgressBar
                      value={job.totalRows ? (job.validRows / job.totalRows) * 100 : 0}
                      showLabel={false}
                      size="sm"
                      className="mt-1.5"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_COLUMNS: Record<string, string[]> = {
  "DSA Problems": ["title", "difficulty", "pattern", "statement", "practiceUrl"],
  Roadmaps: ["title", "category", "stage", "topic", "resourceUrl"],
  Playlists: ["title", "educator", "url", "problems"],
  "Jobs/Internships": ["title", "company", "type", "location", "stipend", "batch"],
  Aptitude: ["question", "optionA", "correct", "topic"],
  Technical: ["question", "answer", "topic"],
  SQL: ["question", "answer", "difficulty"],
};

/* ---------------------------- automations --------------------------- */

export function Automations({
  rules,
  executions,
}: {
  rules: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string;
    cronExpression: string | null;
    queueName: string;
    status: string;
    lastExecutedAt: Date | string | null;
    nextExecutionAt: Date | string | null;
  }>;
  executions: Array<{
    id: string;
    status: string;
    triggerSource: string;
    attempts: number;
    message: string | null;
    createdAt: Date | string;
    ruleName: string | null;
    queueName: string | null;
  }>;
}) {
  const { push } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, name: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/v1/admin/automations/run/${id}`, {
        method: "POST",
      });
      const json = await res.json();
      push({
        title: res.ok ? "Automation executed" : "Execution failed",
        description: `${name} · ${json.data?.status ?? json.message}`,
        tone: res.ok ? "success" : "error",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function toggleStatus(id: string, status: "ACTIVE" | "DISABLED") {
    setBusy(id);
    try {
      const res = await fetch(`/api/v1/admin/automations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      push({
        title: res.ok ? "Rule updated" : "Update failed",
        description: json.message,
        tone: res.ok ? "success" : "error",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const stats = useMemo(() => {
    const success = executions.filter((e) => e.status === "SUCCESS").length;
    const failed = executions.filter((e) => e.status === "FAILED").length;
    return {
      active: rules.filter((r) => r.status === "ACTIVE").length,
      disabled: rules.filter((r) => r.status === "DISABLED").length,
      success,
      failed,
    };
  }, [rules, executions]);

  return (
    <div>
      <SectionHeader
        title="Automation Control Center"
        description="Schedules, executions and manual triggers for every background job."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const res = await fetch("/api/v1/admin/sweep", { method: "POST" });
              const json = await res.json();
              push({
                title: res.ok ? "Cleanup complete" : "Cleanup failed",
                description: json.message,
                tone: res.ok ? "success" : "error",
              });
              router.refresh();
            }}
          >
            <RefreshCw className="size-3.5" /> Run cleanup sweep
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Active rules", value: stats.active, tone: "text-success-500" },
          { label: "Disabled", value: stats.disabled, tone: "text-ink-500" },
          { label: "Successful runs", value: stats.success, tone: "text-success-500" },
          { label: "Failed runs", value: stats.failed, tone: "text-error-500" },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-500">
              {item.label}
            </p>
            <p className={cn("mt-1 text-2xl font-extrabold", item.tone)}>
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-0">
          <div className="border-b border-line px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Automation rules</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              Admins can trigger or toggle a rule — never submit arbitrary code.
            </p>
          </div>
          <div className="divide-y divide-line">
            {rules.map((rule) => (
              <div key={rule.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-ink-900">{rule.name}</p>
                      <Badge tone={rule.status === "ACTIVE" ? "success" : "neutral"}>
                        {rule.status}
                      </Badge>
                      <Badge tone="info">{rule.category}</Badge>
                    </div>
                    <p className="mt-1 text-[0.7rem] text-ink-500">
                      {rule.description}
                    </p>
                    <p className="mt-1 font-mono text-[0.65rem] text-ink-500">
                      {rule.cronExpression ?? "manual"} · {rule.queueName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busy === rule.id}
                      onClick={() => run(rule.id, rule.name)}
                    >
                      <Play className="size-3.5" /> Run
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        toggleStatus(
                          rule.id,
                          rule.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                        )
                      }
                    >
                      <Settings2 className="size-3.5" />
                      {rule.status === "ACTIVE" ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.65rem] text-ink-500">
                  <span>
                    Last run:{" "}
                    {rule.lastExecutedAt
                      ? new Date(rule.lastExecutedAt).toLocaleString("en-IN")
                      : "never"}
                  </span>
                  <span>
                    Next run:{" "}
                    {rule.nextExecutionAt
                      ? new Date(rule.nextExecutionAt).toLocaleString("en-IN")
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b border-line px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Execution history</h3>
          </div>
          {executions.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-ink-500">
              No executions recorded.
            </p>
          ) : (
            <div className="max-h-[32rem] divide-y divide-line overflow-y-auto scroll-thin">
              {executions.map((execution) => (
                <div key={execution.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[0.75rem] font-semibold text-ink-900">
                      {execution.ruleName ?? "Unknown rule"}
                    </p>
                    <Badge
                      tone={
                        execution.status === "SUCCESS"
                          ? "success"
                          : execution.status === "FAILED"
                            ? "error"
                            : execution.status === "SKIPPED"
                              ? "neutral"
                              : "warning"
                      }
                    >
                      {execution.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[0.65rem] text-ink-500">
                    {execution.triggerSource} · attempt {execution.attempts} ·{" "}
                    {new Date(execution.createdAt).toLocaleString("en-IN")}
                  </p>
                  {execution.message && (
                    <p className="mt-1 text-[0.68rem] text-ink-700">
                      {execution.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ----------------------------- students ----------------------------- */

export function Students({
  students,
}: {
  students: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    collegeName: string | null;
    graduationYear: number | null;
    isActive: boolean;
    createdAt: Date | string;
  }>;
}) {
  const { push } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleActive(id: string, isActive: boolean) {
    setBusy(id);
    try {
      const res = await fetch(`/api/v1/admin/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const json = await res.json();
      push({
        title: res.ok ? "Student updated" : "Update failed",
        description: json.message,
        tone: res.ok ? "success" : "error",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Students"
        description="Manage student accounts and access."
        action={
          <Badge tone="brand">
            <Users className="size-3" /> {students.length} accounts
          </Badge>
        }
      />
      <Card className="p-0">
        <DataTable
          head={["Name", "Email", "College", "Batch", "Role", "Status", ""]}
          rows={students.map((student) => [
            <span key="n" className="font-semibold text-ink-900">
              {student.fullName}
            </span>,
            <span key="e" className="text-ink-500">
              {student.email}
            </span>,
            <span key="c" className="text-ink-700">
              {student.collegeName ?? "—"}
            </span>,
            <span key="b" className="tabular-nums text-ink-700">
              {student.graduationYear ?? "—"}
            </span>,
            <Badge key="r" tone={student.role === "ADMIN" ? "dark" : "neutral"}>
              {student.role}
            </Badge>,
            <Badge key="s" tone={student.isActive ? "success" : "error"}>
              {student.isActive ? "Active" : "Disabled"}
            </Badge>,
            <Button
              key="a"
              size="sm"
              variant="outline"
              loading={busy === student.id}
              onClick={() => toggleActive(student.id, student.isActive)}
            >
              {student.isActive ? "Disable" : "Enable"}
            </Button>,
          ])}
        />
      </Card>
      <p className="mt-3 text-[0.7rem] text-ink-500">
        Frontend role checks are for demonstration only — production
        authorization must be enforced on the server.
      </p>
    </div>
  );
}

/* --------------------------- simple sections ------------------------ */

const DSA_SHEET_ADMIN_LIST = [
  {
    title: "Striver's A2Z DSA Sheet",
    instructor: "Raj Vikramaditya (Striver)",
    slug: "striver-a2z-dsa-sheet",
    thumbnailUrl: "/thumbnails/dsa-sheets/striver-a2z-dsa-sheet.jpg",
    source: "YouTube / takeUforward",
    problems: 455,
  },
  {
    title: "Love Babbar DSA Sheet",
    instructor: "Love Babbar",
    slug: "love-babbar-dsa-sheet",
    thumbnailUrl: "/thumbnails/dsa-sheets/love-babbar-dsa-sheet.jpg",
    source: "YouTube / CodeHelp by Babbar",
    problems: 430,
  },
  {
    title: "Shraddha Khapra Sheet",
    instructor: "Shradha Khapra (Apna College)",
    slug: "shraddha-khapra-dsa-sheet",
    thumbnailUrl: "/thumbnails/dsa-sheets/shraddha-khapra-dsa-sheet.jpg",
    source: "YouTube / Apna College",
    problems: 403,
  },
  {
    title: "Rohit Negi (Coder Army) Sheet",
    instructor: "Rohit Negi",
    slug: "rohit-negi-dsa-sheet",
    thumbnailUrl: "/thumbnails/dsa-sheets/rohit-negi-dsa-sheet.jpg",
    source: "YouTube / Coder Army",
    problems: 726,
  },
  {
    title: "Arsh Goyal DSA Sheet",
    instructor: "Arsh Goyal",
    slug: "arsh-goyal-dsa-sheet",
    thumbnailUrl: "/thumbnails/dsa-sheets/arsh-goyal-dsa-sheet.jpg",
    source: "YouTube / Arsh Goyal",
    problems: 287,
  },
  {
    title: "NeetCode DSA Sheet",
    instructor: "NeetCode (Navdeep Singh)",
    slug: "neetcode-dsa-sheet",
    thumbnailUrl: "/thumbnails/dsa-sheets/neetcode-dsa-sheet.jpg",
    source: "YouTube / NeetCode",
    problems: 150,
  },
  {
    title: "20 Essential DSA Patterns",
    instructor: "MAANG Engineers",
    slug: "20-essential-dsa-patterns",
    thumbnailUrl: "/thumbnails/dsa-sheets/20-essential-dsa-patterns.jpg",
    source: "MAANG Algorithmic Patterns",
    problems: 180,
  },
];

export function SimpleSection({
  kind,
}: {
  kind: "dsa" | "roadmaps" | "playlists" | "patterns" | "mock-tests" | "jobs" | "updates" | "resources";
}) {
  const router = useRouter();
  const { push } = useToast();
  const config = {
    dsa: {
      title: "DSA Sheets & Thumbnails",
      description: "Manage curated problem sheets, problem counts and authentic thumbnail bindings.",
      icon: Layers,
      items: [
        "Striver's A2Z DSA Sheet — 455 problems",
        "Love Babbar DSA Sheet — 430 problems",
        "Shraddha Khapra Sheet — 403 problems",
        "Rohit Negi DSA Sheet — 726 problems",
        "Arsh Goyal DSA Sheet — 287 problems",
        "NeetCode DSA Sheet — 150 problems",
        "20 Essential DSA Patterns — 180 problems",
      ],
      href: "/placements/dsa-sheets",
    },
    roadmaps: {
      title: "Developer Roadmaps",
      description: "Edit roadmap stages, topics and estimated durations.",
      icon: Route,
      items: [
        "Full Stack Developer Roadmap — 16 steps",
        "DevOps Engineer Roadmap — 13 steps",
        "Data Analyst Roadmap — 11 steps",
        "Java Backend Roadmap — 15 steps",
        "AI/ML Engineer Roadmap — 13 steps",
      ],
      href: "/placements/roadmaps",
    },
    playlists: {
      title: "DSA & System Design Playlists",
      description: "Curated 20 verified course playlists with individual high-definition thumbnails.",
      icon: ListChecks,
      items: [
        "Striver A2Z Playlist — 290 videos",
        "Love Babbar Playlist — 141 videos",
        "NeetCode Roadmap — 250 videos",
      ],
      href: "/placements/dsa-playlists",
    },
    patterns: {
      title: "DSA Patterns",
      description: "Maintain the 20 essential coding patterns.",
      icon: Layers,
      items: [
        "Two Pointers",
        "Sliding Window",
        "Binary Search",
        "Fast & Slow Pointers",
        "Trees & DFS",
        "Graphs & BFS",
        "Dynamic Programming",
      ],
      href: "/placements/dsa-patterns",
    },
    "mock-tests": {
      title: "Mock Tests",
      description: "Create tests, questions and scoring rules.",
      icon: ListChecks,
      items: [
        "Aptitude Mock Test – Set 1 — 10 questions",
        "Technical Mock Test – Computer Networks — 6 questions",
        "Technical Mock Test – Operating Systems — 6 questions",
      ],
      href: "/placements/mock-tests",
    },
    jobs: {
      title: "Opportunities",
      description: "Publish, edit and expire job and internship listings.",
      icon: Users,
      items: [
        "Software Engineer Intern — Microsoft",
        "SDE – New Grad — Amazon",
        "TCS Digital – Fresher",
        "Digital Specialist Engineer — Infosys",
      ],
      href: "/jobs",
    },
    updates: {
      title: "VTU Updates",
      description: "Publish circulars, time tables and notifications.",
      icon: FileText,
      items: [
        "Semester End Examination Time Table",
        "Revaluation Results Registration",
        "Academic Calendar – Even Semester",
      ],
      href: "/vtu/updates",
    },
    resources: {
      title: "VTU Resources",
      description: "Upload notes, question papers, syllabus and lab manuals.",
      icon: FileText,
      items: [
        "Notes — 240 published",
        "Question papers — 120 published",
        "Syllabus — 120 published",
        "Lab manuals — 120 published",
      ],
      href: "/vtu/resources",
    },
  }[kind];

  const Icon = config.icon;

  if (kind === "dsa") {
    return (
      <div>
        <SectionHeader
          title={config.title}
          description={config.description}
          action={
            <div className="flex gap-2">
              <Link
                href={config.href}
                className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
              >
                <Eye className="size-3.5 mr-1" /> View public page
              </Link>
            </div>
          }
        />
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-surface-elevated border-b border-line flex items-center justify-between">
            <span className="text-xs font-bold text-ink-900">
              Curated Sheets ({DSA_SHEET_ADMIN_LIST.length})
            </span>
            <span className="text-[0.7rem] text-ink-500">
              All thumbnails verified & stored locally
            </span>
          </div>
          <div className="divide-y divide-line">
            {DSA_SHEET_ADMIN_LIST.map((sheet) => (
              <div key={sheet.slug} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
                <div className="relative aspect-[16/9] w-28 shrink-0 overflow-hidden rounded-lg bg-ink-950 border border-line">
                  <img
                    src={sheet.thumbnailUrl}
                    alt={sheet.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-ink-900 truncate">{sheet.title}</h3>
                    <Badge tone="success" className="text-[0.65rem]">ACTIVE</Badge>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Curated by <span className="font-semibold text-ink-700">{sheet.instructor}</span> · {sheet.problems} problems
                  </p>
                  <p className="text-[0.7rem] text-ink-400 mt-1 truncate">
                    Asset: <code className="text-brand-600">{sheet.thumbnailUrl}</code> ({sheet.source})
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/placements/dsa-sheets/${sheet.slug}`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-600"
                  >
                    <Eye className="size-3.5" /> View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (kind === "playlists") {
    return (
      <div>
        <SectionHeader
          title={config.title}
          description={config.description}
          action={
            <div className="flex gap-2">
              <Link
                href={config.href}
                className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
              >
                <Eye className="size-3.5 mr-1" /> View public page
              </Link>
            </div>
          }
        />
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-surface-elevated border-b border-line flex items-center justify-between">
            <span className="text-xs font-bold text-ink-900">
              Curated Video Playlists ({playlistsData.length})
            </span>
            <span className="text-[0.7rem] text-ink-500">
              Individual 16:9 authentic thumbnails bound to each course
            </span>
          </div>
          <div className="divide-y divide-line max-h-[700px] overflow-y-auto">
            {playlistsData.map((playlist: any) => (
              <div key={playlist.slug} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-3.5">
                <div className="relative aspect-[16/9] w-28 shrink-0 overflow-hidden rounded-lg bg-ink-950 border border-line">
                  <img
                    src={playlist.thumbnailUrl || `/thumbnails/dsa-playlists/${playlist.slug}.jpg`}
                    alt={playlist.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-ink-900 truncate">{playlist.title}</h3>
                    <Badge tone="brand" className="uppercase text-[0.6rem]">{playlist.category}</Badge>
                    <Badge tone="success" className="text-[0.65rem]">ACTIVE</Badge>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    by <span className="font-semibold text-ink-700">{playlist.instructor || playlist.channel}</span> · {playlist.totalVideos} videos · {playlist.totalDuration}
                  </p>
                  <p className="text-[0.7rem] text-ink-400 mt-1 truncate">
                    Asset: <code className="text-brand-600">/thumbnails/dsa-playlists/{playlist.slug}.jpg</code>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={playlist.playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600 px-2.5 text-xs font-bold text-white hover:bg-red-700"
                  >
                    <ExternalLink className="size-3.5" /> YouTube
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title={config.title}
        description={config.description}
        action={
          <div className="flex gap-2">
            <Link
              href={config.href}
              className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
            >
              View public page
            </Link>
            <Button size="sm" onClick={() => router.push("/admin/bulk-import")}>
              <Upload className="size-3.5" /> Import
            </Button>
          </div>
        }
      />
      <Card className="p-0">
        <div className="divide-y divide-line">
          {config.items.map((item) => (
            <div key={item} className="flex items-center gap-3 px-5 py-3.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500">
                <Icon className="size-4" />
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
                {item}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  push({
                    title: "Demo mode",
                    description:
                      "Editing is available once the persistence layer is connected.",
                    tone: "info",
                  })
                }
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-error-500"
                onClick={() =>
                  push({
                    title: "Delete requires confirmation",
                    description: "A confirmation dialog protects destructive actions.",
                    tone: "warning",
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export { SectionHeader, DataTable };
