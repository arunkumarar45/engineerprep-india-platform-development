"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { Badge, Button, SegmentedControl, difficultyTone, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";

export type TrackableProblem = {
  id: string;
  title: string;
  difficulty: string;
  slug: string;
  patternName?: string | null;
};

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
  const [busy, setBusy] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (difficulty === "ALL") return problems;
    return problems.filter((p) => {
      const v = p.difficulty.toUpperCase();
      if (difficulty === "BEGINNER") return v === "EASY" || v === "BEGINNER";
      if (difficulty === "INTERMEDIATE") return v === "MEDIUM" || v === "INTERMEDIATE";
      return v === "HARD" || v === "ADVANCED";
    });
  }, [problems, difficulty]);

  async function toggle(problem: TrackableProblem) {
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
    <div>
      {showFilter && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl
            options={[
              { id: "ALL", label: "All" },
              { id: "BEGINNER", label: "Beginner" },
              { id: "INTERMEDIATE", label: "Intermediate" },
              { id: "ADVANCED", label: "Advanced" },
            ]}
            value={difficulty}
            onChange={setDifficulty}
          />
          <p className="text-[0.7rem] text-ink-500">
            {visible.length} problem{visible.length === 1 ? "" : "s"} ·{" "}
            {solved.length} solved
          </p>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ink-500">{emptyMessage}</p>
      ) : (
        <div className="divide-y divide-line">
          {visible.map((problem, index) => {
            const isSolved = solved.includes(problem.id);
            return (
              <div
                key={problem.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 px-4 py-3",
                  isSolved && "bg-success-500/5",
                )}
              >
                <span className="w-5 shrink-0 text-xs font-bold tabular-nums text-ink-500">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`${basePath}/problems/${problem.slug}`}
                    className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-600"
                  >
                    {problem.title}
                  </Link>
                  {problem.patternName && (
                    <p className="text-[0.68rem] text-ink-500">
                      {problem.patternName}
                    </p>
                  )}
                </div>
                <Badge tone={difficultyTone(problem.difficulty)}>
                  {problem.difficulty}
                </Badge>
                <Link
                  href={`${basePath}/problems/${problem.slug}`}
                  className="grid size-7 place-items-center rounded-lg border border-line text-ink-500 hover:border-brand-300 hover:text-brand-600"
                  aria-label={`Open ${problem.title}`}
                >
                  <ExternalLink className="size-3.5" />
                </Link>
                <button
                  onClick={() => toggle(problem)}
                  disabled={busy === problem.id}
                  aria-label={isSolved ? "Mark as not solved" : "Mark as solved"}
                  className={cn(
                    "grid size-7 place-items-center rounded-lg border transition-colors disabled:opacity-50",
                    isSolved
                      ? "border-success-500/25 bg-success-500/10 text-success-500"
                      : "border-line text-ink-500 hover:text-success-500",
                  )}
                >
                  {isSolved ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!isLoggedIn && (
        <p className="mt-3 px-4 text-[0.7rem] text-ink-500">
          <Link href="/login" className="font-bold text-brand-600 hover:underline">
            Log in
          </Link>{" "}
          to save your DSA progress across devices.
        </p>
      )}
    </div>
  );
}

export { Button };
