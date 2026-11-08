"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Flag,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";

export type RoadmapTopic = {
  id: string;
  title: string;
  resourceUrl?: string | null;
  resourceLabel?: string | null;
  estimatedMinutes?: number | null;
  orderIndex: number;
  stageId: string;
};

export type RoadmapStage = {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
};

export function RoadmapDetail({
  roadmap,
  stages,
  topics,
  completedIds,
  isLoggedIn,
}: {
  roadmap: {
    id: string;
    title: string;
    description?: string | null;
    category: string;
    difficulty: string;
    stepCount: number;
    estimatedDuration?: string | null;
    coverTint?: string | null;
  };
  stages: RoadmapStage[];
  topics: RoadmapTopic[];
  completedIds: string[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [completed, setCompleted] = useState<string[]>(completedIds);
  const [busy, setBusy] = useState<string | null>(null);

  const grouped = useMemo(
    () =>
      stages.map((stage) => ({
        stage,
        topics: topics.filter((topic) => topic.stageId === stage.id),
      })),
    [stages, topics],
  );

  const percent = topics.length
    ? Math.round((completed.length / topics.length) * 100)
    : 0;
  const totalMinutes = topics.reduce(
    (sum, topic) => sum + (topic.estimatedMinutes ?? 0),
    0,
  );
  const remainingMinutes = topics
    .filter((topic) => !completed.includes(topic.id))
    .reduce((sum, topic) => sum + (topic.estimatedMinutes ?? 0), 0);

  async function toggle(topic: RoadmapTopic) {
    if (!isLoggedIn) {
      router.push(
        `/login?next=${encodeURIComponent(`/placements/roadmaps/${roadmap.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)}`,
      );
      return;
    }
    const isDone = completed.includes(topic.id);
    setBusy(topic.id);
    try {
      const res = await fetch("/api/v1/roadmaps/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          topicId: topic.id,
          completed: !isDone,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        push({ title: "Could not save", description: json.message, tone: "error" });
        return;
      }
      setCompleted((prev) =>
        isDone ? prev.filter((id) => id !== topic.id) : [...prev, topic.id],
      );
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const nextTopic = topics.find((topic) => !completed.includes(topic.id));

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{roadmap.category}</Badge>
              <Badge tone="neutral">{roadmap.difficulty}</Badge>
              <Badge tone="neutral">{roadmap.stepCount} steps</Badge>
            </div>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-ink-700">
              {roadmap.description}
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-[0.7rem] font-semibold text-ink-500">
              <span>Roadmap progress</span>
              <span className="tabular-nums text-ink-900">{percent}%</span>
            </div>
            <ProgressBar value={percent} />
            <p className="mt-1.5 text-[0.68rem] text-ink-500">
              {completed.length} of {topics.length} topics completed
            </p>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-ink-500">
              Estimated duration
            </dt>
            <dd className="mt-0.5 text-sm font-bold text-ink-900">
              {roadmap.estimatedDuration ?? "Self paced"}
            </dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-ink-500">
              Total learning time
            </dt>
            <dd className="mt-0.5 text-sm font-bold text-ink-900">
              {Math.round(totalMinutes / 60)} hours
            </dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-ink-500">
              Remaining
            </dt>
            <dd className="mt-0.5 text-sm font-bold text-ink-900">
              {Math.round(remainingMinutes / 60)} hours
            </dd>
          </div>
        </dl>

        {nextTopic && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-brand-600">
                Up next
              </p>
              <p className="truncate text-sm font-bold text-ink-900">
                {nextTopic.title}
              </p>
            </div>
            <Button size="sm" onClick={() => toggle(nextTopic)} loading={busy === nextTopic.id}>
              <CheckCircle2 className="size-3.5" /> Mark complete
            </Button>
          </div>
        )}
      </Card>

      {/* Visual learning path */}
      <div className="relative">
        <div
          className="absolute left-[1.4rem] top-3 hidden h-[calc(100%-1.5rem)] w-0.5 bg-line sm:block"
          aria-hidden
        />
        <div className="space-y-4">
          {grouped.map(({ stage, topics: stageTopics }, stageIndex) => {
            const stageDone = stageTopics.filter((t) =>
              completed.includes(t.id),
            ).length;
            const stageComplete =
              stageTopics.length > 0 && stageDone === stageTopics.length;
            return (
              <div key={stage.id} className="relative sm:pl-12">
                <span
                  className={cn(
                    "absolute left-0 top-1 hidden size-11 place-items-center rounded-xl text-white sm:grid",
                  )}
                  style={{
                    background: stageComplete
                      ? "#22A06B"
                      : (roadmap.coverTint ?? "#FF5A00"),
                  }}
                >
                  {stageComplete ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <Flag className="size-5" />
                  )}
                </span>
                <Card className="p-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
                    <div>
                      <h3 className="text-sm font-bold text-ink-900">
                        Stage {stageIndex + 1} · {stage.title}
                      </h3>
                      {stage.description && (
                        <p className="mt-0.5 text-xs text-ink-500">
                          {stage.description}
                        </p>
                      )}
                    </div>
                    <Badge tone={stageComplete ? "success" : "neutral"}>
                      {stageDone} / {stageTopics.length}
                    </Badge>
                  </div>
                  <div className="divide-y divide-line">
                    {stageTopics.map((topic) => {
                      const isDone = completed.includes(topic.id);
                      return (
                        <div
                          key={topic.id}
                          className={cn(
                            "flex flex-wrap items-center gap-3 px-5 py-3",
                            isDone && "bg-success-500/5",
                          )}
                        >
                          <button
                            onClick={() => toggle(topic)}
                            disabled={busy === topic.id}
                            aria-label={
                              isDone ? "Mark topic incomplete" : "Mark topic complete"
                            }
                            className={cn(
                              "grid size-6 shrink-0 place-items-center rounded-md border transition-colors disabled:opacity-50",
                              isDone
                                ? "border-success-500/25 bg-success-500/10 text-success-500"
                                : "border-line text-ink-500 hover:text-success-500",
                            )}
                          >
                            {isDone ? (
                              <CheckCircle2 className="size-4" />
                            ) : (
                              <Circle className="size-4" />
                            )}
                          </button>
                          <p
                            className={cn(
                              "min-w-0 flex-1 text-sm",
                              isDone
                                ? "text-ink-500 line-through"
                                : "font-semibold text-ink-900",
                            )}
                          >
                            {topic.title}
                          </p>
                          {topic.estimatedMinutes && (
                            <span className="inline-flex items-center gap-1 text-[0.68rem] text-ink-500">
                              <Clock className="size-3" />
                              {topic.estimatedMinutes >= 60
                                ? `${Math.round((topic.estimatedMinutes / 60) * 10) / 10} h`
                                : `${topic.estimatedMinutes} min`}
                            </span>
                          )}
                          {topic.resourceUrl && (
                            <a
                              href={topic.resourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-brand-600 hover:underline"
                            >
                              <ExternalLink className="size-3" />
                              {topic.resourceLabel ?? "Resource"}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {!isLoggedIn && (
        <p className="text-xs text-ink-500">
          <Link href="/login" className="font-bold text-brand-600 hover:underline">
            Log in
          </Link>{" "}
          to save roadmap progress across sessions.
        </p>
      )}

      <Card className="p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
          <BookOpen className="size-4 text-brand-500" /> How this roadmap works
        </h3>
        <ul className="mt-2.5 grid gap-2 text-xs text-ink-700 sm:grid-cols-2">
          <li>• Tick each topic as you finish it — progress saves instantly.</li>
          <li>• The path highlights your current stage automatically.</li>
          <li>• Estimated hours help you plan a weekly schedule.</li>
          <li>• Resume any roadmap from your student dashboard.</li>
        </ul>
      </Card>
    </div>
  );
}
