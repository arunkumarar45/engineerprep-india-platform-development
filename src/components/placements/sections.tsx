"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Circle,
  Code2,
  Database,
  Flame,
  Layers,
  Lightbulb,
  MessageSquare,
  PlayCircle,
  Server,
  Sparkles,
  Table2,
  Trophy,
  PlayCircle as YoutubeIcon,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar, Tabs } from "@/components/ui";
import { cn } from "@/lib/utils";

/* --------------------------- DSA playlists --------------------------- */

const PLAYLISTS = [
  {
    title: "Striver A2Z DSA Playlist",
    educator: "take U forward",
    problems: 290,
    hours: 62,
    tint: "#FF5A00",
  },
  {
    title: "Love Babbar DSA Playlist",
    educator: "Love Babbar",
    problems: 450,
    hours: 95,
    tint: "#2B6CB0",
  },
  {
    title: "NeetCode Roadmap Playlist",
    educator: "NeetCode",
    problems: 250,
    hours: 48,
    tint: "#0EA5E9",
  },
  {
    title: "Kunal Kushwaha DSA Bootcamp",
    educator: "Kunal Kushwaha",
    problems: 180,
    hours: 40,
    tint: "#22A06B",
  },
  {
    title: "Fraz DSA Playlist",
    educator: "Mohammad Fraz",
    problems: 320,
    hours: 70,
    tint: "#7C3AED",
  },
  {
    title: "CodeHelp DSA Playlist",
    educator: "CodeHelp by Babbar",
    problems: 260,
    hours: 55,
    tint: "#F5A623",
  },
];

export function PlaylistsSection() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {PLAYLISTS.map((playlist) => (
        <Card key={playlist.title} hover className="flex h-full flex-col p-5">
          <span
            className="grid size-11 place-items-center rounded-xl text-white"
            style={{ background: playlist.tint }}
          >
            <YoutubeIcon className="size-5" />
          </span>
          <h3 className="mt-3.5 text-sm font-bold text-ink-900">
            {playlist.title}
          </h3>
          <p className="mt-1 text-xs text-ink-500">by {playlist.educator}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-[0.7rem]">
            <div className="rounded-lg bg-surface px-2.5 py-2">
              <dt className="text-ink-500">Problems</dt>
              <dd className="font-bold text-ink-900">{playlist.problems}</dd>
            </div>
            <div className="rounded-lg bg-surface px-2.5 py-2">
              <dt className="text-ink-500">Duration</dt>
              <dd className="font-bold text-ink-900">{playlist.hours} hrs</dd>
            </div>
          </dl>
          <Button variant="outline" className="mt-4 w-full" size="sm">
            <PlayCircle className="size-3.5" /> Open Playlist
          </Button>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------- System design ---------------------------- */

const SYSTEM_DESIGN = [
  {
    title: "High Level Design",
    items: [
      "Scalability & load balancing",
      "Caching strategies (Redis, CDN)",
      "Database sharding & replication",
      "CAP theorem & consistency models",
      "Message queues & event streaming",
      "Microservices vs monolith",
    ],
    icon: Layers,
    tint: "#FF5A00",
  },
  {
    title: "Low Level Design",
    items: [
      "SOLID principles",
      "Design patterns (Factory, Observer, Strategy)",
      "UML & class diagrams",
      "Database schema modelling",
      "API contract design",
      "Concurrency primitives",
    ],
    icon: Server,
    tint: "#2B6CB0",
  },
  {
    title: "Case studies",
    items: [
      "Design a URL shortener",
      "Design WhatsApp / chat system",
      "Design a news feed",
      "Design a ride-hailing service",
      "Design a payment gateway",
      "Design a video streaming platform",
    ],
    icon: Brain,
    tint: "#22A06B",
  },
];

export function SystemDesignSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {SYSTEM_DESIGN.map((group) => {
        const Icon = group.icon;
        return (
          <Card key={group.title} className="h-full p-5">
            <span
              className="grid size-11 place-items-center rounded-xl text-white"
              style={{ background: group.tint }}
            >
              <Icon className="size-5" />
            </span>
            <h3 className="mt-3.5 text-sm font-bold text-ink-900">
              {group.title}
            </h3>
            <ul className="mt-3 space-y-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs text-ink-700"
                >
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------------ SQL sheet ---------------------------- */

const SQL_QUESTIONS = [
  { q: "Find the second highest salary from an employees table", level: "Easy" },
  { q: "Write a query to fetch duplicate emails from a users table", level: "Easy" },
  { q: "Delete duplicate rows keeping the lowest id", level: "Medium" },
  { q: "Fetch employees who joined in the last 30 days", level: "Easy" },
  { q: "Rank students by marks within each department", level: "Medium" },
  { q: "Calculate a 7-day moving average of daily orders", level: "Hard" },
  { q: "Convert rows to columns using conditional aggregation", level: "Medium" },
  { q: "Find records present in table A but not in table B", level: "Easy" },
];

export function SqlSection() {
  const [done, setDone] = useState<string[]>([]);
  return (
    <Card className="p-0">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-bold text-ink-900">SQL practice sheet</h2>
        <p className="mt-0.5 text-xs text-ink-500">
          {done.length} of {SQL_QUESTIONS.length} solved — progress is saved in
          this browser session.
        </p>
      </div>
      <div className="divide-y divide-line">
        {SQL_QUESTIONS.map((item, index) => {
          const isDone = done.includes(item.q);
          return (
            <button
              key={item.q}
              onClick={() =>
                setDone((prev) =>
                  prev.includes(item.q)
                    ? prev.filter((x) => x !== item.q)
                    : [...prev, item.q],
                )
              }
              className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-brand-50/50"
            >
              <span className="w-5 text-xs font-bold tabular-nums text-ink-500">
                {index + 1}
              </span>
              {isDone ? (
                <CheckCircle2 className="size-4 shrink-0 text-success-500" />
              ) : (
                <Circle className="size-4 shrink-0 text-ink-500" />
              )}
              <span
                className={cn(
                  "min-w-0 flex-1 text-sm",
                  isDone
                    ? "text-ink-500 line-through"
                    : "font-semibold text-ink-900",
                )}
              >
                {item.q}
              </span>
              <Badge
                tone={
                  item.level === "Easy"
                    ? "success"
                    : item.level === "Medium"
                      ? "warning"
                      : "error"
                }
              >
                {item.level}
              </Badge>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ------------------------------ Aptitude ----------------------------- */

const APTITUDE_TOPICS = [
  { title: "Speed, Time & Distance", problems: 45, icon: Flame, tint: "#FF5A00" },
  { title: "Percentages & Profit/Loss", problems: 60, icon: Table2, tint: "#22A06B" },
  { title: "Time & Work", problems: 38, icon: Layers, tint: "#2B6CB0" },
  { title: "Number System & LCM/HCF", problems: 52, icon: Database, tint: "#7C3AED" },
  { title: "Logical Reasoning", problems: 70, icon: Brain, tint: "#F5A623" },
  { title: "Data Interpretation", problems: 30, icon: Server, tint: "#0EA5E9" },
];

export function AptitudeSection() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {APTITUDE_TOPICS.map((topic) => {
          const Icon = topic.icon;
          return (
            <Card key={topic.title} hover className="p-5">
              <span
                className="grid size-11 place-items-center rounded-xl text-white"
                style={{ background: topic.tint }}
              >
                <Icon className="size-5" />
              </span>
              <h3 className="mt-3.5 text-sm font-bold text-ink-900">
                {topic.title}
              </h3>
              <p className="mt-1 text-xs text-ink-500">
                {topic.problems} practice questions with solutions
              </p>
              <Link
                href="/placements/mock-tests"
                className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-brand-50 px-4 text-xs font-bold text-brand-600 hover:bg-brand-100"
              >
                Practise now
              </Link>
            </Card>
          );
        })}
      </div>
      <Card className="mt-4 p-5">
        <h2 className="text-sm font-bold text-ink-900">
          Full-length aptitude tests
        </h2>
        <p className="mt-1 text-xs text-ink-500">
          Timed mock tests with instant scoring and topic-wise analysis.
        </p>
        <Link
          href="/placements/mock-tests"
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
        >
          <Trophy className="size-4" /> Go to mock tests
        </Link>
      </Card>
    </>
  );
}

/* ------------------------- Technical subjects ------------------------ */

const TECHNICAL_SUBJECTS = [
  {
    title: "Operating Systems",
    topics: [
      "Processes & scheduling",
      "Deadlock",
      "Memory management & paging",
      "File systems",
      "Concurrency & semaphores",
    ],
    icon: Server,
    tint: "#FF5A00",
  },
  {
    title: "Database Management Systems",
    topics: [
      "Normalisation",
      "Transactions & ACID",
      "Indexing & query plans",
      "Joins & subqueries",
      "NoSQL basics",
    ],
    icon: Database,
    tint: "#2B6CB0",
  },
  {
    title: "Computer Networks",
    topics: [
      "OSI & TCP/IP",
      "Routing protocols",
      "TCP vs UDP",
      "DNS & HTTP/HTTPS",
      "Network security",
    ],
    icon: Layers,
    tint: "#22A06B",
  },
  {
    title: "Object Oriented Programming",
    topics: [
      "Encapsulation & inheritance",
      "Polymorphism",
      "Abstraction & interfaces",
      "SOLID principles",
      "Design patterns",
    ],
    icon: Code2,
    tint: "#7C3AED",
  },
];

export function TechnicalSubjectsSection() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {TECHNICAL_SUBJECTS.map((subject) => {
        const Icon = subject.icon;
        return (
          <Card key={subject.title} hover className="h-full p-5">
            <div className="flex items-start gap-3">
              <span
                className="grid size-11 shrink-0 place-items-center rounded-xl text-white"
                style={{ background: subject.tint }}
              >
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink-900">
                  {subject.title}
                </h3>
                <p className="mt-0.5 text-xs text-ink-500">
                  {subject.topics.length} core topics
                </p>
              </div>
            </div>
            <ul className="mt-3.5 space-y-2">
              {subject.topics.map((topic) => (
                <li
                  key={topic}
                  className="flex items-start gap-2 text-xs text-ink-700"
                >
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning-500" />
                  {topic}
                </li>
              ))}
            </ul>
            <Link
              href="/placements/interview-questions"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-brand-50 px-4 text-xs font-bold text-brand-600 hover:bg-brand-100"
            >
              Interview questions
            </Link>
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------ Company preparation ------------------------ */

const COMPANIES = [
  {
    name: "Google",
    logoText: "GO",
    tint: "#4285F4",
    rounds: "OA · 2 technical · Googleyness",
    topics: ["DSA", "System design", "Probability"],
  },
  {
    name: "Amazon",
    logoText: "AZ",
    tint: "#FF9900",
    rounds: "OA · 3 loop · Bar raiser",
    topics: ["DSA", "Leadership principles", "OOPS"],
  },
  {
    name: "Microsoft",
    logoText: "MS",
    tint: "#00A4EF",
    rounds: "OA · 2 technical · HR",
    topics: ["DSA", "C++ / C#", "System design"],
  },
  {
    name: "TCS",
    logoText: "TC",
    tint: "#1F3A93",
    rounds: "NQT · Technical · HR",
    topics: ["Aptitude", "Programming", "Communication"],
  },
  {
    name: "Infosys",
    logoText: "IN",
    tint: "#007CC3",
    rounds: "Online test · Interview",
    topics: ["Aptitude", "DBMS", "Puzzles"],
  },
  {
    name: "Wipro",
    logoText: "WI",
    tint: "#341E6B",
    rounds: "Written test · Technical + HR",
    topics: ["Aptitude", "Essay writing", "Coding"],
  },
];

export function CompanyPreparationSection() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {COMPANIES.map((company) => (
        <Card key={company.name} hover className="h-full p-5">
          <div className="flex items-center gap-3">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
              style={{ background: company.tint }}
            >
              {company.logoText}
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink-900">{company.name}</h3>
              <p className="text-[0.68rem] text-ink-500">{company.rounds}</p>
            </div>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {company.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-md bg-navy-900/5 px-2 py-0.5 text-[0.68rem] font-semibold text-ink-700"
              >
                {topic}
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Link
              href="/placements/dsa-sheets"
              className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white hover:bg-brand-600"
            >
              Prepare
            </Link>
            <Link
              href="/jobs"
              className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-line text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
            >
              Open roles
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------ Interview questions ------------------------ */

const INTERVIEW_GROUPS: Array<{
  id: string;
  label: string;
  icon: typeof Code2;
  items: Array<{ q: string; tag: string }>;
}> = [
  {
    id: "technical",
    label: "Technical",
    icon: Code2,
    items: [
      { q: "Explain the difference between a process and a thread.", tag: "OS" },
      { q: "What is database normalisation and why is it needed?", tag: "DBMS" },
      { q: "How does HTTPS establish a secure connection?", tag: "Networks" },
      { q: "Explain time and space complexity with an example.", tag: "DSA" },
      { q: "What are ACID properties?", tag: "DBMS" },
      { q: "How does a hash map handle collisions?", tag: "DSA" },
    ],
  },
  {
    id: "hr",
    label: "HR",
    icon: MessageSquare,
    items: [
      { q: "Tell me about yourself.", tag: "Intro" },
      { q: "Why do you want to work for our company?", tag: "Motivation" },
      { q: "What are your strengths and weaknesses?", tag: "Self aware" },
      { q: "Where do you see yourself in five years?", tag: "Goals" },
      { q: "Describe a time you worked in a team.", tag: "Behavioural" },
    ],
  },
  {
    id: "projects",
    label: "Project based",
    icon: BookOpen,
    items: [
      { q: "Walk me through your final year project.", tag: "Deep dive" },
      { q: "What was the hardest technical decision you made?", tag: "Design" },
      { q: "How did you test and deploy your project?", tag: "Process" },
      { q: "What would you improve if you rebuilt it today?", tag: "Reflection" },
    ],
  },
];

export function InterviewQuestionsSection() {
  const [tab, setTab] = useState("technical");
  const group =
    INTERVIEW_GROUPS.find((g) => g.id === tab) ?? INTERVIEW_GROUPS[0];

  return (
    <div>
      <Tabs
        tabs={INTERVIEW_GROUPS.map((g) => ({
          id: g.id,
          label: g.label,
          count: g.items.length,
        }))}
        active={tab}
        onChange={setTab}
      />
      <Card className="mt-4 divide-y divide-line">
        {group.items.map((item) => {
          const Icon = group.icon;
          return (
            <div key={item.q} className="flex items-start gap-3 px-5 py-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{item.q}</p>
                <p className="mt-1 text-[0.68rem] text-ink-500">{item.tag}</p>
              </div>
              <Button variant="ghost" size="sm">
                <Sparkles className="size-3.5" /> Sample answer
              </Button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ---------------------------- 30-day challenge ----------------------- */

const CHALLENGE = [
  {
    week: "Week 1",
    focus: "Arrays, strings & two pointers",
    tasks: [
      "Complete the Two Pointers pattern (12 problems)",
      "Solve 15 array problems from Striver A2Z",
      "Attempt one aptitude mock test",
      "Revise time & space complexity",
    ],
  },
  {
    week: "Week 2",
    focus: "Binary search, sliding window & hashing",
    tasks: [
      "Complete the Sliding Window pattern",
      "Solve 20 binary search problems",
      "Learn SQL joins and window functions",
      "Read two system design case studies",
    ],
  },
  {
    week: "Week 3",
    focus: "Trees, graphs & recursion",
    tasks: [
      "Complete Trees & DFS pattern",
      "Complete Graphs & BFS pattern",
      "Solve 15 graph problems",
      "Practise 10 recursion problems",
    ],
  },
  {
    week: "Week 4",
    focus: "DP, revision & mock interviews",
    tasks: [
      "Complete the Dynamic Programming pattern",
      "Solve 20 DP problems",
      "Attempt two full-length mock tests",
      "Review your resume and projects",
    ],
  },
];

export function ChallengeSection() {
  const storageKey = "epi.challenge.progress";
  const [done, setDone] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    } catch {
      return [];
    }
  });

  const allTasks = useMemo(
    () =>
      CHALLENGE.flatMap((week) =>
        week.tasks.map((task) => `${week.week}: ${task}`),
      ),
    [],
  );
  const percent = Math.round((done.length / allTasks.length) * 100);

  function toggle(task: string) {
    setDone((prev) => {
      const next = prev.includes(task)
        ? prev.filter((t) => t !== task)
        : [...prev, task];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-0 bg-navy-900 p-0">
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(70% 120% at 10% 20%, rgba(255,90,0,0.4), transparent 60%)",
            }}
            aria-hidden
          />
          <div className="relative flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-500 text-white animate-pulse-ring">
              <Flame className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                30-Day Placement Challenge
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Structured plan to improve your DSA, aptitude and technical
                skills.
              </p>
            </div>
          </div>
          <div className="relative min-w-56">
            <div className="mb-1.5 flex items-center justify-between text-[0.7rem] font-bold text-white/70">
              <span>Overall progress</span>
              <span className="tabular-nums text-white">{percent}%</span>
            </div>
            <ProgressBar value={percent} showLabel={false} />
            <p className="mt-1.5 text-[0.68rem] text-white/60">
              {done.length} of {allTasks.length} tasks completed · saved locally
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {CHALLENGE.map((week) => (
          <Card key={week.week} className="h-full p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900">{week.week}</h3>
              <Badge tone="brand">{week.focus}</Badge>
            </div>
            <ul className="mt-3.5 space-y-2.5">
              {week.tasks.map((task) => {
                const key = `${week.week}: ${task}`;
                const isDone = done.includes(key);
                return (
                  <li key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-brand-50/60"
                    >
                      {isDone ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-500" />
                      ) : (
                        <Circle className="mt-0.5 size-4 shrink-0 text-ink-500" />
                      )}
                      <span
                        className={cn(
                          "text-xs leading-relaxed",
                          isDone
                            ? "text-ink-500 line-through"
                            : "font-semibold text-ink-900",
                        )}
                      >
                        {task}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
