import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Code2,
  Database,
  FileText,
  ListChecks,
  Radar,
  Route,
  Upload,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { StatCard } from "@/components/cards";
import { getAdminStats, getAutomationRules } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";

export default async function AdminOverviewPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [stats, rules] = await Promise.all([
    getAdminStats(),
    getAutomationRules(),
  ]);

  const activeRules = rules.filter((r) => r.status === "ACTIVE").length;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Admin Console" }]}
        title="Admin Overview"
        subtitle="Platform statistics, content health and automation status."
        actions={
          <Link href="/admin/bulk-import">
            <Button>
              <Upload className="size-4" /> Bulk Content Import
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={stats.students}
          icon={<Users className="size-5" />}
          hint="registered accounts"
        />
        <StatCard
          label="Resources"
          value={stats.resources.toLocaleString()}
          icon={<FileText className="size-5" />}
          tone="info"
          hint="notes, papers, syllabus"
        />
        <StatCard
          label="DSA Problems"
          value={stats.problems}
          icon={<Code2 className="size-5" />}
          tone="success"
          hint="across 12 patterns"
        />
        <StatCard
          label="Opportunities"
          value={stats.opportunities}
          icon={<Briefcase className="size-5" />}
          hint="jobs & internships"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Content health</h2>
            <Link
              href="/admin/content"
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              Manage content →
            </Link>
          </div>
          <div className="mt-4 space-y-3.5">
            {[
              { label: "Roadmaps published", value: stats.roadmaps, total: 8, icon: Route },
              { label: "Mock tests live", value: stats.tests, total: 3, icon: ListChecks },
              {
                label: "VTU updates",
                value: stats.vtuUpdates,
                total: 12,
                icon: FileText,
              },
              {
                label: "Active automations",
                value: activeRules,
                total: rules.length,
                icon: Radar,
              },
            ].map((item) => {
              const Icon = item.icon;
              const percent = item.total
                ? Math.round((item.value / item.total) * 100)
                : 0;
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-900">
                      <Icon className="size-3.5 text-brand-500" /> {item.label}
                    </span>
                    <span className="text-[0.68rem] tabular-nums text-ink-500">
                      {item.value} / {item.total}
                    </span>
                  </div>
                  <ProgressBar value={percent} showLabel={false} size="sm" />
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink-900">Recent imports</h2>
              <Link
                href="/admin/bulk-import"
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                Import centre →
              </Link>
            </div>
            {stats.imports.length === 0 ? (
              <p className="mt-3 text-xs text-ink-500">No imports yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-line">
                {stats.imports.map((job) => (
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
                      {job.category} · {job.totalRows} rows · {job.validRows} valid
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-bold text-ink-900">Quick actions</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                { label: "Content", href: "/admin/content", icon: Database },
                { label: "Students", href: "/admin/students", icon: Users },
                { label: "Automations", href: "/admin/automations", icon: Radar },
                { label: "Bulk import", href: "/admin/bulk-import", icon: Upload },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
                  >
                    <Icon className="size-4" /> {action.label}
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-5 p-5">
        <h2 className="text-sm font-bold text-ink-900">Administrator notes</h2>
        <ul className="mt-2.5 grid gap-2 text-xs text-ink-700 sm:grid-cols-2">
          <li>• Demo data is seeded into PostgreSQL through Prisma-free Drizzle ORM.</li>
          <li>• Destructive actions always show a confirmation dialog.</li>
          <li>• Automation rules can be run manually from the control centre.</li>
          <li>• Bulk imports validate rows before anything is committed.</li>
        </ul>
      </Card>
    </>
  );
}
