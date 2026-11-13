"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookMarked,
  CalendarClock,
  ClipboardList,
  FileStack,
  FileText,
  NotebookPen,
  RefreshCw,
  ScrollText,
  Upload,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { UpdateCard, StatCard } from "@/components/cards";
import { ResourceUploadDialog } from "@/components/vtu/ResourceUploadDialog";

type Meta = {
  branches: { id: string; code: string; name: string }[];
  semesters: { id: string; number: number; label: string }[];
  schemes: { id: string; name: string }[];
  subjects: {
    id: string;
    name: string;
    code: string;
    branchId: string | null;
    semesterId: string | null;
  }[];
};

type Update = {
  id: string;
  title: string;
  category: string;
  summary?: string | null;
  fileUrl?: string | null;
  fileSize?: string | null;
  publishedAt: Date | string;
};

type Stats = Record<string, number>;

type Resource = {
  id: string;
  title: string;
  subjectCode?: string | null;
  subjectName?: string | null;
};

const CATEGORY_CARDS = [
  {
    label: "Notes",
    href: "/vtu/notes",
    icon: NotebookPen,
    tone: "brand" as const,
    key: "NOTES",
  },
  {
    label: "Question Papers",
    href: "/vtu/question-papers",
    icon: FileText,
    tone: "info" as const,
    key: "QUESTION_PAPER",
  },
  {
    label: "Syllabus",
    href: "/vtu/syllabus",
    icon: ScrollText,
    tone: "success" as const,
    key: "SYLLABUS",
  },
];

export function VtuOverviewClient({
  updates,
  stats,
  resources,
  meta,
  isAdmin,
  isLoggedIn = false,
}: {
  updates: Update[];
  stats: Stats;
  resources: Resource[];
  meta: Meta;
  isAdmin: boolean;
  isLoggedIn?: boolean;
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const totalResources = Object.values(stats).reduce((a, b) => a + b, 0);

  async function syncVtuUpdates() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/v1/vtu/sync", { method: "POST" });
      const json = await res.json();
      setSyncMsg(json.message ?? "Sync complete");
    } catch {
      setSyncMsg("Sync failed — check console");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      {showUpload && (
        <ResourceUploadDialog
          meta={meta}
          isAdmin={isAdmin}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <div className="flex-1">
            <p className="text-xs font-bold text-brand-700">Admin Actions</p>
            <p className="text-xs text-brand-600">
              {syncMsg || "Sync official VTU announcements from vtu.ac.in or upload a resource."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={syncVtuUpdates}
              disabled={syncing}
            >
              <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync VTU Updates"}
            </Button>
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="size-3.5" /> Upload Resource
            </Button>
          </div>
        </div>
      )}

      {/* Student upload banner — visible to all students & visitors */}
      {!isAdmin && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
          <div>
            <p className="text-sm font-bold text-ink-900">Have notes, question papers or study resources?</p>
            <p className="text-xs text-ink-500">
              Share your study resources with fellow engineering students across Karnataka. Instant PDF publishing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/vtu/upload">
              <Button size="sm">
                <Upload className="size-3.5" /> Upload Resource
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900">
            <CalendarClock className="size-4 text-brand-500" /> Latest VTU
            Updates
          </h2>
          <div className="space-y-3">
            {updates.length === 0 ? (
              <Card className="p-6 text-center text-sm text-ink-500">
                No VTU updates yet.{" "}
                {isAdmin && (
                  <button
                    onClick={syncVtuUpdates}
                    className="font-bold text-brand-600 hover:underline"
                  >
                    Sync now →
                  </button>
                )}
              </Card>
            ) : (
              updates.slice(0, 4).map((update) => (
                <UpdateCard key={update.id} update={update} />
              ))
            )}
          </div>
          <Link
            href="/vtu/updates"
            className="mt-3 inline-block text-xs font-bold text-brand-600 hover:underline"
          >
            View all VTU updates →
          </Link>
        </section>

        <aside className="space-y-5">
          <Card className="p-4">
            <h2 className="text-sm font-bold text-ink-900">Resource library</h2>
            <p className="mt-1 text-xs text-ink-500">
              {totalResources.toLocaleString()} published resources across all
              branches and schemes.
            </p>
            <div className="mt-4 space-y-3.5">
              {CATEGORY_CARDS.map((card) => {
                const Icon = card.icon;
                const count = stats[card.key] ?? 0;
                const percent = totalResources
                  ? Math.round((count / totalResources) * 100)
                  : 0;
                return (
                  <Link key={card.label} href={card.href} className="group block">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-ink-900 group-hover:text-brand-600">
                            {card.label}
                          </p>
                          <p className="text-xs font-bold tabular-nums text-ink-900">
                            {count.toLocaleString()}
                          </p>
                        </div>
                        <ProgressBar
                          value={percent}
                          showLabel={false}
                          size="sm"
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Browse by module */}
          <Card className="p-4">
            <h2 className="text-sm font-bold text-ink-900">Browse by module</h2>
            <p className="mt-1 text-xs text-ink-500">
              Jump straight into module-wise notes for your subjects.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Link
                  key={i}
                  href={`/vtu/notes?module=${i + 1}`}
                  className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
                >
                  Module {i + 1}
                </Link>
              ))}
            </div>
          </Card>

          {/* Scheme quick access */}
          <Card className="p-4">
            <h2 className="text-sm font-bold text-ink-900">By Scheme</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {["2022", "2021", "2018", "2015"].map((scheme) => (
                <Link
                  key={scheme}
                  href={`/vtu/notes?scheme=${scheme}`}
                  className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
                >
                  {scheme} Scheme
                </Link>
              ))}
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/vtu/assignments">
              <StatCard
                label="Assignments"
                value={(stats.ASSIGNMENT ?? 0).toLocaleString()}
                icon={<ClipboardList className="size-5" />}
              />
            </Link>
            <StatCard
              label="Other resources"
              value={(stats.OTHER ?? 0).toLocaleString()}
              icon={<FileStack className="size-5" />}
              tone="dark"
            />
          </div>
        </aside>
      </div>

      {/* Recently added */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-ink-900">
          Recently added notes
        </h2>
        <Card className="divide-y divide-line">
          {resources.length === 0 ? (
            <div className="p-6 text-center text-sm text-ink-500">
              No resources yet.{" "}
              {isAdmin && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="font-bold text-brand-600 hover:underline"
                >
                  Upload the first one →
                </button>
              )}
            </div>
          ) : (
            resources.slice(0, 6).map((resource) => (
              <div key={resource.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500">
                  <NotebookPen className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {resource.title}
                  </p>
                  <p className="text-[0.68rem] text-ink-500">
                    {resource.subjectCode} · {resource.subjectName}
                  </p>
                </div>
                <Link
                  href="/vtu/notes"
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Open
                </Link>
              </div>
            ))
          )}
        </Card>
      </section>

      {!isAdmin && !isLoggedIn && (
        <div className="mt-4">
          <Badge tone="neutral">
            <a href="/login" className="hover:underline">Sign in</a> to upload or share resources
          </Badge>
        </div>
      )}
    </>
  );
}

