"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Code2,
  ExternalLink,
  Lightbulb,
  NotebookPen,
  Terminal,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CodeBlock,
  Tabs,
  difficultyTone,
  useToast,
} from "@/components/ui";
import { cn, jsonArray } from "@/lib/utils";

type Problem = {
  id: string;
  title: string;
  difficulty: string;
  slug: string;
  statement?: string | null;
  examples: unknown;
  constraints: unknown;
  hints: unknown;
  editorial?: string | null;
  practiceUrl?: string | null;
  solutions?: Array<{ language: string; code: string; complexity?: string | null }>;
};

const NOTES = [
  "Always dry-run the pointer movement on a 4-5 element example before coding.",
  "Prefer while(left < right) for opposite-end pointers and for loops for same-direction windows.",
  "Watch out for off-by-one errors when shrinking the window — update the answer before or after the move, consistently.",
  "When duplicates exist, skip them after recording the answer to avoid duplicate triplets.",
  "State the complexity out loud: most two-pointer solutions are O(n) time, O(1) extra space.",
];

export function PatternDetail({
  pattern,
  problems,
  solvedIds,
  isLoggedIn,
}: {
  pattern: {
    id: string;
    name: string;
    slug: string;
    summary: string | null;
    about: string | null;
    whenToUse: unknown;
    templates: unknown;
    tint: string | null;
  };
  problems: Problem[];
  solvedIds: string[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [tab, setTab] = useState("overview");
  const [lang, setLang] = useState("Java");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [solved, setSolved] = useState<string[]>(solvedIds);
  const [busy, setBusy] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const templates = useMemo(() => {
    const raw = pattern.templates;
    if (raw && typeof raw === "object" && !Array.isArray(raw))
      return raw as Record<string, string>;
    return {};
  }, [pattern.templates]);

  const whenToUse = jsonArray<string>(pattern.whenToUse);
  const openProblem = problems.find((p) => p.slug === openSlug) ?? null;
  const solvedCount = problems.filter((p) => solved.includes(p.id)).length;

  const solutions = openProblem?.solutions ?? [];
  const activeSolution =
    solutions.find((s) => s.language === lang) ?? solutions[0];

  async function markSolved(problem: Problem) {
    if (!isLoggedIn) {
      router.push(
        `/login?next=${encodeURIComponent(`/placements/dsa-patterns/${pattern.slug}`)}`,
      );
      return;
    }
    setBusy(problem.id);
    try {
      const res = await fetch("/api/v1/dsa/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, completed: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        push({ title: "Could not save", description: json.message, tone: "error" });
        return;
      }
      setSolved((prev) => (prev.includes(problem.id) ? prev : [...prev, problem.id]));
      push({ title: "Marked as solved", description: problem.title, tone: "success" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (openProblem) {
    const examples = jsonArray<{ input: string; output: string; explanation?: string }>(
      openProblem.examples,
    );
    const constraints = jsonArray<string>(openProblem.constraints);
    const hints = jsonArray<string>(openProblem.hints);
    const isSolved = solved.includes(openProblem.id);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setOpenSlug(null)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-brand-600"
        >
          <ArrowLeft className="size-3.5" /> Back to {pattern.name}
        </button>

        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-ink-900">
                  {openProblem.title}
                </h2>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge tone={difficultyTone(openProblem.difficulty)}>
                    {openProblem.difficulty}
                  </Badge>
                  {isSolved && (
                    <Badge tone="success">
                      <CheckCircle2 className="size-3" /> Solved
                    </Badge>
                  )}
                </div>
              </div>
              {openProblem.practiceUrl && (
                <a
                  href={openProblem.practiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
                >
                  <ExternalLink className="size-3.5" /> Practise externally
                </a>
              )}
            </div>

            <section className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Problem statement
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                {openProblem.statement}
              </p>
            </section>

            {examples.length > 0 && (
              <section className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                  Examples
                </h3>
                <div className="mt-2 space-y-2.5">
                  {examples.map((example, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-line bg-surface p-3.5"
                    >
                      <p className="font-mono text-xs text-ink-900">
                        <span className="font-bold">Input:</span> {example.input}
                      </p>
                      <p className="mt-1 font-mono text-xs text-ink-900">
                        <span className="font-bold">Output:</span> {example.output}
                      </p>
                      {example.explanation && (
                        <p className="mt-1.5 text-[0.7rem] text-ink-500">
                          {example.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {constraints.length > 0 && (
              <section className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                  Constraints
                </h3>
                <ul className="mt-2 space-y-1">
                  {constraints.map((constraint) => (
                    <li
                      key={constraint}
                      className="font-mono text-[0.72rem] text-ink-700"
                    >
                      • {constraint}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {openProblem.editorial && (
              <section className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                  Editorial
                </h3>
                <p className="mt-2 rounded-xl border border-brand-100 bg-brand-50/60 p-3.5 text-sm leading-relaxed text-ink-700">
                  {openProblem.editorial}
                </p>
              </section>
            )}
          </Card>

          <div className="space-y-4">
            {hints.length > 0 && (
              <Card className="p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
                  <Lightbulb className="size-4 text-warning-500" /> Hints
                </h3>
                <ol className="mt-3 space-y-2">
                  {hints.map((hint, index) => (
                    <li key={hint} className="text-xs leading-relaxed text-ink-700">
                      <span className="font-bold text-brand-600">
                        Hint {index + 1}:
                      </span>{" "}
                      {hint}
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
                  <Terminal className="size-4 text-brand-500" /> Code editor
                </h3>
                <div className="flex gap-1">
                  {["Java", "Python", "C++"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setLang(option)}
                      className={cn(
                        "rounded-md px-2 py-1 text-[0.65rem] font-bold",
                        lang === option
                          ? "bg-brand-500 text-white"
                          : "bg-navy-900/5 text-ink-500 hover:text-ink-900",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`// Write your ${lang} solution here…`}
                className="code-block mt-3 h-48 w-full resize-y"
                spellCheck={false}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() => markSolved(openProblem)}
                  loading={busy === openProblem.id}
                >
                  <CheckCircle2 className="size-4" /> Mark as Solved
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    push({
                      title: "Demo editor",
                      description:
                        "This editor stores your draft locally. Submitting to an online judge requires backend integration.",
                      tone: "info",
                    })
                  }
                >
                  <Code2 className="size-4" /> Submit
                </Button>
              </div>
            </Card>

            {solutions.length > 0 && (
              <Card className="p-5">
                <h3 className="text-sm font-bold text-ink-900">Reference solution</h3>
                <p className="mt-0.5 text-[0.7rem] text-ink-500">
                  {activeSolution?.language}
                  {activeSolution?.complexity
                    ? ` · ${activeSolution.complexity}`
                    : ""}
                </p>
                <div className="mt-3">
                  <CodeBlock
                    code={activeSolution?.code ?? "// No solution available"}
                    language={activeSolution?.language}
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Tabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "problems", label: "Problems", count: problems.length },
          { id: "notes", label: "Notes" },
          { id: "templates", label: "Code Templates" },
          { id: "practice", label: "Practice" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-ink-900">About This Pattern</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              {pattern.about}
            </p>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-bold text-ink-900">When to Use</h3>
            <ul className="mt-2.5 space-y-2">
              {whenToUse.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === "problems" && (
        <Card className="mt-4 p-0">
          <div className="border-b border-line px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Practice problems</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              {problems.length} problems · {solvedCount} solved
            </p>
          </div>
          {problems.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-500">
              No problems added for this pattern yet.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {problems.map((problem, index) => {
                const isSolved = solved.includes(problem.id);
                return (
                  <div key={problem.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-5 text-xs font-bold tabular-nums text-ink-500">
                      {index + 1}
                    </span>
                    <button
                      onClick={() => setOpenSlug(problem.slug)}
                      className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-ink-900 hover:text-brand-600"
                    >
                      {problem.title}
                    </button>
                    <Badge tone={difficultyTone(problem.difficulty)}>
                      {problem.difficulty}
                    </Badge>
                    {isSolved ? (
                      <CheckCircle2 className="size-4 shrink-0 text-success-500" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-ink-500" />
                    )}
                    <Button size="sm" variant="outline" onClick={() => setOpenSlug(problem.slug)}>
                      Open
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {tab === "notes" && (
        <Card className="mt-4 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <NotebookPen className="size-4 text-brand-500" /> Revision notes
          </h3>
          <ul className="mt-3 space-y-2.5">
            {NOTES.map((note) => (
              <li key={note} className="flex items-start gap-2 text-sm text-ink-700">
                <BookOpen className="mt-0.5 size-4 shrink-0 text-ink-500" />
                {note}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "templates" && (
        <Card className="mt-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">Code templates</h3>
            <div className="flex gap-1">
              {Object.keys(templates).map((option) => (
                <button
                  key={option}
                  onClick={() => setLang(option)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[0.7rem] font-bold",
                    lang === option
                      ? "bg-brand-500 text-white"
                      : "bg-navy-900/5 text-ink-500 hover:text-ink-900",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <CodeBlock
              code={templates[lang] ?? "// Template not available"}
              language={lang}
            />
          </div>
        </Card>
      )}

      {tab === "practice" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {problems.map((problem) => (
            <Card key={problem.id} hover className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-ink-900">{problem.title}</h4>
                <Badge tone={difficultyTone(problem.difficulty)}>
                  {problem.difficulty}
                </Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-ink-500">
                {problem.editorial}
              </p>
              <div className="mt-3.5 flex gap-2">
                <Button size="sm" onClick={() => setOpenSlug(problem.slug)}>
                  Solve
                </Button>
                {problem.practiceUrl && (
                  <a
                    href={problem.practiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
                  >
                    <ExternalLink className="size-3.5" /> Link
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-4 text-[0.7rem] text-ink-500">
        Looking for structured sheets?{" "}
        <Link
          href="/placements/dsa-sheets"
          className="font-bold text-brand-600 hover:underline"
        >
          Browse DSA sheets →
        </Link>
      </p>
    </div>
  );
}
