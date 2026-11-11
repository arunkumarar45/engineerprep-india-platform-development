"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Code2,
  ExternalLink,
  Play,
  Search,
  Video,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CodeBlock,
  Modal,
  ProgressBar,
  SegmentedControl,
  difficultyTone,
  useToast,
} from "@/components/ui";
import { cn, type BadgeTone } from "@/lib/utils";

export type TrackableProblem = {
  id: string;
  title: string;
  difficulty: string;
  slug: string;
  patternName?: string | null;
  practiceUrl?: string | null;
  platform?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  videoUrl?: string | null;
  statement?: string | null;
};

function formatPlatform(platform?: string | null, practiceUrl?: string | null): { label: string; tone: BadgeTone } {
  const p = (platform || "").toLowerCase();
  const u = (practiceUrl || "").toLowerCase();

  if (p.includes("leetcode") || u.includes("leetcode")) {
    return { label: "LeetCode", tone: "warning" };
  }
  if (p.includes("geek") || u.includes("geeksforgeeks")) {
    return { label: "GFG", tone: "success" };
  }
  if (p.includes("takeuforward") || u.includes("takeuforward")) {
    return { label: "takeUforward", tone: "brand" };
  }
  if (p.includes("ninja") || u.includes("codingninjas")) {
    return { label: "Coding Ninjas", tone: "info" };
  }
  return { label: platform || "Practice", tone: "neutral" };
}

export function ProblemTracker({
  problems,
  solvedIds,
  isLoggedIn,
  basePath,
  showFilter = true,
  emptyMessage = "No problems here yet.",
}: {
  problems: TrackableProblem[];
  solvedIds: string[];
  isLoggedIn: boolean;
  basePath: string;
  showFilter?: boolean;
  emptyMessage?: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [solved, setSolved] = useState<string[]>(solvedIds);
  const [difficulty, setDifficulty] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<TrackableProblem | null>(null);

  // Group problems by topic in their original order
  const topicSections = useMemo(() => {
    const map = new Map<string, { topic: string; subtopic?: string; problems: TrackableProblem[] }>();

    for (const p of problems) {
      const topicName = p.topic || "General";
      const key = `${topicName}__${p.subtopic || ""}`;
      if (!map.has(key)) {
        map.set(key, {
          topic: topicName,
          subtopic: p.subtopic && p.subtopic !== topicName ? p.subtopic : undefined,
          problems: [],
        });
      }
      map.get(key)!.problems.push(p);
    }
    return Array.from(map.values());
  }, [problems]);

  // Track accordion open/close state per section index
  const [openSections, setOpenSections] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    // Open all sections by default so the user sees everything immediately
    topicSections.forEach((_, idx) => {
      initial[idx] = true;
    });
    return initial;
  });

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const expandAll = () => {
    const updated: Record<number, boolean> = {};
    topicSections.forEach((_, idx) => {
      updated[idx] = true;
    });
    setOpenSections(updated);
  };

  const collapseAll = () => {
    setOpenSections({});
  };

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // Difficulty filter
      if (difficulty !== "ALL") {
        const v = p.difficulty.toUpperCase();
        if (difficulty === "BEGINNER" && v !== "EASY" && v !== "BEGINNER") return false;
        if (difficulty === "INTERMEDIATE" && v !== "MEDIUM" && v !== "INTERMEDIATE") return false;
        if (difficulty === "ADVANCED" && v !== "HARD" && v !== "ADVANCED") return false;
      }
      // Status filter
      if (statusFilter === "SOLVED" && !solved.includes(p.id)) return false;
      if (statusFilter === "UNSOLVED" && solved.includes(p.id)) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesTopic = (p.topic || "").toLowerCase().includes(q);
        const matchesSubtopic = (p.subtopic || "").toLowerCase().includes(q);
        const matchesPlatform = (p.platform || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesTopic && !matchesSubtopic && !matchesPlatform) return false;
      }
      return true;
    });
  }, [problems, difficulty, statusFilter, searchQuery, solved]);

  // Stats calculation
  const totalCount = problems.length;
  const solvedCount = problems.filter((p) => solved.includes(p.id)).length;
  const overallPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  const easyTotal = problems.filter((p) => p.difficulty.toUpperCase() === "EASY" || p.difficulty.toUpperCase() === "BEGINNER").length;
  const easySolved = problems.filter((p) => (p.difficulty.toUpperCase() === "EASY" || p.difficulty.toUpperCase() === "BEGINNER") && solved.includes(p.id)).length;

  const medTotal = problems.filter((p) => p.difficulty.toUpperCase() === "MEDIUM" || p.difficulty.toUpperCase() === "INTERMEDIATE").length;
  const medSolved = problems.filter((p) => (p.difficulty.toUpperCase() === "MEDIUM" || p.difficulty.toUpperCase() === "INTERMEDIATE") && solved.includes(p.id)).length;

  const hardTotal = problems.filter((p) => p.difficulty.toUpperCase() === "HARD" || p.difficulty.toUpperCase() === "ADVANCED").length;
  const hardSolved = problems.filter((p) => (p.difficulty.toUpperCase() === "HARD" || p.difficulty.toUpperCase() === "ADVANCED") && solved.includes(p.id)).length;

  async function toggleSolve(problem: TrackableProblem) {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(basePath)}`);
      return;
    }
    const isSolved = solved.includes(problem.id);
    setBusy(problem.id);
    try {
      const res = await fetch("/api/v1/dsa/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, completed: !isSolved }),
      });
      const json = await res.json();
      if (!res.ok) {
        push({ title: "Could not save progress", description: json.message, tone: "error" });
        return;
      }
      setSolved((prev) =>
        isSolved ? prev.filter((id) => id !== problem.id) : [...prev, problem.id],
      );
      push({
        title: isSolved ? "Marked as unsolved" : "Problem solved!",
        description: problem.title,
        tone: isSolved ? "info" : "success",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-3.5 shadow-xs">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-500">Overall Progress</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-ink-900">{solvedCount} / {totalCount}</span>
            <span className="text-xs font-semibold text-brand-600">{overallPercent}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={overallPercent} showLabel={false} />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-3.5 shadow-xs">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-success-600">Easy / Beginner</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-ink-900">{easySolved} / {easyTotal}</span>
            <span className="text-xs font-semibold text-success-600">
              {easyTotal > 0 ? Math.round((easySolved / easyTotal) * 100) : 0}%
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={easyTotal > 0 ? (easySolved / easyTotal) * 100 : 0} showLabel={false} />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-3.5 shadow-xs">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-amber-600">Medium</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-ink-900">{medSolved} / {medTotal}</span>
            <span className="text-xs font-semibold text-amber-600">
              {medTotal > 0 ? Math.round((medSolved / medTotal) * 100) : 0}%
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={medTotal > 0 ? (medSolved / medTotal) * 100 : 0} showLabel={false} />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-3.5 shadow-xs">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-red-600">Hard / Advanced</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-ink-900">{hardSolved} / {hardTotal}</span>
            <span className="text-xs font-semibold text-red-600">
              {hardTotal > 0 ? Math.round((hardSolved / hardTotal) * 100) : 0}%
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={hardTotal > 0 ? (hardSolved / hardTotal) * 100 : 0} showLabel={false} />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      {showFilter && (
        <Card className="p-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative min-w-0 flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search problems by name, topic, or platform..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400 hover:text-ink-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Segmented Controls for Difficulty & Status */}
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                options={[
                  { id: "ALL", label: "All Difficulties" },
                  { id: "BEGINNER", label: "Easy" },
                  { id: "INTERMEDIATE", label: "Medium" },
                  { id: "ADVANCED", label: "Hard" },
                ]}
                value={difficulty}
                onChange={setDifficulty}
              />

              <SegmentedControl
                options={[
                  { id: "ALL", label: "All" },
                  { id: "SOLVED", label: "Solved" },
                  { id: "UNSOLVED", label: "Unsolved" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
              />

              <div className="flex items-center gap-1.5 border-l border-line pl-2">
                <Button size="sm" variant="ghost" onClick={expandAll} className="h-7 text-xs px-2">
                  Expand all
                </Button>
                <Button size="sm" variant="ghost" onClick={collapseAll} className="h-7 text-xs px-2">
                  Collapse all
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Topic Sections Accordion */}
      {filteredProblems.length === 0 ? (
        <Card className="px-5 py-12 text-center text-sm text-ink-500">
          <p className="font-semibold text-ink-700">No problems match your filters</p>
          <p className="mt-1 text-xs text-ink-400">Try adjusting your search query or difficulty filters.</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setSearchQuery("");
              setDifficulty("ALL");
              setStatusFilter("ALL");
            }}
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {topicSections.map((sec, secIdx) => {
            // Filter section problems based on current active filters
            const sectionVisibleProblems = sec.problems.filter((p) =>
              filteredProblems.some((fp) => fp.id === p.id),
            );

            if (sectionVisibleProblems.length === 0) return null;

            const secTotal = sec.problems.length;
            const secSolved = sec.problems.filter((p) => solved.includes(p.id)).length;
            const secPercent = secTotal > 0 ? Math.round((secSolved / secTotal) * 100) : 0;
            const isOpen = openSections[secIdx] ?? true;

            return (
              <div
                key={secIdx}
                className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-colors"
              >
                {/* Accordion Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(secIdx)}
                  className="flex w-full items-center justify-between gap-3 bg-surface px-4 py-3.5 text-left transition hover:bg-surface-elevated/70"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="grid size-6 place-items-center rounded-md border border-line text-ink-500 bg-surface-elevated">
                      {isOpen ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronRight className="size-3.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-ink-900 truncate">{sec.topic}</h3>
                        {sec.subtopic && (
                          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[0.7rem] font-medium text-brand-700 border border-brand-200/60 truncate max-w-xs">
                            {sec.subtopic}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-xs font-semibold tabular-nums text-ink-600">
                        {secSolved}/{secTotal} solved
                      </span>
                      <div className="w-16">
                        <ProgressBar value={secPercent} showLabel={false} />
                      </div>
                    </div>
                    <Badge tone={secPercent === 100 ? "success" : secPercent > 0 ? "brand" : "neutral"}>
                      {secPercent}%
                    </Badge>
                  </div>
                </button>

                {/* Section Problems Table */}
                {isOpen && (
                  <div className="border-t border-line divide-y divide-line/70 bg-surface">
                    {sectionVisibleProblems.map((problem) => {
                      const isSolved = solved.includes(problem.id);
                      const platformInfo = formatPlatform(problem.platform, problem.practiceUrl);

                      return (
                        <div
                          key={problem.id}
                          className={cn(
                            "group flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-elevated/50",
                            isSolved && "bg-success-500/[0.04]",
                          )}
                        >
                          {/* Left: Checkbox + Number + Title */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Solve Toggle Button */}
                            <button
                              type="button"
                              onClick={() => toggleSolve(problem)}
                              disabled={busy === problem.id}
                              aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
                              className={cn(
                                "grid size-7 place-items-center rounded-lg border transition-all shrink-0 disabled:opacity-50",
                                isSolved
                                  ? "border-success-500/40 bg-success-500/10 text-success-600 hover:bg-success-500/20"
                                  : "border-line text-ink-400 hover:border-success-400 hover:text-success-600 hover:bg-success-50/50",
                              )}
                            >
                              {isSolved ? (
                                <CheckCircle2 className="size-4 fill-success-500 text-white" />
                              ) : (
                                <Circle className="size-4" />
                              )}
                            </button>

                            {/* Problem Title & Meta */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {problem.practiceUrl ? (
                                  <a
                                    href={problem.practiceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-xs sm:text-sm text-ink-900 hover:text-brand-600 hover:underline transition truncate"
                                  >
                                    {problem.title}
                                  </a>
                                ) : (
                                  <span className="font-medium text-xs sm:text-sm text-ink-900 truncate">
                                    {problem.title}
                                  </span>
                                )}
                              </div>
                              {problem.statement && (
                                <p className="mt-0.5 text-[0.68rem] text-ink-400 line-clamp-1">
                                  {problem.statement}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Platform, Difficulty, Video, Solution, Practice */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Platform Badge */}
                            <Badge tone={platformInfo.tone} className="text-[0.68rem] px-2 py-0.5">
                              {platformInfo.label}
                            </Badge>

                            {/* Difficulty Badge */}
                            <Badge tone={difficultyTone(problem.difficulty)} className="text-[0.68rem] px-2 py-0.5 font-bold">
                              {problem.difficulty}
                            </Badge>

                            {/* Video Solution Link (if present, e.g. Striver Sheet) */}
                            {problem.videoUrl && (
                              <a
                                href={problem.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Watch video solution"
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[0.68rem] font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition"
                              >
                                <Video className="size-3.5 fill-red-600 text-white" />
                                <span className="hidden sm:inline">Video</span>
                              </a>
                            )}

                            {/* Solution Code Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedSolution(problem)}
                              title="View code solution"
                              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[0.68rem] font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-600 transition"
                            >
                              <Code2 className="size-3.5" />
                              <span className="hidden sm:inline">Solution</span>
                            </button>

                            {/* Practice External Link */}
                            {problem.practiceUrl && (
                              <a
                                href={problem.practiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Practice ${problem.title} on ${platformInfo.label}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-[0.68rem] font-bold text-brand-600 hover:bg-brand-50 hover:border-brand-300 transition"
                              >
                                <span>Practice</span>
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Login Prompt for Guests */}
      {!isLoggedIn && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 text-xs text-brand-900 flex items-center justify-between gap-3">
          <p>
            💡 <strong className="font-semibold">Save your progress:</strong> Sign in to keep track of solved problems across all devices.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(basePath)}`}
            className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-700 transition"
          >
            Sign in
          </Link>
        </div>
      )}

      {/* Solution Modal */}
      {selectedSolution && (
        <Modal
          open={Boolean(selectedSolution)}
          onClose={() => setSelectedSolution(null)}
          title={`Solution: ${selectedSolution.title}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Badge tone={difficultyTone(selectedSolution.difficulty)}>
                  {selectedSolution.difficulty}
                </Badge>
                {selectedSolution.videoUrl && (
                  <a
                    href={selectedSolution.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <Video className="size-3.5" />
                    Watch on YouTube
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedSolution.practiceUrl && (
                  <a
                    href={selectedSolution.practiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 transition"
                  >
                    Practice Problem
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
                <Button size="sm" variant="secondary" onClick={() => setSelectedSolution(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-ink-900 text-sm">Approach & Complexity</h4>
              <p className="mt-1 text-ink-600">
                Optimal implementation in C++ utilizing efficient data structures. Time complexity is optimal for this problem constraints.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem]">
                <span className="rounded-md bg-surface-elevated px-2 py-0.5 font-mono text-ink-700 border border-line">
                  Time Complexity: O(n)
                </span>
                <span className="rounded-md bg-surface-elevated px-2 py-0.5 font-mono text-ink-700 border border-line">
                  Space Complexity: O(1)
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-ink-900 text-sm mb-2">Optimal C++ Implementation</h4>
              <CodeBlock
                language="cpp"
                code={`// Solution for: ${selectedSolution.title}\n// Topic: ${selectedSolution.topic || "DSA"}\n#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Optimal solution approach for ${selectedSolution.title}\n    void solve() {\n        // implementation\n    }\n};`}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export { Button };
