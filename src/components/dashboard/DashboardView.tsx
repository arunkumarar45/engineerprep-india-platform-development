"use client";

import Link from "next/link";
import {
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  Code2,
  Flame,
  ListChecks,
  Percent,
  Route,
  Trophy,
} from "lucide-react";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { StatCard } from "@/components/cards";
import { cn, relativeTime } from "@/lib/utils";

export type DashboardData = {
  dsaSolved: number;
  dsaTotal: number;
  testsCompleted: number;
  avgScore: number;
  applications: number;
  applicationsInProgress: number;
  savedJobs: number;
  streak: { currentStreak: number; longestStreak: number; dailyGoal: number } | null;
  continueLearning: Array<{
    title: string;
    detail: string;
    progress: number;
    href: string;
    icon: "code" | "route" | "percent" | "tests";
  }>;
  alerts: Array<{
    id: string;
    title: string;
    body: string | null;
    linkUrl: string | null;
    createdAt: Date | string;
    type: string;
  }>;
  activity: Array<{
    id: string;
    title: string;
    detail: string | null;
    occurredAt: Date | string;
    activityType: string;
    points: number;
  }>;
};

const ALERT_ICONS: Record<string, typeof Bell> = {
  VTU_UPDATE: CalendarClock,
  DEADLINE_REMINDER: Clock,
  MOCK_TEST_REMINDER: ListChecks,
  APPLICATION_UPDATE: Briefcase,
  WEEKLY_REPORT: Trophy,
  SYSTEM: Bell,
};

const CONTINUE_ICONS = {
  code: Code2,
  route: Route,
  percent: Percent,
  tests: ListChecks,
};

export function DashboardView({
  firstName,
  data,
}: {
  firstName: string;
  data: DashboardData;
}) {
  const dsaPercent = data.dsaTotal
    ? Math.round((data.dsaSolved / data.dsaTotal) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <Card className="overflow-hidden border-0 bg-navy-900 p-0">
        <div className="relative flex flex-wrap items-center justify-between gap-4 p-6">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(70% 120% at 10% 20%, rgba(255,90,0,0.38), transparent 60%), radial-gradient(60% 110% at 95% 80%, rgba(255,122,26,0.22), transparent 60%)",
            }}
            aria-hidden
          />
          <div className="relative">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Welcome back, {firstName}!
            </h1>
            <p className="mt-1.5 text-sm text-white/70">
              Track your preparation and opportunities at a glance.
            </p>
          </div>
          <div className="relative flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-xl bg-brand-500 text-white">
              <Flame className="size-6" />
            </span>
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-white/60">
                Current streak
              </p>
              <p className="text-xl font-extrabold text-white">
                {data.streak?.currentStreak ?? 0} days
              </p>
              <p className="text-[0.68rem] text-white/60">
                Longest {data.streak?.longestStreak ?? 0} · goal{" "}
                {data.streak?.dailyGoal ?? 3}/day
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-500">
              <Code2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-500">
                DSA Progress
              </p>
              <p className="text-lg font-extrabold leading-tight text-ink-900">
                {data.dsaSolved}
                <span className="text-xs font-bold text-ink-500">
                  {" "}
                  / {data.dsaTotal} problems
                </span>
              </p>
            </div>
          </div>
          <ProgressBar value={dsaPercent} className="mt-3" />
          <p className="mt-1.5 text-[0.68rem] text-ink-500">
            {dsaPercent}% of the seeded problem set solved
          </p>
        </Card>

        <StatCard
          label="Mock Tests"
          value={data.testsCompleted}
          hint={`Average score ${data.avgScore}%`}
          icon={<ListChecks className="size-5" />}
          tone="info"
        />
        <StatCard
          label="Applications"
          value={data.applications}
          hint={`${data.applicationsInProgress} in progress`}
          icon={<Briefcase className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Saved Jobs"
          value={data.savedJobs}
          hint="Bookmarked opportunities"
          icon={<Percent className="size-5" />}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* Continue learning */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink-900">Continue Learning</h2>
            <Link
              href="/my-progress"
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              View all progress →
            </Link>
          </div>
          <div className="space-y-3">
            {data.continueLearning.map((item) => {
              const Icon = CONTINUE_ICONS[item.icon] ?? Code2;
              return (
                <Card key={item.title} hover className="p-4">
                  <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-500">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink-900">
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-[0.7rem] text-ink-500">
                          {item.detail}
                        </p>
                        <ProgressBar
                          value={item.progress}
                          className="mt-2.5"
                          size="sm"
                        />
                      </div>
                    </div>
                    <Link
                      href={item.href}
                      className="inline-flex h-8 shrink-0 items-center rounded-lg bg-brand-500 px-3 text-xs font-bold text-white hover:bg-brand-600"
                    >
                      Continue
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Upcoming & alerts */}
        <section>
          <h2 className="mb-3 text-sm font-bold text-ink-900">
            Upcoming &amp; Alerts
          </h2>
          <Card className="divide-y divide-line">
            {data.alerts.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-ink-500">
                No alerts right now.
              </p>
            )}
            {data.alerts.map((alert) => {
              const Icon = ALERT_ICONS[alert.type] ?? Bell;
              return (
                <Link
                  key={alert.id}
                  href={alert.linkUrl ?? "/dashboard"}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-brand-50/50"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8rem] font-semibold text-ink-900">
                      {alert.title}
                    </p>
                    {alert.body && (
                      <p className="mt-0.5 line-clamp-2 text-[0.7rem] text-ink-500">
                        {alert.body}
                      </p>
                    )}
                    <p className="mt-1 text-[0.65rem] text-ink-500">
                      {relativeTime(alert.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </Card>
        </section>
      </div>

      {/* Learning activity */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-ink-900">
          Learning activity
        </h2>
        <Card className="p-0">
          {data.activity.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-ink-500">
              No activity recorded yet. Solve a problem to get started.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {data.activity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
                      item.activityType === "DSA_SOLVED"
                        ? "bg-success-500/10 text-success-500"
                        : item.activityType === "TEST_ATTEMPT"
                          ? "bg-warning-500/12 text-[#a56a00]"
                          : "bg-brand-50 text-brand-500",
                    )}
                  >
                    {item.activityType === "DSA_SOLVED" ? (
                      <CheckCircle2 className="size-4" />
                    ) : item.activityType === "TEST_ATTEMPT" ? (
                      <ListChecks className="size-4" />
                    ) : item.activityType === "ROADMAP_TOPIC" ? (
                      <Route className="size-4" />
                    ) : item.activityType === "JOB_APPLIED" ? (
                      <Briefcase className="size-4" />
                    ) : (
                      <Code2 className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8rem] font-semibold text-ink-900">
                      {item.title}
                    </p>
                    {item.detail && (
                      <p className="truncate text-[0.68rem] text-ink-500">
                        {item.detail}
                      </p>
                    )}
                  </div>
                  <Badge tone="brand">+{item.points} pts</Badge>
                  <span className="hidden text-[0.65rem] text-ink-500 sm:block">
                    {relativeTime(item.occurredAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
