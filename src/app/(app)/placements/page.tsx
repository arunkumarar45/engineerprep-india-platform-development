import Link from "next/link";
import {
  Building2,
  Code2,
  Flame,
  ListChecks,
  MessagesSquare,
  Percent,
  Route,
  Sparkles,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { getDsaProgress, getRoadmaps, getDsaProblems } from "@/lib/queries";

const PREP_CARDS = [
  {
    title: "DSA Sheets",
    description: "Curated problem sheets and company lists.",
    href: "/placements/dsa-sheets",
    icon: Code2,
    tint: "#FF5A00",
  },
  {
    title: "Developer Roadmaps",
    description: "Role-wise learning paths.",
    href: "/placements/roadmaps",
    icon: Route,
    tint: "#7C3AED",
  },
  {
    title: "DSA Patterns",
    description: "20 essential coding patterns.",
    href: "/placements/dsa-patterns",
    icon: Sparkles,
    tint: "#2B6CB0",
  },
  {
    title: "Company Preparation",
    description: "Google, Amazon, Microsoft, TCS and more.",
    href: "/placements/company-preparation",
    icon: Building2,
    tint: "#22A06B",
  },
  {
    title: "Mock Tests",
    description: "Aptitude, technical and company tests.",
    href: "/placements/mock-tests",
    icon: ListChecks,
    tone: "#F5A623",
  },
  {
    title: "Interview Questions",
    description: "Technical, HR and project-based questions.",
    href: "/placements/interview-questions",
    icon: MessagesSquare,
    tint: "#E5484D",
  },
];

const SECONDARY = [
  { label: "DSA Playlists", href: "/placements/dsa-playlists", icon: Code2 },
  { label: "System Design", href: "/placements/system-design", icon: Sparkles },
  { label: "SQL Sheet", href: "/placements/sql", icon: ListChecks },
  { label: "Aptitude & Reasoning", href: "/placements/aptitude", icon: Percent },
  { label: "Technical Subjects", href: "/placements/technical-subjects", icon: Code2 },
];

export default async function PlacementsOverviewPage() {
  const user = await getSessionUser();
  const [roadmaps, problems, progress] = await Promise.all([
    getRoadmaps(),
    getDsaProblems(),
    user ? getDsaProgress(user.id) : Promise.resolve(new Map()),
  ]);

  const solved = progress.size;
  const completedRoadmaps = 0;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Placement Guides" }]}
        title="Placement Guides"
        subtitle="A complete preparation hub for placements and technical interviews."
        actions={
          <Button>
            <Trophy className="size-4" /> My Progress
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PREP_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href} className="group">
              <Card hover className="h-full p-5">
                <span
                  className="grid size-11 place-items-center rounded-xl text-white shadow-[0_10px_22px_rgba(23,33,43,0.14)]"
                  style={{ background: card.tint }}
                >
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-3.5 text-sm font-extrabold text-ink-900 group-hover:text-brand-600">
                  {card.title}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
                  {card.description}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* 30 day challenge */}
      <Card className="mt-5 overflow-hidden border-0 bg-navy-900 p-0">
        <div className="relative flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(80% 120% at 12% 20%, rgba(255,90,0,0.35), transparent 60%), radial-gradient(70% 110% at 90% 90%, rgba(255,122,26,0.22), transparent 60%)",
            }}
            aria-hidden
          />
          <div className="relative flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-500 text-white animate-pulse-ring">
              <Flame className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                30-Day Placement Challenge
              </h2>
              <p className="mt-1 max-w-xl text-sm text-white/70">
                Structured plan to improve your DSA, aptitude and technical
                skills in 30 days.
              </p>
            </div>
          </div>
          <div className="relative flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {user ? (
              <div className="min-w-52">
                <div className="mb-1.5 flex items-center justify-between text-[0.7rem] font-bold text-white/70">
                  <span>Challenge progress</span>
                  <span className="tabular-nums text-white">
                    {Math.min(100, Math.round((solved / Math.max(1, problems.length)) * 100))}%
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(100, Math.round((solved / Math.max(1, problems.length)) * 100))}
                  showLabel={false}
                />
                <p className="mt-1.5 text-[0.68rem] text-white/60">
                  {solved} of {problems.length} seeded problems solved
                </p>
              </div>
            ) : null}
            <Link
              href="/placements/challenge"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
            >
              {user ? "Continue Challenge" : "Join Challenge"}
            </Link>
          </div>
        </div>
      </Card>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink-900">Your preparation mix</h2>
          <p className="mt-1 text-xs text-ink-500">
            Balance DSA practice with aptitude, technical subjects and mock tests.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line p-3.5">
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-500">
                DSA progress
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ink-900">
                {solved}
                <span className="text-sm font-bold text-ink-500">
                  {" "}
                  / {problems.length}
                </span>
              </p>
              <ProgressBar
                value={(solved / Math.max(1, problems.length)) * 100}
                showLabel={false}
                className="mt-2"
              />
            </div>
            <div className="rounded-xl border border-line p-3.5">
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-500">
                Roadmaps
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ink-900">
                {roadmaps.length}
              </p>
              <p className="mt-2 text-[0.7rem] text-ink-500">
                {completedRoadmaps} completed · {roadmaps.length - completedRoadmaps} in progress
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {SECONDARY.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-bold text-ink-700 hover:border-brand-300 hover:text-brand-600"
                >
                  <Icon className="size-3.5" /> {item.label}
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink-900">Recommended next</h2>
          <ul className="mt-3 space-y-3">
            {[
              {
                title: "Solve Two Pointers pattern",
                detail: "12 problems · 4 completed",
                href: "/placements/dsa-patterns/two-pointers",
              },
              {
                title: "Resume Full Stack Developer Roadmap",
                detail: "Stage 2 of 4 in progress",
                href: "/placements/roadmaps/full-stack-developer-roadmap",
              },
              {
                title: "Attempt Aptitude Mock Test – Set 1",
                detail: "60 minutes · 100 marks",
                href: "/placements/mock-tests",
              },
            ].map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3 hover:border-brand-300 hover:bg-brand-50/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-ink-900">
                      {item.title}
                    </span>
                    <span className="block text-[0.68rem] text-ink-500">
                      {item.detail}
                    </span>
                  </span>
                  <Badge tone="brand">Open</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
